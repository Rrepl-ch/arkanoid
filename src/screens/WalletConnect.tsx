import type { Connector } from 'wagmi'
import './WalletConnect.css'

type Props = {
  connectors: readonly Connector[] | Connector[]
  connect: (params: { connector: Connector }) => void
  connecting?: boolean
  error?: string
}

export default function WalletConnect({ connectors, connect, connecting, error }: Props) {
  const coinbaseConnector = connectors[1] ?? connectors[0]
  const otherConnector = connectors[2] ?? connectors[3] ?? connectors[0]

  return (
    <div className="wallet-connect">
      <h2 className="wallet-connect-title">Connect wallet</h2>
      <p className="wallet-connect-subtitle">Choose a wallet to continue</p>
      {error && <p className="wallet-connect-error">{error}</p>}
      {connectors.length > 0 && (
        <div className="wallet-connect-actions">
          <button
            type="button"
            className="wallet-connect-btn wallet-connect-btn--coinbase"
            onClick={() => connect({ connector: coinbaseConnector })}
            disabled={connecting}
          >
            {connecting ? 'Connecting…' : 'Connect with Coinbase'}
          </button>
          <button
            type="button"
            className="wallet-connect-btn wallet-connect-btn--walletconnect"
            onClick={() => connect({ connector: otherConnector })}
            disabled={connecting}
          >
            Other Wallets
          </button>
        </div>
      )}
    </div>
  )
}
