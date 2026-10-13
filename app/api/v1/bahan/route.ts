import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiKey } from '@/lib/api-auth'
import prisma from '@/lib/prisma'
import { emptyResult, extractArray, str } from '@/lib/api-upsert'

type Input = {
  externalId?: string
  kode?: string
  nama?: string
  kodeMerk?: string
  kodeJenis?: string
  deleted?: boolean
}

export async function POST(request: NextRequest) {
  const auth = await authenticateApiKey(request)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 })

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const items = extractArray<Input>(body, 'bahan')
  if (items.length === 0) return NextResponse.json({ error: 'No data' }, { status: 400 })

  const [merks, jenises] = await Promise.all([
    prisma.merk.findMany({ where: { deletedAt: null }, select: { id: true, kode: true } }),
    prisma.jenis.findMany({ where: { deletedAt: null }, select: { id: true, kode: true } }),
  ])
  const merkMap = new Map(merks.map((m) => [m.kode, m.id]))
  const jenisMap = new Map(jenises.map((j) => [j.kode, j.id]))

  const result = emptyResult()

  for (let i = 0; i < items.length; i++) {
    const b = items[i]
    try {
      const externalId = b.externalId ? str(b.externalId) : null
      const kode = str(b.kode)
      if (!externalId && !kode) { result.errors.push({ index: i, message: 'externalId atau kode wajib' }); result.failed++; continue }

      if (b.deleted === true) {
        const where = externalId ? { externalId } : { kode }
        const found = await prisma.bahan.findUnique({ where })
        if (!found) { result.errors.push({ index: i, kode, message: 'Tidak ditemukan' }); result.failed++; continue }
        if (found.deletedAt) { result.skipped++; continue }
        await prisma.bahan.update({ where: { id: found.id }, data: { deletedAt: new Date(), syncedAt: new Date() } })
        result.deleted++; continue
      }

      const nama = str(b.nama)
      const kodeMerk = str(b.kodeMerk)
      const kodeJenis = str(b.kodeJenis)
      if (!nama || !kodeMerk || !kodeJenis) { result.errors.push({ index: i, kode, message: 'nama, kodeMerk, kodeJenis wajib' }); result.failed++; continue }
      const idMerk = merkMap.get(kodeMerk)
      if (!idMerk) { result.errors.push({ index: i, kode, message: `Merk "${kodeMerk}" tidak ditemukan` }); result.failed++; continue }
      const idJenis = jenisMap.get(kodeJenis)
      if (!idJenis) { result.errors.push({ index: i, kode, message: `Jenis "${kodeJenis}" tidak ditemukan` }); result.failed++; continue }

      let existing = externalId ? await prisma.bahan.findUnique({ where: { externalId } }) : null
      if (!existing && kode) existing = await prisma.bahan.findUnique({ where: { kode } })

      const data = { nama, idMerk, idJenis, source: 'erp', syncedAt: new Date(), deletedAt: null }

      if (existing) {
        await prisma.bahan.update({ where: { id: existing.id }, data: { ...data, externalId: externalId ?? existing.externalId, kode: kode || existing.kode } })
        result.updated++
      } else {
        if (!kode) { result.errors.push({ index: i, message: 'kode wajib untuk data baru' }); result.failed++; continue }
        await prisma.bahan.create({ data: { ...data, kode, externalId } })
        result.created++
      }
    } catch (e) {
      result.errors.push({ index: i, kode: b.kode, externalId: b.externalId, message: (e as Error).message }); result.failed++
    }
  }

  return NextResponse.json({ success: result.failed === 0, ...result })
}

export async function GET(request: NextRequest) {
  const auth = await authenticateApiKey(request)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 })
  const [active, soft] = await Promise.all([
    prisma.bahan.count({ where: { deletedAt: null } }),
    prisma.bahan.count({ where: { NOT: { deletedAt: null } } }),
  ])
  return NextResponse.json({
    endpoint: '/api/v1/bahan',
    authenticatedAs: auth.apiKey?.nama,
    totalActive: active,
    totalSoftDeleted: soft,
    body: '{ bahan: [{ externalId?, kode, nama, kodeMerk, kodeJenis, deleted? }] }',
  })
}