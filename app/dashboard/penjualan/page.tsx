import { connection } from 'next/server'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PenjualanTable } from '@/components/penjualan/penjualan-table'
import { PenjualanFormDialog } from '@/components/penjualan/penjualan-form-dialog'
import { PenjualanFilters } from '@/components/penjualan/penjualan-filters'
import { PaginationBar } from '@/components/ui/pagination-bar'
import prisma from '@/lib/prisma'
import { requirePageAccess } from '@/lib/rbac'

export const instant = false

const PAGE_SIZE = 20

type SearchParams = Promise<{
  page?: string
  q?: string
  cabang?: string
  sales?: string
  dari?: string
  sampai?: string
}>

export default async function PenjualanPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
    await requirePageAccess('/dashboard/penjualan')
  await connection()

  const params = await searchParams
  const currentPage = Math.max(1, parseInt(params.page ?? '1') || 1)
  const q = (params.q ?? '').trim()
  const cabangParam = params.cabang ? parseInt(params.cabang) : undefined
  const salesParam = params.sales ? parseInt(params.sales) : undefined
  const dari = params.dari ? new Date(params.dari) : undefined
  const sampai = params.sampai ? new Date(params.sampai) : undefined

  const where = {
    deletedAt: null,
    ...(cabangParam ? { idCabang: cabangParam } : {}),
    ...(salesParam ? { idSales: salesParam } : {}),
    ...(dari || sampai
      ? {
          tanggal: {
            ...(dari ? { gte: dari } : {}),
            ...(sampai ? { lte: new Date(sampai.getTime() + 86400000) } : {}),
          },
        }
      : {}),
    ...(q
      ? {
          OR: [
            { sales: { nama: { contains: q, mode: 'insensitive' as const } } },
            { part: { nama: { contains: q, mode: 'insensitive' as const } } },
            { part: { kode: { contains: q, mode: 'insensitive' as const } } },
          ],
        }
      : {}),
  }

  const [totalItems, rawData, listCabang, listSalesRaw, listPartRaw] = await Promise.all([
    prisma.penjualan.count({ where }),
    prisma.penjualan.findMany({
      where,
      orderBy: [{ tanggal: 'desc' }, { id: 'desc' }],
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        sales: { select: { id: true, nama: true } },
        part: { select: { id: true, kode: true, nama: true, satuan: true } },
        cabang: { select: { id: true, nama: true } },
      },
    }),
    prisma.cabang.findMany({
      where: { deletedAt: null },
      orderBy: { nama: 'asc' },
    }),
    prisma.sales.findMany({
      where: { aktif: true, deletedAt: null },
      orderBy: { nama: 'asc' },
      include: { cabang: { select: { nama: true } } },
    }),
    prisma.part.findMany({
      where: { aktif: true, deletedAt: null },
      orderBy: { nama: 'asc' },
      include: { bahan: { select: { nama: true } } },
    }),
  ])

  const data = rawData.map((p) => ({
    id: p.id.toString(),
    tanggal: p.tanggal.toISOString(),
    qty: p.qty,
    hargaSatuan: Number(p.hargaSatuan),
    diskon: Number(p.diskon),
    totalOmzet: Number(p.totalOmzet),
    sales: p.sales,
    part: p.part,
    cabang: p.cabang,
  }))

  const listSales = listSalesRaw.map((s) => ({
    id: s.id,
    kode: s.kode,
    nama: s.nama,
    idCabang: s.idCabang,
    cabang: { nama: s.cabang.nama },
  }))

  const listPart = listPartRaw.map((p) => ({
    id: p.id,
    kode: p.kode,
    nama: p.nama,
    satuan: p.satuan,
    hargaJual: Number(p.hargaJual),
  }))

  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Penjualan</h1>
          <p className="text-sm text-muted-foreground">
            Kelola transaksi penjualan harian
          </p>
        </div>
        <PenjualanFormDialog
          mode="create"
          listSales={listSales}
          listPart={listPart}
          trigger={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Penjualan
            </Button>
          }
        />
      </div>

      <PenjualanFilters listCabang={listCabang} listSales={listSales} />

      <PenjualanTable data={data} listSales={listSales} listPart={listPart} />

      <PaginationBar
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={PAGE_SIZE}
      />
    </div>
  )
}