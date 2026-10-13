'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import {
  fakturSchema,
  pembayaranSchema,
  type FakturInput,
  type PembayaranInput,
} from '@/lib/validations/hutang'
import { refreshDashboardMV } from './refresh-mv'

export async function createFaktur(input: FakturInput) {
  const parsed = fakturSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  try {
    const sales = await prisma.sales.findUnique({
      where: { id: parsed.data.idSales, deletedAt: null },
      select: { idCabang: true },
    })
    if (!sales) return { error: 'Sales tidak ditemukan' }

    const totalTagihan = parsed.data.items.reduce(
      (sum, item) => sum + item.qty * item.hargaSatuan,
      0
    )
    const subtotalDpp = totalTagihan
    const ppn = Math.round(subtotalDpp * 0.11)
    const total = subtotalDpp + ppn

    const tanggal = new Date(parsed.data.tanggal)
    const jatuhTempo = new Date(parsed.data.jatuhTempo)

    const faktur = await prisma.$transaction(async (tx) => {
      const newFaktur = await tx.faktur.create({
        data: {
          nomorFaktur: parsed.data.nomorFaktur,
          tanggal,
          jatuhTempo,
          idSales: parsed.data.idSales,
          idCabang: sales.idCabang,
          subtotalDpp,
          ppn,
          totalTagihan: total,
          status: 'BELUM_LUNAS',
          source: 'manual',
          detail: {
            create: parsed.data.items.map((item) => ({
              idPart: item.idPart,
              qty: item.qty,
              hargaSatuan: item.hargaSatuan,
              subtotal: item.qty * item.hargaSatuan,
            })),
          },
        },
      })

      await tx.hutang.create({
        data: {
          idFaktur: newFaktur.id,
          idSales: parsed.data.idSales,
          idCabang: sales.idCabang,
          tanggalFaktur: tanggal,
          jatuhTempo,
          totalHutang: total,
          totalBayar: 0,
          sisaHutang: total,
          statusLunas: false,
        },
      })

      return newFaktur
    })

    revalidatePath('/dashboard/hutang')
    await refreshDashboardMV()
    return { success: true, id: faktur.id.toString() }
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string }
    if (err.code === 'P2002') return { error: 'Nomor faktur sudah digunakan' }
    return { error: err.message ?? 'Gagal menyimpan faktur' }
  }
}

export async function deleteFaktur(id: bigint) {
  try {
    const hutang = await prisma.hutang.findFirst({
      where: { idFaktur: id, deletedAt: null },
    })
    if (hutang && Number(hutang.totalBayar) > 0) {
      return {
        error: 'Faktur sudah ada pembayaran. Tidak bisa dihapus.',
      }
    }

    // SOFT DELETE Faktur + Hutang
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
  const parsed = pembayaranSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  try {
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