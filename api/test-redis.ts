import { redisExec } from './_lib/redis'

export default async function handler(_req: any, res: any) {
  try {
    const result = await redisExec(['GET', 'test-key'])
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ ok: true, result }))
  } catch (err: any) {
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: err?.message ?? 'unknown' }))
  }
}
