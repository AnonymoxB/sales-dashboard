import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiKey } from '@/lib/api-auth'
import prisma from '@/lib/prisma'
import { emptyResult, extractArray, str } from '@/lib/api-upsert'

type Input = { externalId?: string; kode?: string; nama?: string; deleted?: boolean }

export async function POST(request: NextRequest) {
  const auth = await authenticateApiKey(request)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 })

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const items = extractArray<Input>(body, 'merk')
  if (items.length === 0) return NextResponse.json({ error: 'No data' }, { status: 400 })

  const result = emptyResult()

  for (let i = 0; i < items.length; i++) {
    const m = items[i]
    try {
      const externalId = m.externalId ? str(m.externalId) : null
      const kode = str(m.kode)
      if (!externalId && !kode) { result.errors.push({ index: i, message: 'externalId atau kode wajib' }); result.failed++; continue }

      if (m.deleted === true) {
        const where = externalId ? { externalId } : { kode }
        const found = await prisma.merk.findUnique({ where })
        if (!found) { result.errors.push({ index: i, kode, message: 'Tidak ditemukan' }); result.failed++; continue }
        if (found.deletedAt) { result.skipped++; continue }
        await prisma.merk.update({ where: { id: found.id }, data: { deletedAt: new Date(), syncedAt: new Date() } })
        result.deleted++; continue
      }

      const nama = str(m.nama)
      if (!nama) { result.errors.push({ index: i, kode, message: 'nama wajib' }); result.failed++; continue }

      let existing = externalId ? await prisma.merk.findUnique({ where: { externalId } }) : null
      if (!existing && kode) existing = await prisma.merk.findUnique({ where: { kode } })

      const data = { nama, source: 'erp', syncedAt: new Date(), deletedAt: null }

      if (existing) {
        await prisma.merk.update({ where: { id: existing.id }, data: { ...data, externalId: externalId ?? existing.externalId, kode: kode || existing.kode } })
        result.updated++
      } else {
        if (!kode) { result.errors.push({ index: i, message: 'kode wajib untuk data baru' }); result.failed++; continue }
        await prisma.merk.create({ data: { ...data, kode, externalId } })
        result.created++
      }
    } catch (e) {
      result.errors.push({ index: i, kode: m.kode, externalId: m.externalId, message: (e as Error).message }); result.failed++
    }
  }

  return NextResponse.json({ success: result.failed === 0, ...result })
}

export async function GET(request: NextRequest) {
  const auth = await authenticateApiKey(request)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 })
  const [active, soft] = await Promise.all([
    prisma.merk.count({ where: { deletedAt: null } }),
    prisma.merk.count({ where: { NOT: { deletedAt: null } } }),
  ])
  return NextResponse.json({
    endpoint: '/api/v1/merk',
    authenticatedAs: auth.apiKey?.nama,
    totalActive: active,
    totalSoftDeleted: soft,
    body: '{ merk: [{ externalId?, kode, nama, deleted? }] }',
  })
}