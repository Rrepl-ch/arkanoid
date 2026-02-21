import type { Metadata } from 'next'
import { Providers } from './providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'Arkanoid',
  description: 'Arkanoid miniapp',
  icons: { icon: '/favicon.svg' },
  other: {
    'fc:miniapp': JSON.stringify({
      version: 'next',
      imageUrl: 'https://__APP_URL__/embed.png',
      button: {
        title: 'Play',
        action: {
          type: 'launch_miniapp',
          name: 'Arkanoid',
          url: 'https://__APP_URL__',
          splashImageUrl: 'https://__APP_URL__/splash.png',
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
