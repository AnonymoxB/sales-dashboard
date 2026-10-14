import prisma from '@/lib/prisma'

type LogParams = {
  apiKeyId?: number
  apiKeyName?: string
  endpoint: string
  method: string
  statusCode: number
  result?: {
    created: number
    updated: number
    deleted: number
    skipped: number
    failed: number
  }
  durationMs: number
  ipAddress?: string
  userAgent?: string
  errorMsg?: string
}

export async function logApiCall(params: LogParams): Promise<void> {
  try {
    await prisma.apiLog.create({
      data: {
        idApiKey: params.apiKeyId,
        apiKeyName: params.apiKeyName,
        endpoint: params.endpoint,
        method: params.method,
        statusCode: params.statusCode,
        created: params.result?.created ?? 0,
        updated: params.result?.updated ?? 0,
        deleted: params.result?.deleted ?? 0,
        skipped: params.result?.skipped ?? 0,
        failed: params.result?.failed ?? 0,
        durationMs: params.durationMs,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        errorMsg: params.errorMsg,
      },
    })
  } catch (e) {
    console.error('[api-logger] Failed to write log:', e)
  }
}

export function getClientIp(request: Request): string | undefined {
  const headers = request.headers
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    undefined
  )
}