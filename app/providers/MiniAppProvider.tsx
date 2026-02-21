import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'

type MiniAppContext = Awaited<ReturnType<typeof getContext>>
async function getContext() {
  return sdk.context
}

interface MiniAppContextValue {
  context: MiniAppContext | null
  isReady: boolean
}

const MiniAppContext = createContext<MiniAppContextValue | null>(null)

export function useMiniApp() {
  const ctx = useContext(MiniAppContext)
  return ctx ?? { context: null, isReady: true }
}

export function MiniAppProvider({ children }: { children: ReactNode }) {
  const [context, setContext] = useState<MiniAppContext | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const init = async () => {
      try {
        const isInApp = await sdk.isInMiniApp()
        if (isInApp) {
          const ctx = await getContext()
          setContext(ctx)
          await sdk.actions.ready()
        }
      } finally {
        setIsReady(true)
      }
    }
    init()
  }, [])

  return (
    <MiniAppContext.Provider value={{ context, isReady }}>
      {children}
    </MiniAppContext.Provider>
  )
}
