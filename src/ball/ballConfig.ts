/** Free balls first, then premium: Emerald, Ruby, Gold. Яркие цвета. */
export const BALLS = [
  { id: 'classic', name: 'Classic', color: '#e8e8f0', isGolden: false, priceEth: undefined },
  { id: 'cyan', name: 'Cyan', color: '#00d4e8', isGolden: false, priceEth: undefined },
  { id: 'orange', name: 'Orange', color: '#ff9f43', isGolden: false, priceEth: undefined },
  { id: 'pink', name: 'Pink', color: '#ff6b9d', isGolden: false, priceEth: undefined },
  { id: 'purple', name: 'Purple', color: '#b388ff', isGolden: false, priceEth: undefined },
  { id: 'brown', name: 'Brown', color: '#c4a574', isGolden: false, priceEth: undefined },
  { id: 'blue', name: 'Blue', color: '#42a5f5', isGolden: false, priceEth: undefined },
  { id: 'lime', name: 'Lime', color: '#a3e635', isGolden: false, priceEth: undefined },
  { id: 'teal', name: 'Teal', color: '#2dd4bf', isGolden: false, priceEth: undefined },
  { id: 'green', name: 'Emerald', color: '#00ff88', isGolden: false, priceEth: '0.00025' as const },
  { id: 'red', name: 'Ruby', color: '#ff3b30', isGolden: false, priceEth: '0.0005' as const },
  { id: 'gold', name: 'Gold', color: '#ffeb3b', isGolden: true, priceEth: '0.001' as const },
] as const

export const GOLDEN_BALL_PRICE_ETH = '0.001'
export const EMERALD_BALL_PRICE_ETH = '0.00025'
export const RUBY_BALL_PRICE_ETH = '0.0005'

export function getBallPriceEth(ballId: string): string | undefined {
  const b = BALLS.find((x) => x.id === ballId)
  return b && 'priceEth' in b ? (b as { priceEth?: string }).priceEth : undefined
}

export function getBallById(id: string) {
  return BALLS.find((b) => b.id === id)
}

export function getBallColor(id: string): string {
  const b = getBallById(id)
  return b ? b.color : '#ffffff'
}
