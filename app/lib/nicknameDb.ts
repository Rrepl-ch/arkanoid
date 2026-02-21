import { withRedis, isRedisAvailable } from './redis'
import {
  getNicknameByAddress as getMem,
  getAddressByNickname as getAddrMem,
} from './store'

const ADDR_KEY = (address: string) => `retro:nickname:addr:${address.toLowerCase()}`
const NAME_KEY = (normalizedNick: string) => `retro:nickname:name:${normalizedNick.toLowerCase()}`

export async function getNickname(address: string): Promise<string | null> {
  if (!isRedisAvailable()) return getMem(address)
  try {
    return await withRedis(async (client) => {
      const raw = await client.get(ADDR_KEY(address))
      return typeof raw === 'string' && raw.trim() ? raw : null
    })
  } catch {
    return getMem(address)
  }
}

export async function setNickname(address: string, nickname: string): Promise<void> {
  const addr = address.toLowerCase()
  const nick = nickname.trim()
  if (!isRedisAvailable()) {
    const { setNicknameByAddress } = await import('./store')
    setNicknameByAddress(address, nick)
    return
  }
  try {
    await withRedis(async (client) => {
      const nickKey = NAME_KEY(nick)
      const existingForNick = await client.get(nickKey)
      const existingForAddr = await client.get(ADDR_KEY(address))
      if (existingForNick && existingForNick.toLowerCase() !== addr) {
        throw new Error('Nickname already taken')
      }
      const oldNick = typeof existingForAddr === 'string' ? existingForAddr : null
      if (oldNick && oldNick.toLowerCase() !== nick.toLowerCase()) {
        await client.del(NAME_KEY(oldNick))
      }
      await client.set(nickKey, addr)
      await client.set(ADDR_KEY(address), nick)
    })
  } catch (e) {
    if (e instanceof Error && e.message === 'Nickname already taken') throw e
    const { setNicknameByAddress } = await import('./store')
    setNicknameByAddress(address, nick)
  }
}

export async function getAddressByNickname(nickname: string): Promise<string | null> {
  if (!isRedisAvailable()) return getAddrMem(nickname)
  try {
    return await withRedis(async (client) => {
      const raw = await client.get(NAME_KEY(nickname))
      return typeof raw === 'string' ? raw : null
    })
  } catch {
    return getAddrMem(nickname)
  }
}
