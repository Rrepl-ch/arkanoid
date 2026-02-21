import { NextRequest, NextResponse } from 'next/server'

/** Base URL for manifest links (set NEXT_PUBLIC_URL on Vercel, e.g. https://your-app.vercel.app) */
function getBaseUrl(req: NextRequest): string {
  const url = process.env.NEXT_PUBLIC_URL
  if (url) return url.replace(/\/$/, '')
  const host = req.headers.get('host') || 'localhost:3000'
  const proto = req.headers.get('x-forwarded-proto') || 'http'
  return `${proto}://${host}`
}

export async function GET(request: NextRequest) {
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
  return NextResponse.json(manifest)
}
