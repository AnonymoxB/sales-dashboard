import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiKey } from '@/lib/api-auth'
import { logApiCall } from '@/lib/api-logger'
import { getRateLimitHeaders } from '@/lib/api-rate-limit'
import prisma from '@/lib/prisma'
import { emptyResult, extractArray, num, str } from '@/lib/api-upsert'

type Input = {
  externalId?: string
  nomorFaktur?: string
  tanggal?: string
  jatuhTempo?: string
  kodeSales?: string
  kodeCustomer?: string
  kodePart?: string
  qty?: number
  bonus?: number
  hargaSatuan?: number
  deleted?: boolean
}

const ENDPOINT = '/api/v1/faktur'

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

  const rows = extractArray<Input>(body, 'faktur')
  if (rows.length === 0) return NextResponse.json({ error: 'No data' }, { status: 400 })

  const [sales, parts, customers] = await Promise.all([
    prisma.sales.findMany({ where: { deletedAt: null }, select: { id: true, kode: true, idCabang: true } }),
    prisma.part.findMany({ where: { deletedAt: null }, select: { id: true, kode: true } }),
    prisma.customer.findMany({ where: { deletedAt: null }, select: { id: true, kode: true } }),
  ])
  const salesMap = new Map(sales.map((s) => [s.kode, s]))
  const partMap = new Map(parts.map((p) => [p.kode, p.id]))
  const custMap = new Map(customers.map((c) => [c.kode, c.id]))

  const groups = new Map<string, {
    externalId: string | null
    nomorFaktur: string
    tanggal: Date
    jatuhTempo: Date
    kodeSales: string
    kodeCustomer: string
    items: { idPart: number; qty: number; bonus: number; hargaSatuan: number; subtotal: number }[]
  }>()

  const result = emptyResult()

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    try {
      const externalId = r.externalId ? str(r.externalId) : null
      const nomorFaktur = str(r.nomorFaktur)
      const key = nomorFaktur || externalId || ''
      if (!key) {
        result.errors.push({ index: i, message: 'nomorFaktur atau externalId wajib' })
        result.failed++
        continue
      }

      if (r.deleted === true) {
        const found = await prisma.faktur.findUnique({ where: { nomorFaktur: key } })
        if (!found) {
          result.errors.push({ index: i, nomorFaktur: key, message: 'Tidak ditemukan' })
          result.failed++
          continue
        }
        if (found.deletedAt) {
          result.skipped++
          continue
        }
        await prisma.faktur.update({
          where: { id: found.id },
          data: { deletedAt: new Date(), syncedAt: new Date() },
        })
        await prisma.hutang.updateMany({
          where: { idFaktur: found.id },
          data: { deletedAt: new Date() },
        })
        result.deleted++
        continue
      }

      const tanggal = new Date(str(r.tanggal))
      const jatuhTempo = new Date(str(r.jatuhTempo))
      const kodeSales = str(r.kodeSales)
      const kodeCustomer = str(r.kodeCustomer)
      const kodePart = str(r.kodePart)
      if (isNaN(tanggal.getTime()) || isNaN(jatuhTempo.getTime())) {
        result.errors.push({ index: i, nomorFaktur: key, message: 'tanggal/jatuhTempo invalid' })
        result.failed++
        continue
      }
      if (!salesMap.has(kodeSales)) {
        result.errors.push({ index: i, nomorFaktur: key, message: `Sales "${kodeSales}" tidak ada` })
        result.failed++
        continue
      }
      const idPart = partMap.get(kodePart)
      if (!idPart) {
        result.errors.push({ index: i, nomorFaktur: key, message: `Part "${kodePart}" tidak ada` })
        result.failed++
        continue
      }

      if (!groups.has(key)) {
        groups.set(key, {
          externalId,
          nomorFaktur: key,
          tanggal,
          jatuhTempo,
          kodeSales,
          kodeCustomer,
          items: [],
        })
      }
      const qty = num(r.qty)
      const hargaSatuan = num(r.hargaSatuan)
      groups.get(key)!.items.push({
        idPart,
        qty,
        bonus: num(r.bonus),
        hargaSatuan,
        subtotal: qty * hargaSatuan,
      })
    } catch (e) {
      result.errors.push({ index: i, message: (e as Error).message })
      result.failed++
    }
  }

  for (const [key, group] of groups) {
    try {
      const s = salesMap.get(group.kodeSales)!
      const idCustomer = group.kodeCustomer ? (custMap.get(group.kodeCustomer) ?? null) : null
      const subtotalDpp = group.items.reduce((sum, it) => sum + it.subtotal, 0)
      const ppn = Math.round(subtotalDpp * 0.11)
      const totalTagihan = subtotalDpp + ppn
      const isJatuhTempo = group.jatuhTempo < new Date()

      const existing = await prisma.faktur.findUnique({ where: { nomorFaktur: key } })

      if (existing) {
        await prisma.$transaction(async (tx) => {
          await tx.detailFaktur.deleteMany({ where: { idFaktur: existing.id } })
          await tx.faktur.update({
            where: { id: existing.id },
            data: {
              tanggal: group.tanggal,
              jatuhTempo: group.jatuhTempo,
              idSales: s.id,
              idCabang: s.idCabang,
              idCustomer,
              subtotalDpp,
              ppn,
              totalTagihan,
              status: isJatuhTempo ? 'JATUH_TEMPO' : 'BELUM_LUNAS',
              externalId: group.externalId ?? existing.externalId,
              source: 'erp',
              syncedAt: new Date(),
              deletedAt: null,
              detail: { create: group.items },
            },
          })
          await tx.hutang.updateMany({
            where: { idFaktur: existing.id },
            data: {
              totalHutang: totalTagihan,
              sisaHutang: totalTagihan,
              jatuhTempo: group.jatuhTempo,
              deletedAt: null,
            },
          })
        })
        result.updated++
      } else {
        const newFaktur = await prisma.faktur.create({
          data: {
            nomorFaktur: key,
            tanggal: group.tanggal,
            jatuhTempo: group.jatuhTempo,
            idSales: s.id,
            idCabang: s.idCabang,
            idCustomer,
            subtotalDpp,
            ppn,
            totalTagihan,
            status: isJatuhTempo ? 'JATUH_TEMPO' : 'BELUM_LUNAS',
            externalId: group.externalId,
            source: 'erp',
            syncedAt: new Date(),
            detail: { create: group.items },
          },
        })
        await prisma.hutang.create({
          data: {
            idFaktur: newFaktur.id,
            idSales: s.id,
            idCabang: s.idCabang,
            tanggalFaktur: group.tanggal,
            jatuhTempo: group.jatuhTempo,
            totalHutang: totalTagihan,
            totalBayar: 0,
            sisaHutang: totalTagihan,
            statusLunas: false,
            source: 'erp',
            syncedAt: new Date(),
          },
        })
        result.created++
      }
    } catch (e) {
      result.errors.push({ index: 0, nomorFaktur: key, message: (e as Error).message })
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
    prisma.faktur.count({ where: { deletedAt: null } }),
    prisma.faktur.count({ where: { NOT: { deletedAt: null } } }),
  ])
  return NextResponse.json(
    {
      endpoint: ENDPOINT,
      authenticatedAs: auth.apiKey?.nama,
      totalActive: active,
      totalSoftDeleted: soft,
      body: '{ faktur: [{ externalId?, nomorFaktur, tanggal, jatuhTempo, kodeSales, kodeCustomer?, kodePart, qty, bonus?, hargaSatuan, deleted? }] }',
      note: 'Kirim per-item. Baris dengan nomorFaktur sama → digabung. PPN 11% otomatis.',
    },
    { headers: auth.rateLimit ? getRateLimitHeaders(auth.rateLimit) : {} }
  )
}