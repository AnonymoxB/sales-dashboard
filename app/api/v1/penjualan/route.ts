import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiKey } from '@/lib/api-auth'
import { logApiCall } from '@/lib/api-logger'
import { getRateLimitHeaders } from '@/lib/api-rate-limit'
import prisma from '@/lib/prisma'
import { emptyResult, extractArray, num, str } from '@/lib/api-upsert'

type Input = {
  externalId?: string
  tanggal?: string
  kodeSales?: string
  kodePart?: string
  kodeCustomer?: string
  qty?: number
  bonus?: number
  hargaSatuan?: number
  diskon?: number
  deleted?: boolean
}

const ENDPOINT = '/api/v1/penjualan'

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

  const items = extractArray<Input>(body, 'penjualan')
  if (items.length === 0) return NextResponse.json({ error: 'No data' }, { status: 400 })
  if (items.length > 1000) return NextResponse.json({ error: 'Max 1000 per request' }, { status: 400 })

  const [sales, parts, customers] = await Promise.all([
    prisma.sales.findMany({ where: { deletedAt: null }, select: { id: true, kode: true, idCabang: true } }),
    prisma.part.findMany({ where: { deletedAt: null }, select: { id: true, kode: true } }),
    prisma.customer.findMany({ where: { deletedAt: null }, select: { id: true, kode: true } }),
  ])
  const salesMap = new Map(sales.map((s) => [s.kode, s]))
  const partMap = new Map(parts.map((p) => [p.kode, p.id]))
  const custMap = new Map(customers.map((c) => [c.kode, c.id]))

  const result = emptyResult()

  for (let i = 0; i < items.length; i++) {
    const p = items[i]
    try {
      const externalId = p.externalId ? str(p.externalId) : null

      if (p.deleted === true) {
        if (!externalId) {
          result.errors.push({ index: i, message: 'externalId wajib untuk delete' })
          result.failed++
          continue
        }
        const found = await prisma.penjualan.findUnique({ where: { externalId } })
        if (!found) {
          result.errors.push({ index: i, externalId, message: 'Tidak ditemukan' })
          result.failed++
          continue
        }
        if (found.deletedAt) {
          result.skipped++
          continue
        }
        await prisma.penjualan.update({
          where: { id: found.id },
          data: { deletedAt: new Date(), syncedAt: new Date() },
        })
        result.deleted++
        continue
      }

      const tanggal = new Date(str(p.tanggal))
      const kodeSales = str(p.kodeSales)
      const kodePart = str(p.kodePart)
      const kodeCustomer = str(p.kodeCustomer)
      if (isNaN(tanggal.getTime())) {
        result.errors.push({ index: i, message: 'tanggal tidak valid' })
        result.failed++
        continue
      }
      const s = salesMap.get(kodeSales)
      if (!s) {
        result.errors.push({ index: i, message: `Sales "${kodeSales}" tidak ditemukan` })
        result.failed++
        continue
      }
      const idPart = partMap.get(kodePart)
      if (!idPart) {
        result.errors.push({ index: i, message: `Part "${kodePart}" tidak ditemukan` })
        result.failed++
        continue
      }
      const idCustomer = kodeCustomer ? (custMap.get(kodeCustomer) ?? null) : null

      const qty = num(p.qty)
      const hargaSatuan = num(p.hargaSatuan)
      const diskon = num(p.diskon)
      const bonus = num(p.bonus)
      if (qty <= 0) {
        result.errors.push({ index: i, message: 'qty harus > 0' })
        result.failed++
        continue
      }

      const data = {
        tanggal,
        idSales: s.id,
        idPart,
        idCabang: s.idCabang,
        idCustomer,
        qty,
        bonus,
        hargaSatuan,
        diskon,
        totalOmzet: qty * hargaSatuan - diskon,
        source: 'erp',
        syncedAt: new Date(),
        deletedAt: null,
      }

      if (externalId) {
        const existing = await prisma.penjualan.findUnique({ where: { externalId } })
        if (existing) {
          await prisma.penjualan.update({ where: { id: existing.id }, data: { ...data, externalId } })
          result.updated++
          continue
        }
        await prisma.penjualan.create({ data: { ...data, externalId } })
        result.created++
      } else {
        await prisma.penjualan.create({ data })
        result.created++
      }
    } catch (e) {
      result.errors.push({ index: i, externalId: p.externalId, message: (e as Error).message })
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
    prisma.penjualan.count({ where: { deletedAt: null } }),
    prisma.penjualan.count({ where: { NOT: { deletedAt: null } } }),
  ])
  return NextResponse.json(
    {
      endpoint: ENDPOINT,
      authenticatedAs: auth.apiKey?.nama,
      totalActive: active,
      totalSoftDeleted: soft,
      body: '{ penjualan: [{ externalId?, tanggal, kodeSales, kodePart, kodeCustomer?, qty, bonus?, hargaSatuan, diskon?, deleted? }] }',
      note: 'externalId sangat disarankan untuk idempotency. Tanpa externalId, selalu INSERT.',
    },
    { headers: auth.rateLimit ? getRateLimitHeaders(auth.rateLimit) : {} }
  )
}