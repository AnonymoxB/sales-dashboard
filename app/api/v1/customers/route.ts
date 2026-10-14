import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiKey } from '@/lib/api-auth'
import { logApiCall } from '@/lib/api-logger'
import { getRateLimitHeaders } from '@/lib/api-rate-limit'
import prisma from '@/lib/prisma'
import { emptyResult, extractArray, normalizeBool, str } from '@/lib/api-upsert'

type CustomerInput = {
  externalId?: string
  kode?: string
  nama?: string
  alamat?: string
  telepon?: string
  aktif?: boolean
  deleted?: boolean
}

const ENDPOINT = '/api/v1/customers'

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

  const items = extractArray<CustomerInput>(body, 'customers')
  if (items.length === 0) {
    return NextResponse.json({ error: 'No data' }, { status: 400 })
  }
  if (items.length > 500) {
    return NextResponse.json({ error: 'Max 500 per request' }, { status: 400 })
  }

  const result = emptyResult()

  for (let i = 0; i < items.length; i++) {
    const c = items[i]
    try {
      const externalId = c.externalId ? str(c.externalId) : null
      const kode = str(c.kode)
      if (!externalId && !kode) {
        result.errors.push({ index: i, message: 'externalId atau kode wajib' })
        result.failed++
        continue
      }

      if (c.deleted === true) {
        const where = externalId ? { externalId } : { kode }
        const found = await prisma.customer.findUnique({ where })
        if (!found) {
          result.errors.push({ index: i, kode, message: 'Tidak ditemukan' })
          result.failed++
          continue
        }
        if (found.deletedAt) {
          result.skipped++
          continue
        }
        await prisma.customer.update({
          where: { id: found.id },
          data: { deletedAt: new Date(), syncedAt: new Date() },
        })
        result.deleted++
        continue
      }

      const nama = str(c.nama)
      if (!nama) {
        result.errors.push({ index: i, kode, message: 'nama wajib' })
        result.failed++
        continue
      }

      let existing = externalId
        ? await prisma.customer.findUnique({ where: { externalId } })
        : null
      if (!existing && kode) existing = await prisma.customer.findUnique({ where: { kode } })

      const data = {
        nama,
        alamat: str(c.alamat) || null,
        telepon: str(c.telepon) || null,
        aktif: normalizeBool(c.aktif, true),
        source: 'erp',
        syncedAt: new Date(),
        deletedAt: null,
      }

      if (existing) {
        await prisma.customer.update({
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
        await prisma.customer.create({ data: { ...data, kode, externalId } })
        result.created++
      }
    } catch (e) {
      result.errors.push({ index: i, kode: c.kode, externalId: c.externalId, message: (e as Error).message })
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
  const startTime = Date.now()
  const auth = await authenticateApiKey(request)

  if (!auth.ok) {
    await logApiCall({
      apiKeyId: auth.apiKey?.id,
      apiKeyName: auth.apiKey?.nama,
      endpoint: ENDPOINT,
      method: 'GET',
      statusCode: auth.statusCode ?? 401,
      durationMs: Date.now() - startTime,
      ipAddress: auth.ip,
      userAgent: auth.userAgent,
      errorMsg: auth.error,
    })
    return NextResponse.json(
      { error: auth.error },
      {
        status: auth.statusCode ?? 401,
        headers: auth.rateLimit ? getRateLimitHeaders(auth.rateLimit) : {},
      }
    )
  }

  const [active, soft] = await Promise.all([
    prisma.customer.count({ where: { deletedAt: null } }),
    prisma.customer.count({ where: { NOT: { deletedAt: null } } }),
  ])

  await logApiCall({
    apiKeyId: auth.apiKey!.id,
    apiKeyName: auth.apiKey!.nama,
    endpoint: ENDPOINT,
    method: 'GET',
    statusCode: 200,
    durationMs: Date.now() - startTime,
    ipAddress: auth.ip,
    userAgent: auth.userAgent,
  })

  return NextResponse.json(
    {
      endpoint: ENDPOINT,
      authenticatedAs: auth.apiKey?.nama,
      totalActive: active,
      totalSoftDeleted: soft,
      body: '{ customers: [{ externalId?, kode, nama, alamat?, telepon?, aktif?, deleted? }] }',
      behavior: {
        upsert: 'External ID diprioritaskan. Fallback ke kode.',
        softDelete: 'Kirim { deleted: true } untuk soft delete.',
        restore: 'Kirim ulang dengan deleted=false → auto-restore.',
        idempotent: 'Aman di-retry.',
      },
    },
    { headers: auth.rateLimit ? getRateLimitHeaders(auth.rateLimit) : {} }
  )
}