import { hashApiKey } from '@/lib/api-key-utils'
import prisma from '@/lib/prisma'

export async function authenticateApiKey(request: Request): Promise<{
  ok: boolean
  apiKey?: { id: number; nama: string }
  error?: string
}> {
  const apiKeyHeader = request.headers.get('x-api-key')

  if (!apiKeyHeader) {
    return { ok: false, error: 'Missing X-API-Key header' }
  }

  const hash = hashApiKey(apiKeyHeader)
  const apiKey = await prisma.apiKey.findUnique({ where: { keyHash: hash } })

  if (!apiKey) {
    return { ok: false, error: 'Invalid API key' }
  }

  if (!apiKey.aktif) {
    return { ok: false, error: 'API key disabled' }
  }

  prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  }).catch(() => {})

  return { ok: true, apiKey: { id: apiKey.id, nama: apiKey.nama } }
}