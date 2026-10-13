'use server'

import { revalidatePath, updateTag } from 'next/cache'
import prisma from '@/lib/prisma'
import { targetBulkSchema, type TargetBulkInput } from '@/lib/validations/target'

export async function upsertTargetBulk(input: TargetBulkInput) {
  const parsed = targetBulkSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const periode = new Date(parsed.data.periode)

  try {
    // Ambil sales terkait untuk dapat idCabang
    const salesIds = parsed.data.items.map((i) => i.idSales)
    const salesList = await prisma.sales.findMany({
      where: { id: { in: salesIds } },
      select: { id: true, idCabang: true },
    })
    const salesMap = new Map(salesList.map((s) => [s.id, s.idCabang]))

    // Upsert per item
    const operations = parsed.data.items.map((item) => {
      const idCabang = salesMap.get(item.idSales)
      if (!idCabang) return null

      if (item.targetOmzet === 0) {
        // Hapus target kalau 0
        return prisma.target.deleteMany({
          where: { periode, idSales: item.idSales },
        })
      }

      return prisma.target.upsert({
        where: {
          periode_idSales: {
            periode,
            idSales: item.idSales,
          },
        },
        update: { targetOmzet: item.targetOmzet },
        create: {
          periode,
          idSales: item.idSales,
          idCabang,
          targetOmzet: item.targetOmzet,
        },
      })
    })

    await prisma.$transaction(operations.filter((op) => op !== null) as any[])

    revalidatePath('/dashboard/target')
    updateTag('dashboard1')
    updateTag('dashboard2')
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
    await prisma.target.deleteMany({ where: { periode: date } })
    revalidatePath('/dashboard/target')
    updateTag('dashboard1')
    updateTag('dashboard2')
    return { success: true }
  } catch (e: unknown) {
    const err = e as { message?: string }
    return { error: err.message ?? 'Gagal menghapus target' }
  }
}