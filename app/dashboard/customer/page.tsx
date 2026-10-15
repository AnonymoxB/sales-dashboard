import { connection } from 'next/server'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CustomerTable } from '@/components/customer/customer-table'
import { CustomerFormDialog } from '@/components/customer/customer-form-dialog'
import { CustomerFilters } from '@/components/customer/customer-filters'
import { PaginationBar } from '@/components/ui/pagination-bar'
import prisma from '@/lib/prisma'
import { requirePageAccess, canPerformAction } from '@/lib/rbac'

export const instant = false

const PAGE_SIZE = 10

type SearchParams = Promise<{ page?: string; q?: string }>

export default async function CustomerPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const user = await requirePageAccess('/dashboard/customer')
  await connection()

  // 🛡️ Cek permission sekali untuk UI
  const [canCreate, canUpdate, canDelete] = await Promise.all([
    canPerformAction(user.role, 'master.create'),
    canPerformAction(user.role, 'master.update'),
    canPerformAction(user.role, 'master.delete'),
  ])

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
            { alamat: { contains: q, mode: 'insensitive' as const } },
            { telepon: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  }

  const [totalItems, data] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      orderBy: { kode: 'asc' },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ])

  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customer</h1>
          <p className="text-sm text-muted-foreground">
            Kelola data customer / perusahaan
          </p>
        </div>
        {canCreate && (
          <CustomerFormDialog
            mode="create"
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Customer
              </Button>
            }
          />
        )}
      </div>

      <CustomerFilters />
      <CustomerTable
        data={data}
        canUpdate={canUpdate}
        canDelete={canDelete}
      />
      <PaginationBar
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={PAGE_SIZE}
      />
    </div>
  )
}