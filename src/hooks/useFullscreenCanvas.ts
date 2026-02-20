import { useCallback, useEffect, useRef, useState } from 'react'

export function useWindowSize() {
  const [size, setSize] = useState({ w: typeof window !== 'undefined' ? window.innerWidth : 320, h: typeof window !== 'undefined' ? window.innerHeight : 400 })
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return size
}

/** reattachKey — при смене значения эффект заново вешает обработчики на canvas (нужно после ремаунта канваса, например после «Again»). */
export function useCanvasMouse(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  enabled: boolean,
  reattachKey = 0
) {
  const mouseXRef = useRef(0)
  const update = useCallback((e: MouseEvent | Touch) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width
    mouseXRef.current = x
  }, [canvasRef])

  useEffect(() => {
    if (!enabled) return
    const canvas = canvasRef.current
    if (!canvas) return
    const onMouse = (e: MouseEvent) => update(e)
    const onTouch = (e: TouchEvent) => { if (e.touches[0]) update(e.touches[0]) }
    canvas.addEventListener('mousemove', onMouse)
    canvas.addEventListener('touchmove', onTouch, { passive: true })
    return () => {
      canvas.removeEventListener('mousemove', onMouse)
      canvas.removeEventListener('touchmove', onTouch)
    }
  }, [enabled, update, canvasRef, reattachKey])
  return mouseXRef
}
