import './WalletConnect.css'

type Props = {
  onCoinbase: () => void
  onWalletConnect: () => void
  connecting?: boolean
  error?: string
}

export default function WalletConnect({ onCoinbase, onWalletConnect, connecting, error }: Props) {
  return (
    <div className="wallet-connect">
      <h2 className="wallet-connect-title">Connect wallet</h2>
      <p className="wallet-connect-subtitle">Choose a wallet to continue</p>
      {error && <p className="wallet-connect-error">{error}</p>}
      <div className="wallet-connect-actions">
        <button
          type="button"
          className="wallet-connect-btn wallet-connect-btn--coinbase"
          onClick={onCoinbase}
          disabled={connecting}
        >
          {connecting ? 'Connecting…' : 'Coinbase'}
        </button>
        <button
          type="button"
          className="wallet-connect-btn wallet-connect-btn--walletconnect"
          onClick={onWalletConnect}
          disabled={connecting}
        >
          WalletConnect
        </button>
      </div>
    </div>
  )
}
