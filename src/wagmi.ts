import { createConfig, http } from 'wagmi'
import { base } from 'wagmi/chains'
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector'
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors'

const projectId =
  (typeof import.meta !== 'undefined' &&
    (import.meta as { env?: { VITE_WALLETCONNECT_PROJECT_ID?: string } }).env?.VITE_WALLETCONNECT_PROJECT_ID) ||
  'd573c8a861fbe6e691c284093d3d3b53'

const appUrl =
  (typeof import.meta !== 'undefined' &&
    (import.meta as { env?: { VITE_APP_URL?: string } }).env?.VITE_APP_URL) ||
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
