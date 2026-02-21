type Primitive = string | number
type Command = [string, ...Primitive[]]

/* ── In-memory fallback ── */

type MemoryStore = { kv: Map<string, string>; zset: Map<string, Map<string, number>> }

function mem(): MemoryStore {
  const g = globalThis as unknown as { __rm?: MemoryStore }
  if (!g.__rm) g.__rm = { kv: new Map(), zset: new Map() }
  return g.__rm
}

function memExec(cmd: Command): unknown {
  const m = mem()
  const op = String(cmd[0]).toUpperCase()
  const s = (v: Primitive) => String(v)

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

/* ── Upstash-compatible REST API ── */

const REST_URL = process.env.REDIS_REST_URL || process.env.KV_REST_API_URL
const REST_TOKEN = process.env.REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN

function hasRest(): boolean {
  return !!(REST_URL && REST_TOKEN)
}

async function restPipeline(commands: Command[]): Promise<unknown[]> {
  const res = await fetch(`${REST_URL!.replace(/\/$/, '')}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${REST_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands.map((c) => c.map(String))),
  })
  if (!res.ok) throw new Error(`Redis REST ${res.status}`)
  const json = (await res.json()) as unknown
  if (Array.isArray(json)) {
    return json.map((item: any) => {
      if (item && typeof item === 'object' && 'error' in item && item.error) {
        throw new Error(String(item.error))
      }
      if (item && typeof item === 'object' && 'result' in item) return item.result
      return item
    })
  }
  return []
}

/* ── Public API ── */

export async function redisExec(command: Command): Promise<unknown> {
  if (!hasRest()) return memExec(command)
  try {
    const [result] = await restPipeline([command])
    return result
  } catch {
    return memExec(command)
  }
}

export async function redisPipeline(commands: Command[]): Promise<unknown[]> {
  if (!hasRest()) return commands.map(memExec)
  try {
    return await restPipeline(commands)
  } catch {
    return commands.map(memExec)
  }
}
