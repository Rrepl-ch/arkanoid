import type { Connector } from 'wagmi'
import './WalletConnect.css'

type Props = {
  connectors: readonly Connector[] | Connector[]
  connect: (params: { connector: Connector }) => void
  connecting?: boolean
  error?: string
}

export default function WalletConnect({ connectors, connect, connecting, error }: Props) {
  const list = Array.isArray(connectors) ? connectors : []
  const coinbaseConnector = list[1] ?? list[0]
  const otherConnector = list[2] ?? list[3] ?? list[0]

  const handleConnect = (connector: Connector | undefined) => {
    if (!connector) return
    connect({ connector })
  }

  return (
    <div className="wallet-connect">
      <h2 className="wallet-connect-title">Connect wallet</h2>
      <p className="wallet-connect-subtitle">Choose a wallet to continue</p>
      {error && <p className="wallet-connect-error">{error}</p>}
      {list.length > 0 && (
        <div className="wallet-connect-actions">
          <button
            type="button"
            className="wallet-connect-btn wallet-connect-btn--coinbase"
            onClick={() => handleConnect(coinbaseConnector)}
            disabled={connecting || !coinbaseConnector}
          >
            {connecting ? 'Connecting…' : 'Connect with Coinbase'}
          </button>
          <button
            type="button"
            className="wallet-connect-btn wallet-connect-btn--walletconnect"
            onClick={() => handleConnect(otherConnector)}
            disabled={connecting || !otherConnector}
          >
            Other Wallets
          </button>
        </div>
      )}
    </div>
  )
}
