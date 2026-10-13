'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { targetBulkSchema, type TargetBulkInput } from '@/lib/validations/target'
import { refreshDashboardMV } from './refresh-mv'

export async function upsertTargetBulk(input: TargetBulkInput) {
  const parsed = targetBulkSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const periode = new Date(parsed.data.periode)

  try {
    const salesIds = parsed.data.items.map((i) => i.idSales)
    const salesList = await prisma.sales.findMany({
      where: { id: { in: salesIds }, deletedAt: null },
      select: { id: true, idCabang: true },
    })
    const salesMap = new Map(salesList.map((s) => [s.id, s.idCabang]))

    const operations = parsed.data.items.map((item) => {
      const idCabang = salesMap.get(item.idSales)
      if (!idCabang) return null

      if (item.targetOmzet === 0) {
        // Set target 0 → soft delete
        return prisma.target.updateMany({
          where: { periode, idSales: item.idSales, deletedAt: null },
          data: { deletedAt: new Date() },
        })
      }

      return prisma.target.upsert({
        where: {
          periode_idSales: { periode, idSales: item.idSales },
        },
        update: {
          targetOmzet: item.targetOmzet,
          deletedAt: null,
        },
        create: {
          periode,
          idSales: item.idSales,
          idCabang,
          targetOmzet: item.targetOmzet,
          source: 'manual',
        },
      })
    })

    await prisma.$transaction(operations.filter((op) => op !== null) as never[])

    revalidatePath('/dashboard/target')
    await refreshDashboardMV()
    return { success: true }
  } catch (e: unknown) {
    const err = e as { message?: string }
    console.error('Upsert target error:', err)
    return { error: err.message ?? 'Gagal menyimpan target' }
  }
}

export async function deleteTargetPeriode(periode: string) {
  try {
    const date = new Date(periode)
    await prisma.target.updateMany({
      where: { periode: date, deletedAt: null },
      data: { deletedAt: new Date() },
    })
    revalidatePath('/dashboard/target')
    await refreshDashboardMV()
    return { success: true }
  } catch (e: unknown) {
    const err = e as { message?: string }
    return { error: err.message ?? 'Gagal menghapus target' }
  }
}