'use server'

import prisma from '@/lib/prisma'
import { updateTag } from 'next/cache'

export async function refreshDashboardMV() {
  try {
    await prisma.$executeRawUnsafe(`
      REFRESH MATERIALIZED VIEW CONCURRENTLY mv_pencapaian_sales_bulanan;
      REFRESH MATERIALIZED VIEW CONCURRENTLY mv_pencapaian_part_bulanan;
      REFRESH MATERIALIZED VIEW CONCURRENTLY mv_hutang_per_sales;
      REFRESH MATERIALIZED VIEW CONCURRENTLY mv_omzet_bulanan;
    `)

    updateTag('dashboard1')
    updateTag('dashboard2')

    return { success: true }
  } catch (error) {
    console.error('Refresh MV error:', error)
    return { error: 'Gagal refresh data dashboard' }
  }
}