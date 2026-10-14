'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { requireAction } from '@/lib/rbac'
import { penjualanSchema, type PenjualanInput } from '@/lib/validations/penjualan'
import { refreshDashboardMV } from './refresh-mv'

function hitungTotal(qty: number, hargaSatuan: number, diskon: number) {
  return Math.max(0, qty * hargaSatuan - diskon)
}

export async function createPenjualan(input: PenjualanInput) {
  try {
    await requireAction('penjualan.create')

    const parsed = penjualanSchema.safeParse(input)
    if (!parsed.success) return { error: parsed.error.issues[0].message }

    const sales = await prisma.sales.findUnique({
      where: { id: parsed.data.idSales, deletedAt: null },
      select: { idCabang: true },
    })
    if (!sales) return { error: 'Sales tidak ditemukan' }

    const totalOmzet = hitungTotal(
      parsed.data.qty,
      parsed.data.hargaSatuan,
      parsed.data.diskon
    )

    await prisma.penjualan.create({
      data: {
        tanggal: new Date(parsed.data.tanggal),
        idSales: parsed.data.idSales,
        idPart: parsed.data.idPart,
        idCabang: sales.idCabang,
        qty: parsed.data.qty,
        hargaSatuan: parsed.data.hargaSatuan,
        diskon: parsed.data.diskon,
        totalOmzet,
        source: 'manual',
      },
    })

    revalidatePath('/dashboard/penjualan')
    await refreshDashboardMV()
    return { success: true }
  } catch (e: unknown) {
    const err = e as { message?: string }
    return { error: err.message ?? 'Gagal menyimpan penjualan' }
  }
}

export async function updatePenjualan(id: bigint, input: PenjualanInput) {
  try {
    await requireAction('penjualan.update')

    const parsed = penjualanSchema.safeParse(input)
    if (!parsed.success) return { error: parsed.error.issues[0].message }

    const sales = await prisma.sales.findUnique({
      where: { id: parsed.data.idSales, deletedAt: null },
      select: { idCabang: true },
    })
    if (!sales) return { error: 'Sales tidak ditemukan' }

    const totalOmzet = hitungTotal(
      parsed.data.qty,
      parsed.data.hargaSatuan,
      parsed.data.diskon
    )

    await prisma.penjualan.update({
      where: { id },
      data: {
        tanggal: new Date(parsed.data.tanggal),
        idSales: parsed.data.idSales,
        idPart: parsed.data.idPart,
        idCabang: sales.idCabang,
        qty: parsed.data.qty,
        hargaSatuan: parsed.data.hargaSatuan,
        diskon: parsed.data.diskon,
        totalOmzet,
      },
    })

    revalidatePath('/dashboard/penjualan')
    await refreshDashboardMV()
    return { success: true }
  } catch (e: unknown) {
    const err = e as { message?: string }
    return { error: err.message ?? 'Gagal mengubah penjualan' }
  }
}

export async function deletePenjualan(id: bigint) {
  try {
    await requireAction('penjualan.delete')

    await prisma.penjualan.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    revalidatePath('/dashboard/penjualan')
    await refreshDashboardMV()
    return { success: true }
  } catch (e: unknown) {
    const err = e as { message?: string }
    return { error: err.message ?? 'Gagal menghapus penjualan' }
  }
}