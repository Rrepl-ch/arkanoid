import { NextRequest, NextResponse } from 'next/server'
import { getProfileStats, setProfileStats } from '@/app/lib/profileStatsDb'

type ArkanoidStats = {
  gamesPlayed: number
  bestScore: number
  totalScore: number
  maxLevelReached: number
  checkInCount: number
  connectedWithCoinbaseAt?: number
}

function sanitizeStats(raw: Partial<ArkanoidStats> | null | undefined): ArkanoidStats {
  return {
    gamesPlayed: Number(raw?.gamesPlayed ?? 0) || 0,
    bestScore: Number(raw?.bestScore ?? 0) || 0,
    totalScore: Number(raw?.totalScore ?? 0) || 0,
    maxLevelReached: Number(raw?.maxLevelReached ?? 0) || 0,
    checkInCount: Number(raw?.checkInCount ?? 0) || 0,
    connectedWithCoinbaseAt:
      raw?.connectedWithCoinbaseAt != null && Number.isFinite(Number(raw.connectedWithCoinbaseAt))
        ? Number(raw.connectedWithCoinbaseAt)
        : undefined,
  }
}

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get('address')?.trim()?.toLowerCase() ?? ''
  if (!/^0x[a-f0-9]{40}$/i.test(address)) {
    return NextResponse.json({ error: 'Invalid address' }, { status: 400 })
  }
  const raw = await getProfileStats(address)
  if (!raw) return NextResponse.json({ stats: null })
  try {
    const stats = sanitizeStats(JSON.parse(raw) as Partial<ArkanoidStats>)
    return NextResponse.json({ stats })
  } catch {
    return NextResponse.json({ stats: null })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const address = (body.address as string)?.trim()?.toLowerCase() ?? ''
    const stats = sanitizeStats((body.stats ?? null) as Partial<ArkanoidStats> | null)
    if (!/^0x[a-f0-9]{40}$/i.test(address)) {
      return NextResponse.json({ error: 'Invalid address' }, { status: 400 })
    }
    await setProfileStats(address, JSON.stringify(stats))
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
