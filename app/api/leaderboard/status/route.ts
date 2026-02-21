import { NextResponse } from 'next/server'
import { isRedisAvailable } from '@/app/lib/leaderboard'
import { withRedis } from '@/app/lib/redis'

export async function GET() {
  const configured = isRedisAvailable()
  let connected = false
  if (configured) {
    try {
      await withRedis((client) => client.ping())
      connected = true
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
        ? 'REDIS_URL/KV_URL is set but connection failed. Try rediss:// for TLS, or check firewall.'
        : 'In Vercel: connect Redis (Storage or Marketplace), then set REDIS_URL or use auto-injected KV_URL in Environment Variables.',
  })
}
