import { connection } from 'next/server'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CabangTable } from '@/components/cabang/cabang-table'
import { CabangFormDialog } from '@/components/cabang/cabang-form-dialog'
import { CabangFilters } from '@/components/cabang/cabang-filters'
import { PaginationBar } from '@/components/ui/pagination-bar'
import prisma from '@/lib/prisma'

export const instant = false

const PAGE_SIZE = 10

type SearchParams = Promise<{ page?: string; q?: string }>

export default async function CabangPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  await connection()

  const params = await searchParams
  const currentPage = Math.max(1, parseInt(params.page ?? '1') || 1)
  const q = (params.q ?? '').trim()

  const where = {
    deletedAt: null,
    ...(q
      ? {
          OR: [
            { kode: { contains: q, mode: 'insensitive' as const } },
            { nama: { contains: q, mode: 'insensitive' as const } },
            { wilayah: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  }

  const [totalItems, data] = await Promise.all([
    prisma.cabang.count({ where }),
    prisma.cabang.findMany({
      where,
      orderBy: { kode: 'asc' },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        _count: {
          select: { sales: { where: { deletedAt: null } } },
        },
      },
    }),
  ])

  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cabang</h1>
          <p className="text-sm text-muted-foreground">
            Kelola data cabang di wilayah Jateng Pantura
          </p>
        </div>
        <CabangFormDialog
          mode="create"
          trigger={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Cabang
            </Button>
          }
        />
      </div>

      <CabangFilters />

      <CabangTable data={data} />

      <PaginationBar
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={PAGE_SIZE}
      />
    </div>
  )
}