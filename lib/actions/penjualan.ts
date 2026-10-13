'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import {
  penjualanSchema,
  type PenjualanInput,
} from '@/lib/validations/penjualan'
import { refreshDashboardMV } from './refresh-mv'

// Helper: hitung total omzet
function hitungTotal(qty: number, hargaSatuan: number, diskon: number) {
  return Math.max(0, qty * hargaSatuan - diskon)
}

export async function createPenjualan(input: PenjualanInput) {
  const parsed = penjualanSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  try {
    // Ambil idCabang dari sales
    const sales = await prisma.sales.findUnique({
      where: { id: parsed.data.idSales },
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
  const parsed = penjualanSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  try {
    const sales = await prisma.sales.findUnique({
      where: { id: parsed.data.idSales },
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
    await prisma.penjualan.delete({ where: { id } })
    revalidatePath('/dashboard/penjualan')
    await refreshDashboardMV()
    return { success: true }
  } catch (e: unknown) {
    const err = e as { message?: string }
    return { error: err.message ?? 'Gagal menghapus penjualan' }
  }
}