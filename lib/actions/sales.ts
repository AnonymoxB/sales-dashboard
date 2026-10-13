'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { salesSchema, type SalesInput } from '@/lib/validations/sales'
import { refreshDashboardMV } from './refresh-mv'

export async function createSales(input: SalesInput) {
  const parsed = salesSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  try {
    await prisma.sales.create({
      data: {
        kode: parsed.data.kode,
        nama: parsed.data.nama,
        idCabang: parsed.data.idCabang,
        telepon: parsed.data.telepon || null,
        aktif: parsed.data.aktif,
        source: 'manual',
      },
    })
    revalidatePath('/dashboard/sales')
    await refreshDashboardMV()
    return { success: true }
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string }
    if (err.code === 'P2002') return { error: 'Kode sales sudah digunakan' }
    return { error: err.message ?? 'Gagal menyimpan sales' }
  }
}

export async function updateSales(id: number, input: SalesInput) {
  const parsed = salesSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  try {
    await prisma.sales.update({
      where: { id },
      data: {
        kode: parsed.data.kode,
        nama: parsed.data.nama,
        idCabang: parsed.data.idCabang,
        telepon: parsed.data.telepon || null,
        aktif: parsed.data.aktif,
      },
    })
    revalidatePath('/dashboard/sales')
    await refreshDashboardMV()
    return { success: true }
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string }
    if (err.code === 'P2002') return { error: 'Kode sales sudah digunakan' }
    return { error: err.message ?? 'Gagal mengubah sales' }
  }
}

export async function deleteSales(id: number) {
  try {
    const sales = await prisma.sales.findUnique({
      where: { id, deletedAt: null },
      include: {
        _count: {
          select: {
            penjualan: { where: { deletedAt: null } },
            target: { where: { deletedAt: null } },
            hutang: { where: { deletedAt: null } },
            faktur: { where: { deletedAt: null } },
          },
        },
      },
    })

    if (!sales) return { error: 'Sales tidak ditemukan' }

    const totalRelasi =
      sales._count.penjualan +
      sales._count.target +
      sales._count.hutang +
      sales._count.faktur

    if (totalRelasi > 0) {
      return {
        error: `Sales masih dipakai oleh ${totalRelasi} data terkait. Nonaktifkan atau hapus data terkait dulu.`,
      }
    }

    // SOFT DELETE
    await prisma.sales.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    revalidatePath('/dashboard/sales')
    await refreshDashboardMV()
    return { success: true }
  } catch (e: unknown) {
    const err = e as { message?: string }
    return { error: err.message ?? 'Gagal menghapus sales' }
  }
}