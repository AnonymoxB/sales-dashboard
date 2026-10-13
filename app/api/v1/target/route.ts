import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiKey } from '@/lib/api-auth'
import prisma from '@/lib/prisma'
import { emptyResult, extractArray, num, str } from '@/lib/api-upsert'

type Input = {
  externalId?: string
  periode?: string
  kodeSales?: string
  targetOmzet?: number
  deleted?: boolean
}

export async function POST(request: NextRequest) {
  const auth = await authenticateApiKey(request)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 })

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const items = extractArray<Input>(body, 'target')
  if (items.length === 0) return NextResponse.json({ error: 'No data' }, { status: 400 })

  const sales = await prisma.sales.findMany({ where: { deletedAt: null }, select: { id: true, kode: true, idCabang: true } })
  const salesMap = new Map(sales.map((s) => [s.kode, s]))

  const result = emptyResult()

  for (let i = 0; i < items.length; i++) {
    const t = items[i]
    try {
      const externalId = t.externalId ? str(t.externalId) : null
      const periode = new Date(str(t.periode))
      const kodeSales = str(t.kodeSales)
      if (isNaN(periode.getTime())) { result.errors.push({ index: i, message: 'periode tidak valid' }); result.failed++; continue }
      const s = salesMap.get(kodeSales)
      if (!s) { result.errors.push({ index: i, message: `Sales "${kodeSales}" tidak ditemukan` }); result.failed++; continue }

      if (t.deleted === true) {
        const found = externalId
          ? await prisma.target.findUnique({ where: { externalId } })
          : await prisma.target.findUnique({ where: { periode_idSales: { periode, idSales: s.id } } })
        if (!found) { result.errors.push({ index: i, message: 'Tidak ditemukan' }); result.failed++; continue }
        if (found.deletedAt) { result.skipped++; continue }
        await prisma.target.update({ where: { id: found.id }, data: { deletedAt: new Date(), syncedAt: new Date() } })
        result.deleted++; continue
      }

      const targetOmzet = num(t.targetOmzet)

      const existing = externalId
        ? await prisma.target.findUnique({ where: { externalId } })
        : await prisma.target.findUnique({ where: { periode_idSales: { periode, idSales: s.id } } })

      const data = { targetOmzet, source: 'erp', syncedAt: new Date(), deletedAt: null }

      if (existing) {
        await prisma.target.update({ where: { id: existing.id }, data: { ...data, externalId: externalId ?? existing.externalId } })
        result.updated++
      } else {
        await prisma.target.create({
          data: { ...data, periode, idSales: s.id, idCabang: s.idCabang, externalId },
        })
        result.created++
      }
    } catch (e) {
      result.errors.push({ index: i, externalId: t.externalId, message: (e as Error).message }); result.failed++
    }
  }

  return NextResponse.json({ success: result.failed === 0, ...result })
}

export async function GET(request: NextRequest) {
  const auth = await authenticateApiKey(request)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 })
  const [active, soft] = await Promise.all([
    prisma.target.count({ where: { deletedAt: null } }),
    prisma.target.count({ where: { NOT: { deletedAt: null } } }),
  ])
  return NextResponse.json({
    endpoint: '/api/v1/target',
    authenticatedAs: auth.apiKey?.nama,
    totalActive: active,
    totalSoftDeleted: soft,
    body: '{ target: [{ externalId?, periode: "YYYY-MM-01", kodeSales, targetOmzet, deleted? }] }',
  })
}