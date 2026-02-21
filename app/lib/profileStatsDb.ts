import { withRedis, isRedisAvailable } from './redis'
import { getProfileStats as getMem, setProfileStats as setMem } from './store'

const PROFILE_KEY = (address: string) => `retro:profile:${address.toLowerCase()}`

export async function getProfileStats(address: string): Promise<string | null> {
  if (!isRedisAvailable()) return getMem(address)
  try {
    return await withRedis(async (client) => {
      const raw = await client.get(PROFILE_KEY(address))
      return typeof raw === 'string' ? raw : null
    })
  } catch {
    return getMem(address)
  }
}

export async function setProfileStats(address: string, json: string): Promise<void> {
  if (!isRedisAvailable()) {
    setMem(address, json)
    return
  }
  try {
    await withRedis(async (client) => {
      await client.set(PROFILE_KEY(address), json)
    })
  } catch {
    setMem(address, json)
  }
}
