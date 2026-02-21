import { createConnection } from 'net'

type Primitive = string | number
type Command = [string, ...Primitive[]]

const REDIS_URL = process.env.REDIS_URL

/* ── Parse redis:// URL ── */

function parseRedisUrl(url: string): { host: string; port: number; password?: string } {
  const u = new URL(url)
  return {
    host: u.hostname,
    port: parseInt(u.port, 10) || 6379,
    password: u.password ? decodeURIComponent(u.password) : undefined,
  }
}

/* ── RESP protocol encode/decode ── */

function encode(args: string[]): string {
  let s = `*${args.length}\r\n`
  for (const a of args) {
    s += `$${Buffer.byteLength(a, 'utf8')}\r\n${a}\r\n`
  }
  return s
}

function decode(buf: string, pos: number): [unknown, number] {
  const crlf = buf.indexOf('\r\n', pos)
  if (crlf === -1) throw new Error('incomplete')
  const line = buf.slice(pos + 1, crlf)
  const next = crlf + 2

  switch (buf[pos]) {
    case '+': return [line, next]
    case '-': return [null, next]
    case ':': return [parseInt(line, 10), next]
    case '$': {
      const len = parseInt(line, 10)
      if (len === -1) return [null, next]
      const end = next + len
      if (buf.length < end + 2) throw new Error('incomplete')
      return [buf.slice(next, end), end + 2]
    }
    case '*': {
      const count = parseInt(line, 10)
      if (count === -1) return [null, next]
      let p = next
      const arr: unknown[] = []
      for (let i = 0; i < count; i++) {
        const [val, np] = decode(buf, p)
        arr.push(val)
        p = np
      }
      return [arr, p]
    }
    default: throw new Error(`Unknown RESP type: ${buf[pos]}`)
  }
}

/* ── Raw TCP Redis execution ── */

function rawExec(commands: Command[]): Promise<unknown[]> {
  const config = parseRedisUrl(REDIS_URL!)
  return new Promise((resolve, reject) => {
    const sock = createConnection({ host: config.host, port: config.port })
    sock.setTimeout(5000)

    let payload = ''
    if (config.password) payload += encode(['AUTH', config.password])
    for (const cmd of commands) payload += encode(cmd.map(String))

    const expected = (config.password ? 1 : 0) + commands.length
    const results: unknown[] = []
    let buf = ''
    let done = false

    function finish(err?: Error) {
      if (done) return
      done = true
      sock.destroy()
      if (err) return reject(err)
      resolve(results.slice(config.password ? 1 : 0))
    }

    function tryParse() {
      let pos = 0
      const saved = results.length
      try {
        while (results.length < expected) {
          const [val, next] = decode(buf, pos)
          results.push(val)
          pos = next
        }
        buf = buf.slice(pos)
        finish()
      } catch {
        results.length = saved
      }
    }

    sock.on('data', (chunk) => { buf += chunk.toString('utf8'); tryParse() })
    sock.on('error', (e) => finish(e))
    sock.on('timeout', () => finish(new Error('Redis timeout')))
    sock.on('end', () => { if (!done) tryParse(); if (!done) finish(new Error('Connection closed')) })
    sock.write(payload)
  })
}

/* ── In-memory fallback ── */

type MemoryStore = { kv: Map<string, string>; zset: Map<string, Map<string, number>> }

function mem(): MemoryStore {
  const g = globalThis as unknown as { __rm?: MemoryStore }
  if (!g.__rm) g.__rm = { kv: new Map(), zset: new Map() }
  return g.__rm
}

function s(v: Primitive): string { return String(v) }

function memExec(cmd: Command): unknown {
  const m = mem()
  const op = cmd[0].toUpperCase()

  if (op === 'GET') return m.kv.get(s(cmd[1])) ?? null
  if (op === 'SET') { m.kv.set(s(cmd[1]), s(cmd[2])); return 'OK' }
  if (op === 'DEL') {
    let r = 0; for (let i = 1; i < cmd.length; i++) if (m.kv.delete(s(cmd[i]))) r++; return r
  }
  if (op === 'MGET') return cmd.slice(1).map((k) => m.kv.get(s(k)) ?? null)
  if (op === 'ZSCORE') {
    const sc = m.zset.get(s(cmd[1]))?.get(s(cmd[2])); return sc == null ? null : String(sc)
  }
  if (op === 'ZADD') {
    let z = m.zset.get(s(cmd[1]))
    if (!z) { z = new Map(); m.zset.set(s(cmd[1]), z) }
    z.set(s(cmd[3]), Number(cmd[2])); return 1
  }
  if (op === 'ZREVRANGE') {
    const z = m.zset.get(s(cmd[1])); if (!z) return []
    const entries = [...z.entries()].sort((a, b) => b[1] - a[1])
    const start = Number(cmd[2]), stop = Number(cmd[3])
    const end = stop >= 0 ? stop + 1 : entries.length
    const slice = entries.slice(start, end)
    if (String(cmd[4] ?? '').toUpperCase() !== 'WITHSCORES') return slice.map(([m]) => m)
    const flat: string[] = []
    for (const [member, score] of slice) flat.push(member, String(score))
    return flat
  }
  return null
}

/* ── Public API ── */

export async function redisExec(command: Command): Promise<unknown> {
  if (!REDIS_URL) return memExec(command)
  try {
    const [result] = await rawExec([command])
    return result
  } catch {
    return memExec(command)
  }
}

export async function redisPipeline(commands: Command[]): Promise<unknown[]> {
  if (!REDIS_URL) return commands.map(memExec)
  try {
    return await rawExec(commands)
  } catch {
    return commands.map(memExec)
  }
}
