'use server'

import { revalidatePath, updateTag } from 'next/cache'
import prisma from '@/lib/prisma'
import {
  fakturSchema,
  pembayaranSchema,
  type FakturInput,
  type PembayaranInput,
} from '@/lib/validations/hutang'

export async function createFaktur(input: FakturInput) {
  const parsed = fakturSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  try {
    // Ambil idCabang dari sales
    const sales = await prisma.sales.findUnique({
      where: { id: parsed.data.idSales },
      select: { idCabang: true },
    })
    if (!sales) return { error: 'Sales tidak ditemukan' }

    // Hitung total tagihan
    const totalTagihan = parsed.data.items.reduce(
      (sum, item) => sum + item.qty * item.hargaSatuan,
      0
    )

    const tanggal = new Date(parsed.data.tanggal)
    const jatuhTempo = new Date(parsed.data.jatuhTempo)

    // Transaction: Faktur + DetailFaktur + Hutang
    const faktur = await prisma.$transaction(async (tx) => {
      const newFaktur = await tx.faktur.create({
        data: {
          nomorFaktur: parsed.data.nomorFaktur,
          tanggal,
          jatuhTempo,
          idSales: parsed.data.idSales,
          idCabang: sales.idCabang,
          totalTagihan,
          status: 'BELUM_LUNAS',
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

      // Buat hutang otomatis
      await tx.hutang.create({
        data: {
          idFaktur: newFaktur.id,
          idSales: parsed.data.idSales,
          idCabang: sales.idCabang,
          tanggalFaktur: tanggal,
          jatuhTempo,
          totalHutang: totalTagihan,
          totalBayar: 0,
          sisaHutang: totalTagihan,
          statusLunas: false,
        },
      })

      return newFaktur
    })

    revalidatePath('/dashboard/hutang')
    updateTag('dashboard1')
    updateTag('dashboard2')
    return { success: true, id: faktur.id.toString() }
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string }
    if (err.code === 'P2002') return { error: 'Nomor faktur sudah digunakan' }
    return { error: err.message ?? 'Gagal menyimpan faktur' }
  }
}

export async function deleteFaktur(id: bigint) {
  try {
    // Cek pembayaran
    const hutang = await prisma.hutang.findFirst({
      where: { idFaktur: id },
    })
    if (hutang && Number(hutang.totalBayar) > 0) {
      return {
        error: 'Faktur sudah ada pembayaran. Hapus pembayaran dulu atau batalkan secara manual.',
      }
    }

    // Cascade: Hutang + DetailFaktur akan terhapus otomatis
    await prisma.$transaction(async (tx) => {
      await tx.hutang.deleteMany({ where: { idFaktur: id } })
      await tx.detailFaktur.deleteMany({ where: { idFaktur: id } })
      await tx.faktur.delete({ where: { id } })
    })

    revalidatePath('/dashboard/hutang')
    updateTag('dashboard1')
    updateTag('dashboard2')
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
      where: { id: parsed.data.idHutang },
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

      // Update status faktur kalau lunas
      if (lunas) {
        await tx.faktur.update({
          where: { id: hutang.idFaktur },
          data: { status: 'LUNAS' },
        })
      }
    })

    revalidatePath('/dashboard/hutang')
    updateTag('dashboard1')
    updateTag('dashboard2')
    return { success: true }
  } catch (e: unknown) {
    const err = e as { message?: string }
    return { error: err.message ?? 'Gagal menyimpan pembayaran' }
  }
}