import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiKey } from '@/lib/api-auth'
import { logApiCall } from '@/lib/api-logger'
import { getRateLimitHeaders } from '@/lib/api-rate-limit'
import prisma from '@/lib/prisma'
import { emptyResult, extractArray, normalizeBool, str } from '@/lib/api-upsert'

type SalesInput = {
  externalId?: string
  kode?: string
  nama?: string
  kodeCabang?: string
  telepon?: string
  aktif?: boolean
  deleted?: boolean
}

const ENDPOINT = '/api/v1/sales'

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

  const items = extractArray<SalesInput>(body, 'sales')
  if (items.length === 0) {
    return NextResponse.json({ error: 'No data' }, { status: 400 })
  }

  const cabangs = await prisma.cabang.findMany({
    where: { deletedAt: null },
    select: { id: true, kode: true },
  })
  const cabangMap = new Map(cabangs.map((c) => [c.kode, c.id]))

  const result = emptyResult()

  for (let i = 0; i < items.length; i++) {
    const s = items[i]
    try {
      const externalId = s.externalId ? str(s.externalId) : null
      const kode = str(s.kode)
      if (!externalId && !kode) {
        result.errors.push({ index: i, message: 'externalId atau kode wajib' })
        result.failed++
        continue
      }

      if (s.deleted === true) {
        const where = externalId ? { externalId } : { kode }
        const found = await prisma.sales.findUnique({ where })
        if (!found) {
          result.errors.push({ index: i, kode, message: 'Tidak ditemukan' })
          result.failed++
          continue
        }
        if (found.deletedAt) {
          result.skipped++
          continue
        }
        await prisma.sales.update({
          where: { id: found.id },
          data: { deletedAt: new Date(), syncedAt: new Date() },
        })
        result.deleted++
        continue
      }

      const nama = str(s.nama)
      const kodeCabang = str(s.kodeCabang)
      if (!nama || !kodeCabang) {
        result.errors.push({ index: i, kode, message: 'nama & kodeCabang wajib' })
        result.failed++
        continue
      }
      const idCabang = cabangMap.get(kodeCabang)
      if (!idCabang) {
        result.errors.push({ index: i, kode, message: `Cabang "${kodeCabang}" tidak ditemukan` })
        result.failed++
        continue
      }

      let existing = externalId
        ? await prisma.sales.findUnique({ where: { externalId } })
        : null
      if (!existing && kode) existing = await prisma.sales.findUnique({ where: { kode } })

      const data = {
        nama,
        idCabang,
        telepon: str(s.telepon) || null,
        aktif: normalizeBool(s.aktif, true),
        source: 'erp',
        syncedAt: new Date(),
        deletedAt: null,
      }

      if (existing) {
        await prisma.sales.update({
          where: { id: existing.id },
          data: {
            ...data,
            externalId: externalId ?? existing.externalId,
            kode: kode || existing.kode,
          },
        })
        result.updated++
      } else {
        if (!kode) {
          result.errors.push({ index: i, message: 'kode wajib untuk data baru' })
          result.failed++
          continue
        }
        await prisma.sales.create({ data: { ...data, kode, externalId } })
        result.created++
      }
    } catch (e) {
      result.errors.push({ index: i, kode: s.kode, externalId: s.externalId, message: (e as Error).message })
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
    prisma.sales.count({ where: { deletedAt: null } }),
    prisma.sales.count({ where: { NOT: { deletedAt: null } } }),
  ])

  return NextResponse.json(
    {
      endpoint: ENDPOINT,
      authenticatedAs: auth.apiKey?.nama,
      totalActive: active,
      totalSoftDeleted: soft,
      body: '{ sales: [{ externalId?, kode, nama, kodeCabang, telepon?, aktif?, deleted? }] }',
    },
    { headers: auth.rateLimit ? getRateLimitHeaders(auth.rateLimit) : {} }
  )
}