import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiKey } from '@/lib/api-auth'
import prisma from '@/lib/prisma'
import { emptyResult, extractArray, str } from '@/lib/api-upsert'

type CabangInput = {
  externalId?: string
  kode?: string
  nama?: string
  wilayah?: string
  alamat?: string
  deleted?: boolean
}

export async function POST(request: NextRequest) {
  const auth = await authenticateApiKey(request)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 })

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const items = extractArray<CabangInput>(body, 'cabang')
  if (items.length === 0) return NextResponse.json({ error: 'No data' }, { status: 400 })

  const result = emptyResult()

  for (let i = 0; i < items.length; i++) {
    const c = items[i]
    try {
      const externalId = c.externalId ? str(c.externalId) : null
      const kode = str(c.kode)
      if (!externalId && !kode) {
        result.errors.push({ index: i, message: 'externalId atau kode wajib' }); result.failed++; continue
      }

      if (c.deleted === true) {
        const where = externalId ? { externalId } : { kode }
        const found = await prisma.cabang.findUnique({ where })
        if (!found) { result.errors.push({ index: i, kode, message: 'Tidak ditemukan' }); result.failed++; continue }
        if (found.deletedAt) { result.skipped++; continue }
        await prisma.cabang.update({ where: { id: found.id }, data: { deletedAt: new Date(), syncedAt: new Date() } })
        result.deleted++; continue
      }

      const nama = str(c.nama)
      if (!nama) { result.errors.push({ index: i, kode, message: 'nama wajib' }); result.failed++; continue }

      let existing = externalId ? await prisma.cabang.findUnique({ where: { externalId } }) : null
      if (!existing && kode) existing = await prisma.cabang.findUnique({ where: { kode } })

      const data = {
        nama,
        wilayah: str(c.wilayah) || null,
        alamat: str(c.alamat) || null,
        source: 'erp',
        syncedAt: new Date(),
        deletedAt: null,
      }

      if (existing) {
        await prisma.cabang.update({
          where: { id: existing.id },
          data: { ...data, externalId: externalId ?? existing.externalId, kode: kode || existing.kode },
        })
        result.updated++
      } else {
        if (!kode) { result.errors.push({ index: i, message: 'kode wajib untuk data baru' }); result.failed++; continue }
        await prisma.cabang.create({ data: { ...data, kode, externalId } })
        result.created++
      }
    } catch (e) {
      result.errors.push({ index: i, kode: c.kode, externalId: c.externalId, message: (e as Error).message }); result.failed++
    }
  }

  return NextResponse.json({ success: result.failed === 0, ...result })
}

export async function GET(request: NextRequest) {
  const auth = await authenticateApiKey(request)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 })
  const [active, soft] = await Promise.all([
    prisma.cabang.count({ where: { deletedAt: null } }),
    prisma.cabang.count({ where: { NOT: { deletedAt: null } } }),
  ])
  return NextResponse.json({
    endpoint: '/api/v1/cabang',
    authenticatedAs: auth.apiKey?.nama,
    totalActive: active,
    totalSoftDeleted: soft,
    body: '{ cabang: [{ externalId?, kode, nama, wilayah?, alamat?, deleted? }] }',
  })
}