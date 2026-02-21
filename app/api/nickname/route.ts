import { NextRequest, NextResponse } from 'next/server'
import { getNickname, setNickname } from '@/app/lib/nicknameDb'

const NICK_RE = /^[a-zA-Z0-9_]{2,24}$/

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get('address')?.trim()?.toLowerCase() ?? ''
  if (!/^0x[a-f0-9]{40}$/i.test(address)) {
    return NextResponse.json({ error: 'Invalid address' }, { status: 400 })
  }
  const nickname = await getNickname(address)
  return NextResponse.json({ nickname: nickname?.trim() || null })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const address = (body.address as string)?.trim()?.toLowerCase() ?? ''
    const nickname = (body.nickname as string)?.trim() ?? ''
    if (!/^0x[a-f0-9]{40}$/i.test(address)) {
      return NextResponse.json({ error: 'Invalid address' }, { status: 400 })
    }
    if (!NICK_RE.test(nickname)) {
      return NextResponse.json({ error: 'Invalid nickname' }, { status: 400 })
    }
    await setNickname(address, nickname)
    return NextResponse.json({ success: true, nickname })
  } catch (e) {
    if (e instanceof Error && e.message === 'Nickname already taken') {
      return NextResponse.json({ error: 'Nickname already taken' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
