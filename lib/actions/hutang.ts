'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { requireAction } from '@/lib/rbac'
import {
  pembayaranSchema,
  type FakturInput,
  type PembayaranInput,
} from '@/lib/validations/hutang'
import { createFakturInternal } from '@/lib/hutang-service'
import { refreshDashboardMV } from './refresh-mv'

// Dari UI — cek permission
export async function createFaktur(input: FakturInput) {
  try {
    await requireAction('faktur.create')

    const result = await createFakturInternal(input)

    // Kalau sukses (tidak ada 'error' di result)
    if (!('error' in result)) {
      revalidatePath('/dashboard/hutang')
      await refreshDashboardMV()
    }

    return result
  } catch (e: unknown) {
    return { error: (e as Error).message }
  }
}

export async function deleteFaktur(id: bigint) {
  try {
    await requireAction('faktur.delete')
    const hutang = await prisma.hutang.findFirst({
      where: { idFaktur: id, deletedAt: null },
    })
    if (hutang && Number(hutang.totalBayar) > 0) {
      return { error: 'Faktur sudah ada pembayaran. Tidak bisa dihapus.' }
    }

    await prisma.$transaction(async (tx) => {
      await tx.hutang.updateMany({
        where: { idFaktur: id },
        data: { deletedAt: new Date() },
      })
      await tx.faktur.update({
        where: { id },
        data: { deletedAt: new Date() },
      })
    })

    revalidatePath('/dashboard/hutang')
    await refreshDashboardMV()
    return { success: true }
  } catch (e: unknown) {
    const err = e as { message?: string }
    return { error: err.message ?? 'Gagal menghapus faktur' }
  }
}

export async function bayarHutang(input: PembayaranInput) {
  try {
    await requireAction('faktur.bayar')
    const parsed = pembayaranSchema.safeParse(input)
    if (!parsed.success) return { error: parsed.error.issues[0].message }

    const hutang = await prisma.hutang.findUnique({
      where: { id: parsed.data.idHutang, deletedAt: null },
    })
    if (!hutang) return { error: 'Hutang tidak ditemukan' }
    if (hutang.statusLunas) return { error: 'Hutang sudah lunas' }

    const sisaSekarang = Number(hutang.sisaHutang)
    if (parsed.data.jumlahBayar > sisaSekarang) {
      return {
        error: `Jumlah bayar melebihi sisa hutang (${sisaSekarang.toLocaleString('id-ID')})`,
      }
    }

    const totalBayarBaru = Number(hutang.totalBayar) + parsed.data.jumlahBayar
    const sisaBaru = Number(hutang.totalHutang) - totalBayarBaru
    const lunas = sisaBaru <= 0

    await prisma.$transaction(async (tx) => {
      await tx.hutang.update({
        where: { id: parsed.data.idHutang },
        data: {
          totalBayar: totalBayarBaru,
          sisaHutang: Math.max(0, sisaBaru),
          statusLunas: lunas,
        },
      })

      if (lunas) {
        await tx.faktur.update({
          where: { id: hutang.idFaktur },
          data: { status: 'LUNAS' },
        })
      }
    })

    revalidatePath('/dashboard/hutang')
    await refreshDashboardMV()
    return { success: true }
  } catch (e: unknown) {
    const err = e as { message?: string }
    return { error: err.message ?? 'Gagal menyimpan pembayaran' }
  }
}