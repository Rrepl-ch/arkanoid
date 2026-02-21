import { NextResponse } from 'next/server'
import {
  isRedisAvailable,
  isUpstashAvailable,
  getUpstashClient,
} from '@/app/lib/leaderboard'
import { withRedis, isRedisAvailable as isTcpRedisAvailable } from '@/app/lib/redis'

export async function GET() {
  const configured = isRedisAvailable()
  let connected = false
  let mode = 'none'

  if (isUpstashAvailable()) {
    mode = 'upstash'
    try {
      const redis = getUpstashClient()
      await redis.get('_status_')
      connected = true
    } catch {
      connected = false
    }
  } else if (isTcpRedisAvailable()) {
    mode = 'tcp'
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
    mode,
    message: connected
      ? `Leaderboard persists (${mode} connected).`
      : isUpstashAvailable()
        ? 'REDIS_REST_URL/TOKEN set but connection failed. Check vars and redeploy.'
        : isTcpRedisAvailable()
          ? 'REDIS_URL set but TCP connection failed. Use Upstash: add REDIS_REST_URL + REDIS_REST_TOKEN from upstash.com (free).'
          : 'Add REDIS_REST_URL and REDIS_REST_TOKEN from upstash.com (free) in Vercel → Settings → Environment Variables.',
  })
}
