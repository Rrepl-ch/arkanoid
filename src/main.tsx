import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { Providers } from './providers'
import { applyTheme } from './theme/themeStorage'
import './index.css'

applyTheme()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Providers>
      <App />
    </Providers>
  </React.StrictMode>,
)
