import { hashApiKey } from '@/lib/api-key-utils'
import prisma from '@/lib/prisma'
import { checkRateLimit, type RateLimitResult } from '@/lib/api-rate-limit'
import { getClientIp } from '@/lib/api-logger'

export type AuthResult = {
  ok: boolean
  apiKey?: { id: number; nama: string }
  rateLimit?: RateLimitResult
  ip?: string
  userAgent?: string
  error?: string
  statusCode?: number
}

export async function authenticateApiKey(request: Request): Promise<AuthResult> {
  const apiKeyHeader = request.headers.get('x-api-key')
  const ip = getClientIp(request)
  const userAgent = request.headers.get('user-agent') ?? undefined

  if (!apiKeyHeader) {
    return {
      ok: false,
      error: 'Missing X-API-Key header',
      statusCode: 401,
      ip,
      userAgent,
    }
  }

  const hash = hashApiKey(apiKeyHeader)
  const apiKey = await prisma.apiKey.findUnique({ where: { keyHash: hash } })

  if (!apiKey) {
    return {
      ok: false,
      error: 'Invalid API key',
      statusCode: 401,
      ip,
      userAgent,
    }
  }

  if (!apiKey.aktif) {
    return {
      ok: false,
      error: 'API key disabled',
      statusCode: 401,
      ip,
      userAgent,
    }
  }

  // Rate limit check
  const rateLimit = checkRateLimit(`key_${apiKey.id}`)
  if (!rateLimit.ok) {
    return {
      ok: false,
      error: 'Rate limit exceeded. Max 60 request per minute.',
      statusCode: 429,
      rateLimit,
      ip,
      userAgent,
      apiKey: { id: apiKey.id, nama: apiKey.nama },
    }
  }

  // Update lastUsedAt (fire and forget)
  prisma.apiKey
    .update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    })
    .catch(() => {})

  return {
    ok: true,
    apiKey: { id: apiKey.id, nama: apiKey.nama },
    rateLimit,
    ip,
    userAgent,
  }
}