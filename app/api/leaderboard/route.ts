import { NextRequest, NextResponse } from 'next/server'
import { getLeaderboard, addLeaderboardEntry, getBestScoreByAddress } from '@/app/lib/store'
import {
  isRedisAvailable,
  getLeaderboardRedis,
  addLeaderboardEntryRedis,
  getBestScoreByAddressRedis,
} from '@/app/lib/leaderboard'

function isValidAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(String(addr).trim())
}

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get('address')
  if (address) {
    const best = isRedisAvailable()
      ? await getBestScoreByAddressRedis(address)
      : getBestScoreByAddress(address)
    return NextResponse.json({ best })
  }
  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit')) || 20, 100)
  const entries = isRedisAvailable() ? await getLeaderboardRedis(limit) : getLeaderboard(limit)
  const list = entries.map((e) => ({
    address: e.address,
    nickname: e.nickname,
    score: e.score,
    avatar: e.avatar ?? null,
    updatedAt: e.timestamp,
  }))
  return NextResponse.json(list)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nickname, score, address, avatar } = body
    if (typeof nickname !== 'string' || typeof score !== 'number' || !address) {
      return NextResponse.json(
        { error: 'Missing or invalid nickname, score, or address' },
        { status: 400 }
      )
    }
    const floorScore = Math.floor(score)
    const addr = String(address).trim()
    if (!isValidAddress(addr)) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 })
    }
    const entry = {
      nickname: nickname.trim(),
      score: floorScore,
      address: addr,
      carId: 0,
      avatar: typeof avatar === 'string' ? avatar : '',
    }
    if (isRedisAvailable()) {
      await addLeaderboardEntryRedis(entry)
    } else {
      addLeaderboardEntry({ ...entry, address: addr.toLowerCase() })
    }
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
