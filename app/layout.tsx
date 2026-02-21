import type { Metadata } from 'next'
import { Providers } from './providers'
import './globals.css'

const baseUrl = process.env.NEXT_PUBLIC_URL || ''

export const metadata: Metadata = {
  title: 'Arkanoid',
  description: 'Arkanoid miniapp',
  icons: { icon: '/favicon.svg' },
  other: {
    'base:app_id': '6999e67ef949e3ecd6eb1840',
    'fc:miniapp': JSON.stringify({
      version: 'next',
      imageUrl: baseUrl ? `${baseUrl}/embed.png` : '/embed.png',
      button: {
        title: 'Play',
        action: {
          type: 'launch_miniapp',
          name: 'Arkanoid',
          url: baseUrl || undefined,
          splashImageUrl: baseUrl ? `${baseUrl}/splash.png` : '/splash.png',
          splashBackgroundColor: '#0c0a14',
        },
      },
    }),
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('arkanoid-theme');document.documentElement.setAttribute('data-theme',t==='light'?'light':'dark');})();`,
          }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
