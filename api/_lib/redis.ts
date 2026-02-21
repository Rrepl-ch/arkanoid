type Primitive = string | number
type Command = [string, ...Primitive[]]

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
    const key = asString(cmd[1] ?? '')
    return store.kv.get(key) ?? null
  }
  if (op === 'SET') {
    const key = asString(cmd[1] ?? '')
    const value = asString(cmd[2] ?? '')
    store.kv.set(key, value)
    return 'OK'
  }
  if (op === 'DEL') {
    const keys = cmd.slice(1).map(asString)
    let removed = 0
    for (const key of keys) {
      if (store.kv.delete(key)) removed++
    }
    return removed
  }
  if (op === 'MGET') {
    const keys = cmd.slice(1).map(asString)
    return keys.map((k) => store.kv.get(k) ?? null)
  }
  if (op === 'ZSCORE') {
    const key = asString(cmd[1] ?? '')
    const member = asString(cmd[2] ?? '')
    const z = store.zset.get(key)
    const score = z?.get(member)
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

function parseUpstashPipelineResponse(json: unknown): unknown[] {
  if (Array.isArray(json)) {
    // Upstash pipeline usually returns [{result: ...}, ...]
    return json.map((item) => {
      if (item && typeof item === 'object' && 'error' in item) {
        throw new Error(String((item as { error: unknown }).error))
      }
      if (item && typeof item === 'object' && 'result' in item) {
        return (item as { result: unknown }).result
      }
      return item
    })
  }
  if (json && typeof json === 'object' && 'result' in json) {
    const result = (json as { result: unknown }).result
    if (Array.isArray(result)) return result
    return [result]
  }
  return []
}

export async function redisPipeline(commands: Command[]): Promise<unknown[]> {
  const url = process.env.REDIS_REST_URL
  const token = process.env.REDIS_REST_TOKEN

  if (!url || !token) {
    return commands.map((cmd) => memoryExec(cmd))
  }

  const res = await fetch(`${url.replace(/\/$/, '')}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Redis REST failed: ${res.status} ${body}`)
  }
  const json = (await res.json()) as unknown
  return parseUpstashPipelineResponse(json)
}

export async function redisExec(command: Command): Promise<unknown> {
  const out = await redisPipeline([command])
  return out[0]
}
