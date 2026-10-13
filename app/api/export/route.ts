import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { ENTITIES, type EntityKey } from '@/lib/import-export/config'
import { generateExport, generateTemplate } from '@/lib/import-export/excel'


async function buildRows(entity: EntityKey, mode: 'template' | 'export') {
  if (mode === 'template') return []

  switch (entity) {
    case 'cabang': {
      const data = await prisma.cabang.findMany({ orderBy: { kode: 'asc' } })
      return data.map((c) => ({
        kode: c.kode,
        nama: c.nama,
        wilayah: c.wilayah ?? '',
        alamat: c.alamat ?? '',
      }))
    }

    case 'sales': {
      const data = await prisma.sales.findMany({
        include: { cabang: { select: { kode: true } } },
        orderBy: { kode: 'asc' },
      })
      return data.map((s) => ({
        kode: s.kode,
        nama: s.nama,
        kodeCabang: s.cabang.kode,
        telepon: s.telepon ?? '',
        aktif: s.aktif ? 'true' : 'false',
      }))
    }

    case 'customer': {
      const data = await prisma.customer.findMany({ orderBy: { kode: 'asc' } })
      return data.map((c) => ({
        kode: c.kode,
        nama: c.nama,
        alamat: c.alamat ?? '',
        telepon: c.telepon ?? '',
        aktif: c.aktif ? 'true' : 'false',
      }))
    }

    case 'merk': {
      const data = await prisma.merk.findMany({ orderBy: { kode: 'asc' } })
      return data.map((m) => ({ kode: m.kode, nama: m.nama }))
    }

    case 'jenis': {
      const data = await prisma.jenis.findMany({ orderBy: { kode: 'asc' } })
      return data.map((j) => ({ kode: j.kode, nama: j.nama }))
    }

    case 'bahan': {
      const data = await prisma.bahan.findMany({
        include: {
          merk: { select: { kode: true } },
          jenis: { select: { kode: true } },
        },
        orderBy: { kode: 'asc' },
      })
      return data.map((b) => ({
        kode: b.kode,
        nama: b.nama,
        kodeMerk: b.merk.kode,
        kodeJenis: b.jenis.kode,
      }))
    }

    case 'part': {
      const data = await prisma.part.findMany({
        include: { bahan: { select: { kode: true } } },
        orderBy: { kode: 'asc' },
      })
      return data.map((p) => ({
        kode: p.kode,
        nama: p.nama,
        kodeBahan: p.bahan.kode,
        satuan: p.satuan,
        hargaJual: Number(p.hargaJual),
        hargaBeli: p.hargaBeli ? Number(p.hargaBeli) : '',
        aktif: p.aktif ? 'true' : 'false',
      }))
    }

    case 'penjualan': {
      const data = await prisma.penjualan.findMany({
        include: {
          sales: { select: { kode: true } },
          part: { select: { kode: true } },
          customer: { select: { kode: true } },
        },
        orderBy: { tanggal: 'desc' },
        take: 5000,
      })
      return data.map((p) => ({
        tanggal: p.tanggal.toISOString().slice(0, 10),
        kodeSales: p.sales.kode,
        kodePart: p.part.kode,
        kodeCustomer: p.customer?.kode ?? '',
        qty: p.qty,
        bonus: p.bonus,
        hargaSatuan: Number(p.hargaSatuan),
        diskon: Number(p.diskon),
      }))
    }

    case 'target': {
      const data = await prisma.target.findMany({
        include: { sales: { select: { kode: true } } },
        orderBy: [{ periode: 'desc' }, { idSales: 'asc' }],
        take: 5000,
      })
      return data.map((t) => ({
        periode: t.periode.toISOString().slice(0, 10),
        kodeSales: t.sales.kode,
        targetOmzet: Number(t.targetOmzet),
      }))
    }

    case 'faktur': {
      const data = await prisma.faktur.findMany({
        include: {
          sales: { select: { kode: true } },
          customer: { select: { kode: true } },
          detail: {
            include: { part: { select: { kode: true } } },
          },
        },
        orderBy: { tanggal: 'desc' },
        take: 1000,
      })
      const out: Record<string, unknown>[] = []
      for (const f of data) {
        for (const d of f.detail) {
          out.push({
            nomorFaktur: f.nomorFaktur,
            tanggal: f.tanggal.toISOString().slice(0, 10),
            jatuhTempo: f.jatuhTempo.toISOString().slice(0, 10),
            kodeSales: f.sales.kode,
            kodeCustomer: f.customer?.kode ?? '',
            kodePart: d.part.kode,
            qty: d.qty,
            bonus: d.bonus,
            hargaSatuan: Number(d.hargaSatuan),
          })
        }
      }
      return out
    }
  }
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const entity = searchParams.get('entity') as EntityKey | null
  const mode = (searchParams.get('mode') ?? 'template') as 'template' | 'export'

  if (!entity || !ENTITIES[entity]) {
    return NextResponse.json({ error: 'Entity tidak valid' }, { status: 400 })
  }

  const config = ENTITIES[entity]
  const rows = await buildRows(entity, mode)

  const buffer = mode === 'template'
    ? generateTemplate(entity, config.columns, config.templateNote)
    : generateExport(entity, config.columns, rows)

  const filename = `${entity}-${mode}-${new Date().toISOString().slice(0, 10)}.xlsx`

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}