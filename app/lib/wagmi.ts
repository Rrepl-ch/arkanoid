import { createConfig, http } from 'wagmi'
import { base } from 'wagmi/chains'
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector'
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors'

const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
  'd573c8a861fbe6e691c284093d3d3b53'

const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  (typeof window !== 'undefined' ? window.location.origin : 'https://your-app.com')

export const config = createConfig({
  chains: [base],
  transports: { [base.id]: http() },
  connectors: [
    farcasterMiniApp(),
    coinbaseWallet({ appName: 'Arkanod', appLogoUrl: `${appUrl}/icon.png` }),
    walletConnect({ projectId }),
    injected(),
  ],
})
