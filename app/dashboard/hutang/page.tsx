import { connection } from 'next/server'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HutangTabs } from '@/components/hutang/hutang-tabs'
import { FakturFormDialog } from '@/components/hutang/faktur-form-dialog'
import prisma from '@/lib/prisma'

export const instant = false

export default async function HutangPage() {
  await connection()

  const [fakturRaw, piutangRaw, listSales, listPartRaw] = await Promise.all([
    prisma.faktur.findMany({
      orderBy: [{ tanggal: 'desc' }, { id: 'desc' }],
      take: 100,
      include: {
        sales: { select: { nama: true } },
        cabang: { select: { nama: true } },
        hutang: {
          select: {
            id: true,
            totalBayar: true,
            sisaHutang: true,
            statusLunas: true,
          },
        },
      },
    }),
    prisma.hutang.findMany({
      orderBy: [{ statusLunas: 'asc' }, { jatuhTempo: 'asc' }],
      take: 100,
      include: {
        faktur: { select: { nomorFaktur: true } },
        sales: { select: { nama: true } },
        cabang: { select: { nama: true } },
      },
    }),
    prisma.sales.findMany({
      where: { aktif: true },
      orderBy: { nama: 'asc' },
      include: { cabang: { select: { nama: true } } },
    }),
    prisma.part.findMany({
      where: { aktif: true },
      orderBy: { nama: 'asc' },
    }),
  ])

  const fakturList = fakturRaw.map((f) => {
    const h = f.hutang[0] // relasi 1-to-many, ambil yang pertama
    return {
      id: f.id.toString(),
      nomorFaktur: f.nomorFaktur,
      tanggal: f.tanggal.toISOString(),
      jatuhTempo: f.jatuhTempo.toISOString(),
      totalTagihan: Number(f.totalTagihan),
      status: f.status,
      sales: f.sales,
      cabang: f.cabang,
      hutang: h
        ? {
            id: Number(h.id),
            totalBayar: Number(h.totalBayar),
            sisaHutang: Number(h.sisaHutang),
            statusLunas: h.statusLunas,
          }
        : null,
    }
  })

  const piutangList = piutangRaw.map((h) => ({
    id: Number(h.id),
    nomorFaktur: h.faktur.nomorFaktur,
    jatuhTempo: h.jatuhTempo.toISOString(),
    totalHutang: Number(h.totalHutang),
    totalBayar: Number(h.totalBayar),
    sisaHutang: Number(h.sisaHutang),
    statusLunas: h.statusLunas,
    sales: h.sales,
    cabang: h.cabang,
  }))

  const listSalesForm = listSales.map((s) => ({
    id: s.id,
    kode: s.kode,
    nama: s.nama,
    cabang: { nama: s.cabang.nama },
  }))

  const listPartForm = listPartRaw.map((p) => ({
    id: p.id,
    kode: p.kode,
    nama: p.nama,
    satuan: p.satuan,
    hargaJual: Number(p.hargaJual),
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hutang & Faktur</h1>
          <p className="text-sm text-muted-foreground">
            Kelola faktur penjualan dan piutang
          </p>
        </div>
        <FakturFormDialog
          listSales={listSalesForm}
          listPart={listPartForm}
          trigger={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Buat Faktur
            </Button>
          }
        />
      </div>

      <HutangTabs fakturList={fakturList} piutangList={piutangList} />
    </div>
  )
}