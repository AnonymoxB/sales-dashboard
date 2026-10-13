import { connection } from 'next/server'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SalesTable } from '@/components/sales/sales-table'
import { SalesFormDialog } from '@/components/sales/sales-form-dialog'
import { SalesFilters } from '@/components/sales/sales-filters'
import { PaginationBar } from '@/components/ui/pagination-bar'
import prisma from '@/lib/prisma'

export const instant = false

const PAGE_SIZE = 10

type SearchParams = Promise<{ page?: string; q?: string; cabang?: string }>

export default async function SalesPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  await connection()

  const params = await searchParams
  const currentPage = Math.max(1, parseInt(params.page ?? '1') || 1)
  const q = (params.q ?? '').trim()
  const cabangParam = params.cabang ? parseInt(params.cabang) : undefined

  const where = {
    deletedAt: null,
    ...(cabangParam ? { idCabang: cabangParam } : {}),
    ...(q
      ? {
          OR: [
            { kode: { contains: q, mode: 'insensitive' as const } },
            { nama: { contains: q, mode: 'insensitive' as const } },
            { telepon: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  }

  const [totalItems, data, listCabang] = await Promise.all([
    prisma.sales.count({ where }),
    prisma.sales.findMany({
      where,
      orderBy: { kode: 'asc' },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { cabang: { select: { id: true, kode: true, nama: true } } },
    }),
    prisma.cabang.findMany({
      where: { deletedAt: null },
      orderBy: { nama: 'asc' },
    }),
  ])

  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sales</h1>
          <p className="text-sm text-muted-foreground">
            Kelola data sales per cabang
          </p>
        </div>
        <SalesFormDialog
          mode="create"
          listCabang={listCabang}
          trigger={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Sales
            </Button>
          }
        />
      </div>

      <SalesFilters listCabang={listCabang} />

      <SalesTable data={data} listCabang={listCabang} />

      <PaginationBar
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={PAGE_SIZE}
      />
    </div>
  )
}