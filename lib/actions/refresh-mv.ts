'use server'

import prisma from '@/lib/prisma'
import { revalidateTag } from 'next/cache'

export async function refreshDashboardMV() {
  try {
    await prisma.$executeRawUnsafe(`
      REFRESH MATERIALIZED VIEW CONCURRENTLY mv_pencapaian_sales_bulanan;
      REFRESH MATERIALIZED VIEW CONCURRENTLY mv_pencapaian_part_bulanan;
      REFRESH MATERIALIZED VIEW CONCURRENTLY mv_hutang_per_sales;
      REFRESH MATERIALIZED VIEW CONCURRENTLY mv_omzet_bulanan;
    `)

    revalidateTag('dashboard1', 'max')
    revalidateTag('dashboard2', 'max')

    return { success: true }
  } catch (error) {
    console.error('Refresh MV error:', error)
    return { error: 'Gagal refresh data dashboard' }
  }
}