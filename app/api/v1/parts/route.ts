import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiKey } from '@/lib/api-auth'
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

export async function POST(request: NextRequest) {
  const auth = await authenticateApiKey(request)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 })

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const items = extractArray<Input>(body, 'parts')
  if (items.length === 0) return NextResponse.json({ error: 'No data' }, { status: 400 })

  const bahans = await prisma.bahan.findMany({ where: { deletedAt: null }, select: { id: true, kode: true } })
  const bahanMap = new Map(bahans.map((b) => [b.kode, b.id]))

  const result = emptyResult()

  for (let i = 0; i < items.length; i++) {
    const p = items[i]
    try {
      const externalId = p.externalId ? str(p.externalId) : null
      const kode = str(p.kode)
      if (!externalId && !kode) { result.errors.push({ index: i, message: 'externalId atau kode wajib' }); result.failed++; continue }

      if (p.deleted === true) {
        const where = externalId ? { externalId } : { kode }
        const found = await prisma.part.findUnique({ where })
        if (!found) { result.errors.push({ index: i, kode, message: 'Tidak ditemukan' }); result.failed++; continue }
        if (found.deletedAt) { result.skipped++; continue }
        await prisma.part.update({ where: { id: found.id }, data: { deletedAt: new Date(), syncedAt: new Date() } })
        result.deleted++; continue
      }

      const nama = str(p.nama)
      const kodeBahan = str(p.kodeBahan)
      if (!nama || !kodeBahan) { result.errors.push({ index: i, kode, message: 'nama & kodeBahan wajib' }); result.failed++; continue }
      const idBahan = bahanMap.get(kodeBahan)
      if (!idBahan) { result.errors.push({ index: i, kode, message: `Bahan "${kodeBahan}" tidak ditemukan` }); result.failed++; continue }

      const hargaJual = num(p.hargaJual)
      const hargaBeli = p.hargaBeli != null ? num(p.hargaBeli) : null

      let existing = externalId ? await prisma.part.findUnique({ where: { externalId } }) : null
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
        await prisma.part.update({ where: { id: existing.id }, data: { ...data, externalId: externalId ?? existing.externalId, kode: kode || existing.kode } })
        result.updated++
      } else {
        if (!kode) { result.errors.push({ index: i, message: 'kode wajib untuk data baru' }); result.failed++; continue }
        await prisma.part.create({ data: { ...data, kode, externalId } })
        result.created++
      }
    } catch (e) {
      result.errors.push({ index: i, kode: p.kode, externalId: p.externalId, message: (e as Error).message }); result.failed++
    }
  }

  return NextResponse.json({ success: result.failed === 0, ...result })
}

export async function GET(request: NextRequest) {
  const auth = await authenticateApiKey(request)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 })
  const [active, soft] = await Promise.all([
    prisma.part.count({ where: { deletedAt: null } }),
    prisma.part.count({ where: { NOT: { deletedAt: null } } }),
  ])
  return NextResponse.json({
    endpoint: '/api/v1/parts',
    authenticatedAs: auth.apiKey?.nama,
    totalActive: active,
    totalSoftDeleted: soft,
    body: '{ parts: [{ externalId?, kode, nama, kodeBahan, satuan, hargaJual, hargaBeli?, aktif?, deleted? }] }',
  })
}