import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiKey } from '@/lib/api-auth'
import { logApiCall } from '@/lib/api-logger'
import { getRateLimitHeaders } from '@/lib/api-rate-limit'
import prisma from '@/lib/prisma'
import { emptyResult, extractArray, normalizeBool, num, str } from '@/lib/api-upsert'

type Input = {
  externalId?: string
  kode?: string
  nama?: string
  kodeBahan?: string
  satuan?: string
  hargaJual?: number
  hargaBeli?: number
  aktif?: boolean
  deleted?: boolean
}

const ENDPOINT = '/api/v1/parts'

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

  const items = extractArray<Input>(body, 'parts')
  if (items.length === 0) return NextResponse.json({ error: 'No data' }, { status: 400 })

  const bahans = await prisma.bahan.findMany({
    where: { deletedAt: null },
    select: { id: true, kode: true },
  })
  const bahanMap = new Map(bahans.map((b) => [b.kode, b.id]))

  const result = emptyResult()

  for (let i = 0; i < items.length; i++) {
    const p = items[i]
    try {
      const externalId = p.externalId ? str(p.externalId) : null
      const kode = str(p.kode)
      if (!externalId && !kode) {
        result.errors.push({ index: i, message: 'externalId atau kode wajib' })
        result.failed++
        continue
      }

      if (p.deleted === true) {
        const where = externalId ? { externalId } : { kode }
        const found = await prisma.part.findUnique({ where })
        if (!found) {
          result.errors.push({ index: i, kode, message: 'Tidak ditemukan' })
          result.failed++
          continue
        }
        if (found.deletedAt) {
          result.skipped++
          continue
        }
        await prisma.part.update({
          where: { id: found.id },
          data: { deletedAt: new Date(), syncedAt: new Date() },
        })
        result.deleted++
        continue
      }

      const nama = str(p.nama)
      const kodeBahan = str(p.kodeBahan)
      if (!nama || !kodeBahan) {
        result.errors.push({ index: i, kode, message: 'nama & kodeBahan wajib' })
        result.failed++
        continue
      }
      const idBahan = bahanMap.get(kodeBahan)
      if (!idBahan) {
        result.errors.push({ index: i, kode, message: `Bahan "${kodeBahan}" tidak ditemukan` })
        result.failed++
        continue
      }

      const hargaJual = num(p.hargaJual)
      const hargaBeli = p.hargaBeli != null ? num(p.hargaBeli) : null

      let existing = externalId
        ? await prisma.part.findUnique({ where: { externalId } })
        : null
      if (!existing && kode) existing = await prisma.part.findUnique({ where: { kode } })

      const data = {
        nama,
        idBahan,
        satuan: str(p.satuan) || 'PCS',
        hargaJual,
        hargaBeli,
        aktif: normalizeBool(p.aktif, true),
        source: 'erp',
        syncedAt: new Date(),
        deletedAt: null,
      }

      if (existing) {
        await prisma.part.update({
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
        await prisma.part.create({ data: { ...data, kode, externalId } })
        result.created++
      }
    } catch (e) {
      result.errors.push({ index: i, kode: p.kode, externalId: p.externalId, message: (e as Error).message })
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
    prisma.part.count({ where: { deletedAt: null } }),
    prisma.part.count({ where: { NOT: { deletedAt: null } } }),
  ])
  return NextResponse.json(
    {
      endpoint: ENDPOINT,
      authenticatedAs: auth.apiKey?.nama,
      totalActive: active,
      totalSoftDeleted: soft,
      body: '{ parts: [{ externalId?, kode, nama, kodeBahan, satuan, hargaJual, hargaBeli?, aktif?, deleted? }] }',
    },
    { headers: auth.rateLimit ? getRateLimitHeaders(auth.rateLimit) : {} }
  )
}