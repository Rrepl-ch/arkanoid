import Redis from 'ioredis'

type Primitive = string | number
type Command = [string, ...Primitive[]]

const REDIS_URL = process.env.REDIS_URL

/* ── In-memory fallback (used when REDIS_URL is not set) ── */

type MemoryStore = {
  kv: Map<string, string>
  zset: Map<string, Map<string, number>>
}

function getMemoryStore(): MemoryStore {
  const g = globalThis as unknown as { __retroRedisMemory?: MemoryStore }
  if (!g.__retroRedisMemory) {
    g.__retroRedisMemory = {
      kv: new Map<string, string>(),
      zset: new Map<string, Map<string, number>>(),
    }
  }
  return g.__retroRedisMemory
}

function asString(v: Primitive): string {
  return typeof v === 'number' ? String(v) : v
}

function memoryExec(cmd: Command): unknown {
  const store = getMemoryStore()
  const op = cmd[0].toUpperCase()

  if (op === 'GET') {
    return store.kv.get(asString(cmd[1] ?? '')) ?? null
  }
  if (op === 'SET') {
    store.kv.set(asString(cmd[1] ?? ''), asString(cmd[2] ?? ''))
    return 'OK'
  }
  if (op === 'DEL') {
    let removed = 0
    for (const key of cmd.slice(1).map(asString)) {
      if (store.kv.delete(key)) removed++
    }
    return removed
  }
  if (op === 'MGET') {
    return cmd.slice(1).map(asString).map((k) => store.kv.get(k) ?? null)
  }
  if (op === 'ZSCORE') {
    const z = store.zset.get(asString(cmd[1] ?? ''))
    const score = z?.get(asString(cmd[2] ?? ''))
    return score == null ? null : String(score)
  }
  if (op === 'ZADD') {
    const key = asString(cmd[1] ?? '')
    const score = Number(cmd[2] ?? 0)
    const member = asString(cmd[3] ?? '')
    let z = store.zset.get(key)
    if (!z) {
      z = new Map<string, number>()
      store.zset.set(key, z)
    }
    z.set(member, score)
    return 1
  }
  if (op === 'ZREVRANGE') {
    const key = asString(cmd[1] ?? '')
    const start = Number(cmd[2] ?? 0)
    const stop = Number(cmd[3] ?? -1)
    const withScores = String(cmd[4] ?? '').toUpperCase() === 'WITHSCORES'
    const z = store.zset.get(key)
    if (!z) return []
    const entries = [...z.entries()].sort((a, b) => b[1] - a[1])
    const end = stop >= 0 ? stop + 1 : entries.length
    const slice = entries.slice(start, end)
    if (!withScores) return slice.map(([member]) => member)
    const flat: string[] = []
    for (const [member, score] of slice) {
      flat.push(member, String(score))
    }
    return flat
  }

  throw new Error(`Unsupported memory Redis command: ${op}`)
}

/* ── ioredis client ── */

let _client: Redis | null = null

function getClient(): Redis {
  if (!REDIS_URL) throw new Error('REDIS_URL not set')
  if (!_client) {
    _client = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 1,
      connectTimeout: 5000,
      lazyConnect: true,
    })
    _client.on('error', () => {})
  }
  return _client
}

export async function redisExec(command: Command): Promise<unknown> {
  if (!REDIS_URL) return memoryExec(command)
  try {
    const client = getClient()
    const args = command.map(String)
    return await client.call(args[0], ...args.slice(1))
  } catch {
    return memoryExec(command)
  }
}

export async function redisPipeline(commands: Command[]): Promise<unknown[]> {
  if (!REDIS_URL) return commands.map((cmd) => memoryExec(cmd))
  try {
    const client = getClient()
    const p = client.pipeline()
    for (const cmd of commands) {
      const args = cmd.map(String)
      p.call(args[0], ...args.slice(1))
    }
    const results = await p.exec()
    if (!results) return commands.map((cmd) => memoryExec(cmd))
    return results.map(([err, val]) => {
      if (err) throw err
      return val
    })
  } catch {
    return commands.map((cmd) => memoryExec(cmd))
  }
}
