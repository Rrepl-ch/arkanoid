import { createClient } from 'redis'

// REDIS_URL (crazy-racer) or KV_URL (Vercel Storage / Marketplace Redis)
const REDIS_URL = process.env.REDIS_URL || process.env.KV_URL

export function isRedisAvailable(): boolean {
  return !!REDIS_URL
}

export async function withRedis<T>(
  fn: (client: ReturnType<typeof createClient>) => Promise<T>
): Promise<T> {
  if (!REDIS_URL) throw new Error('REDIS_URL or KV_URL not set')
  const client = createClient({ url: REDIS_URL })
  await client.connect()
  try {
    return await fn(client)
  } finally {
    await client.quit()
  }
}
