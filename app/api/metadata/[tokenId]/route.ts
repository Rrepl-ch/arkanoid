import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http } from 'viem'
import { base } from 'viem/chains'

const BALL_NAMES: Record<number, string> = {
  0: 'Classic',
  1: 'Cyan',
  2: 'Orange',
  3: 'Pink',
  4: 'Purple',
  5: 'Brown',
  6: 'Blue',
  7: 'Lime',
  8: 'Teal',
  9: 'Emerald',
  10: 'Ruby',
  11: 'Gold',
}

const ABI = [
  {
    name: 'tokenIdToBallType',
    type: 'function',
    inputs: [{ name: 'tokenId', type: 'uint256', internalType: 'uint256' }],
    outputs: [{ name: '', type: 'uint8', internalType: 'uint8' }],
    stateMutability: 'view',
  },
] as const

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  const { tokenId } = await params
  const id = parseInt(tokenId, 10)
  if (Number.isNaN(id) || id < 1) {
    return NextResponse.json({ error: 'Invalid tokenId' }, { status: 400 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://arkanod.vercel.app'
  let ballType = 0
  const contractAddress = process.env.NEXT_PUBLIC_ARKANOID_BALLS_ADDRESS as `0x${string}` | undefined

  if (contractAddress && contractAddress !== '0x') {
    try {
      const client = createPublicClient({
        chain: base,
        transport: http(),
      })
      const type = await client.readContract({
        address: contractAddress,
        abi: ABI,
        functionName: 'tokenIdToBallType',
        args: [BigInt(id)],
      })
      ballType = Number(type)
    } catch {
      // fallback: ballType stays 0
    }
  }

  const ballName = BALL_NAMES[ballType] ?? `Ball ${ballType}`

  const metadata = {
    name: `${ballName} #${id}`,
    description: `Arkanoid ball NFT on Base. ${ballName} style.`,
    image: `${baseUrl}/icon.png`,
    external_url: baseUrl,
    attributes: [
      { trait_type: 'Ball Type', value: ballName },
      { trait_type: 'Token ID', value: id.toString() },
    ],
  }

  return NextResponse.json(metadata, {
    headers: { 'Cache-Control': 'public, max-age=3600' },
  })
}
