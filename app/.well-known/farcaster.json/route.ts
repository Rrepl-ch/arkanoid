import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Base Build Account association: https://www.base.dev/preview?tab=account
 * Вставь туда header, payload, signature в Vercel → Environment Variables:
 * FARCASTER_ACCOUNT_HEADER, FARCASTER_ACCOUNT_PAYLOAD, FARCASTER_ACCOUNT_SIGNATURE
 */

function getBaseUrl(req: NextRequest): string {
  const url = process.env.NEXT_PUBLIC_URL
  if (url && typeof url === 'string') return url.replace(/\/$/, '')
  try {
    const host = req.headers.get('host') ?? ''
    const proto = req.headers.get('x-forwarded-proto') ?? (req.headers.get('x-forwarded-ssl') === 'on' ? 'https' : 'http')
    if (host) return `${proto}://${host}`
  } catch {
    // ignore
  }
  return 'https://arkanod.vercel.app'
}

export async function GET(request: NextRequest) {
  try {
    const base = getBaseUrl(request)
    const manifest = {
    accountAssociation: {
      header: process.env.FARCASTER_ACCOUNT_HEADER ?? '',
      payload: process.env.FARCASTER_ACCOUNT_PAYLOAD ?? '',
      signature: process.env.FARCASTER_ACCOUNT_SIGNATURE ?? '',
    },
    miniapp: {
      version: '1',
      name: 'Arkanoid',
      homeUrl: base,
      iconUrl: `${base}/icon.png`,
      splashImageUrl: `${base}/splash.png`,
      splashBackgroundColor: '#0c0a14',
      webhookUrl: `${base}/api/webhook`,
      subtitle: 'Classic brick breaker',
      description: 'Break bricks, catch power-ups, and clear 20 levels. Lives, multiball, and retro style.',
      screenshotUrls: [`${base}/s1.png`, `${base}/s2.png`, `${base}/s3.png`],
      primaryCategory: 'games',
      tags: ['games', 'retro', 'arkanoid', 'miniapp', 'base'],
      heroImageUrl: `${base}/og.png`,
      tagline: 'Play instantly',
      ogTitle: 'Arkanoid',
      ogDescription: 'Classic brick breaker with power-ups. Play on Base.',
      ogImageUrl: `${base}/og.png`,
      noindex: false,
    },
  }
    return NextResponse.json(manifest, {
      headers: {
        'Cache-Control': 'public, max-age=300',
      },
    })
  } catch (err) {
    return NextResponse.json(
      { error: 'Manifest error' },
      { status: 500 }
    )
  }
}
