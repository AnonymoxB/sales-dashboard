'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'

const MODELS = [
  'cabang', 'customer', 'sales', 'merk', 'jenis', 'bahan', 'part',
  'penjualan', 'target', 'faktur', 'hutang',
] as const

export type TrashModel = typeof MODELS[number]

export async function restoreItem(model: TrashModel, id: number | bigint) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any)[model].update({
      where: { id },
      data: { deletedAt: null },
    })
    revalidatePath('/dashboard/trash')
    revalidatePath(`/dashboard/${model}`)
    return { success: true }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function permanentDelete(model: TrashModel, id: number | bigint) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any)[model].delete({ where: { id } })
    revalidatePath('/dashboard/trash')
    return { success: true }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function restoreAll(model: TrashModel) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (prisma as any)[model].updateMany({
      where: { NOT: { deletedAt: null } },
      data: { deletedAt: null },
    })
    revalidatePath('/dashboard/trash')
    revalidatePath(`/dashboard/${model}`)
    return { success: true, count: result.count }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function emptyTrash(model: TrashModel) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (prisma as any)[model].deleteMany({
      where: { NOT: { deletedAt: null } },
    })
    revalidatePath('/dashboard/trash')
    return { success: true, count: result.count }
  } catch (e) {
    return { error: (e as Error).message }
  }
}