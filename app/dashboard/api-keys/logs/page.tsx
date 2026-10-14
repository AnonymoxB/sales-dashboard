import { connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { ApiLogsPage } from '@/components/api-logs/api-logs-page'
import { requirePageAccess } from '@/lib/rbac'

export const instant = false

const PAGE_SIZE = 50

type SearchParams = Promise<{
  page?: string
  q?: string
  endpoint?: string
  status?: string
}>

export default async function Page({
  searchParams,
}: {
  searchParams: SearchParams
}) {
    await requirePageAccess('/dashboard/api-keys/logs')
  await connection()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const currentPage = Math.max(1, parseInt(params.page ?? '1') || 1)
  const q = (params.q ?? '').trim()
  const endpoint = (params.endpoint ?? '').trim()
  const status = (params.status ?? '').trim()

  const where = {
    ...(endpoint ? { endpoint } : {}),
    ...(status === 'success'
      ? { statusCode: 200, failed: 0 }
      : status === 'error'
      ? { OR: [{ statusCode: { gte: 400 } }, { failed: { gt: 0 } }] }
      : {}),
    ...(q
      ? {
          OR: [
            { apiKeyName: { contains: q, mode: 'insensitive' as const } },
            { ipAddress: { contains: q, mode: 'insensitive' as const } },
            { endpoint: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  }

  // Ambil 24 jam terakhir untuk summary
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const [
    totalItems,
    logsRaw,
    totalRequests24h,
    failed24h,
    avgDuration24h,
    endpointsList,
  ] = await Promise.all([
    prisma.apiLog.count({ where }),
    prisma.apiLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.apiLog.count({ where: { createdAt: { gte: since24h } } }),
    prisma.apiLog.count({
      where: { createdAt: { gte: since24h }, OR: [{ statusCode: { gte: 400 } }, { failed: { gt: 0 } }] },
    }),
    prisma.apiLog.aggregate({
      _avg: { durationMs: true },
      where: { createdAt: { gte: since24h } },
    }),
    prisma.apiLog.findMany({
      distinct: ['endpoint'],
      select: { endpoint: true },
      orderBy: { endpoint: 'asc' },
    }),
  ])

  const logs = logsRaw.map((l) => ({
    id: l.id.toString(),
    apiKeyName: l.apiKeyName,
    endpoint: l.endpoint,
    method: l.method,
    statusCode: l.statusCode,
    created: l.created,
    updated: l.updated,
    deleted: l.deleted,
    skipped: l.skipped,
    failed: l.failed,
    durationMs: l.durationMs,
    ipAddress: l.ipAddress,
    userAgent: l.userAgent,
    errorMsg: l.errorMsg,
    createdAt: l.createdAt.toISOString(),
  }))

  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">API Logs</h1>
        <p className="text-sm text-muted-foreground">
          Riwayat pemanggilan API dari sistem eksternal
        </p>
      </div>

      <ApiLogsPage
        initialData={logs}
        summary={{
          totalRequests24h,
          failed24h,
          avgDurationMs: Math.round(avgDuration24h._avg.durationMs ?? 0),
          errorRate: totalRequests24h > 0 ? (failed24h / totalRequests24h) * 100 : 0,
        }}
        endpoints={endpointsList.map((e) => e.endpoint)}
        pagination={{
          currentPage,
          totalPages,
          totalItems,
          pageSize: PAGE_SIZE,
        }}
        currentFilters={{ q, endpoint, status }}
      />
    </div>
  )
}