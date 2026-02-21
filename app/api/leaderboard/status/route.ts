import { NextResponse } from 'next/server'
import { isRedisAvailable } from '@/app/lib/leaderboard'
import { withRedis } from '@/app/lib/redis'

export async function GET() {
  const configured = isRedisAvailable()
  let connected = false
  if (configured) {
    try {
      await withRedis(async (client) => {
        await client.ping()
        connected = true
      })
    } catch {
      connected = false
    }
  }
  return NextResponse.json({
    redis: connected,
    configured,
    message: connected
      ? 'Leaderboard persists (Redis connected).'
      : configured
        ? 'REDIS_URL is set but connection failed. Try rediss:// for TLS (Redis Cloud).'
        : 'Add REDIS_URL in Vercel → Settings → Environment Variables (Redis Cloud or Upstash).',
  })
}
