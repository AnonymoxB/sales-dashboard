import prisma from '@/lib/prisma'

/**
 * Filter default: exclude soft-deleted records.
 * Pakai di semua query yang menampilkan data.
 */
export const ACTIVE = { deletedAt: null } as const

/**
 * Soft delete: set deletedAt = NOW()
 */
export async function softDelete(
  model: 'cabang' | 'customer' | 'sales' | 'merk' | 'jenis' | 'bahan' | 'part' | 'penjualan' | 'target' | 'faktur' | 'hutang',
  id: number | bigint
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (prisma as any)[model].update({
    where: { id },
    data: { deletedAt: new Date() },
  })
}

/**
 * Restore: set deletedAt = null
 */
export async function restore(
  model: 'cabang' | 'customer' | 'sales' | 'merk' | 'jenis' | 'bahan' | 'part' | 'penjualan' | 'target' | 'faktur' | 'hutang',
  id: number | bigint
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (prisma as any)[model].update({
    where: { id },
    data: { deletedAt: null },
  })
}