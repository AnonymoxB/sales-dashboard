import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiKey } from '@/lib/api-auth'
import { logApiCall } from '@/lib/api-logger'
import { getRateLimitHeaders } from '@/lib/api-rate-limit'
import prisma from '@/lib/prisma'
import { emptyResult, extractArray, num, str } from '@/lib/api-upsert'

type Input = {
  externalId?: string
  periode?: string
  kodeSales?: string
  targetOmzet?: number
  deleted?: boolean
}

const ENDPOINT = '/api/v1/target'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const auth = await authenticateApiKey(request)

  if (!auth.ok) {
    await logApiCall({
      apiKeyId: auth.apiKey?.id,
      apiKeyName: auth.apiKey?.nama,
      endpoint: ENDPOINT,
      method: 'POST',
      statusCode: auth.statusCode ?? 401,
      durationMs: Date.now() - startTime,
      ipAddress: auth.ip,
      userAgent: auth.userAgent,
      errorMsg: auth.error,
    })
    return NextResponse.json(
      { error: auth.error },
      { status: auth.statusCode ?? 401, headers: auth.rateLimit ? getRateLimitHeaders(auth.rateLimit) : {} }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const items = extractArray<Input>(body, 'target')
  if (items.length === 0) return NextResponse.json({ error: 'No data' }, { status: 400 })

  const sales = await prisma.sales.findMany({
    where: { deletedAt: null },
    select: { id: true, kode: true, idCabang: true },
  })
  const salesMap = new Map(sales.map((s) => [s.kode, s]))

  const result = emptyResult()

  for (let i = 0; i < items.length; i++) {
    const t = items[i]
    try {
      const externalId = t.externalId ? str(t.externalId) : null
      const periode = new Date(str(t.periode))
      const kodeSales = str(t.kodeSales)
      if (isNaN(periode.getTime())) {
        result.errors.push({ index: i, message: 'periode tidak valid' })
        result.failed++
        continue
      }
      const s = salesMap.get(kodeSales)
      if (!s) {
        result.errors.push({ index: i, message: `Sales "${kodeSales}" tidak ditemukan` })
        result.failed++
        continue
      }

      if (t.deleted === true) {
        const found = externalId
          ? await prisma.target.findUnique({ where: { externalId } })
          : await prisma.target.findUnique({ where: { periode_idSales: { periode, idSales: s.id } } })
        if (!found) {
          result.errors.push({ index: i, message: 'Tidak ditemukan' })
          result.failed++
          continue
        }
        if (found.deletedAt) {
          result.skipped++
          continue
        }
        await prisma.target.update({
          where: { id: found.id },
          data: { deletedAt: new Date(), syncedAt: new Date() },
        })
        result.deleted++
        continue
      }

      const targetOmzet = num(t.targetOmzet)

      const existing = externalId
        ? await prisma.target.findUnique({ where: { externalId } })
        : await prisma.target.findUnique({ where: { periode_idSales: { periode, idSales: s.id } } })

      const data = { targetOmzet, source: 'erp', syncedAt: new Date(), deletedAt: null }

      if (existing) {
        await prisma.target.update({
          where: { id: existing.id },
          data: { ...data, externalId: externalId ?? existing.externalId },
        })
        result.updated++
      } else {
        await prisma.target.create({
          data: { ...data, periode, idSales: s.id, idCabang: s.idCabang, externalId },
        })
        result.created++
      }
    } catch (e) {
      result.errors.push({ index: i, externalId: t.externalId, message: (e as Error).message })
      result.failed++
    }
  }

  await logApiCall({
    apiKeyId: auth.apiKey!.id,
    apiKeyName: auth.apiKey!.nama,
    endpoint: ENDPOINT,
    method: 'POST',
    statusCode: 200,
    result,
    durationMs: Date.now() - startTime,
    ipAddress: auth.ip,
    userAgent: auth.userAgent,
  })

  return NextResponse.json(
    { success: result.failed === 0, ...result },
    { headers: auth.rateLimit ? getRateLimitHeaders(auth.rateLimit) : {} }
  )
}

export async function GET(request: NextRequest) {
  const auth = await authenticateApiKey(request)
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.statusCode ?? 401, headers: auth.rateLimit ? getRateLimitHeaders(auth.rateLimit) : {} }
    )
  }
  const [active, soft] = await Promise.all([
    prisma.target.count({ where: { deletedAt: null } }),
    prisma.target.count({ where: { NOT: { deletedAt: null } } }),
  ])
  return NextResponse.json(
    {
      endpoint: ENDPOINT,
      authenticatedAs: auth.apiKey?.nama,
      totalActive: active,
      totalSoftDeleted: soft,
      body: '{ target: [{ externalId?, periode: "YYYY-MM-01", kodeSales, targetOmzet, deleted? }] }',
    },
    { headers: auth.rateLimit ? getRateLimitHeaders(auth.rateLimit) : {} }
  )
}