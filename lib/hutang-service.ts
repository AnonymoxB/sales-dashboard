import 'server-only'
import prisma from '@/lib/prisma'
import { fakturSchema, type FakturInput } from '@/lib/validations/hutang'

/**
 * Internal service — dipakai oleh API endpoint (sudah punya auth sendiri)
 * dan oleh createFaktur (yang sudah cek permission).
 *
 * TIDAK BOLEH di-expose sebagai server action.
 * File ini pakai 'server-only' untuk cegah import dari client component.
 */
export async function createFakturInternal(input: FakturInput) {
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

    return { success: true as const, id: faktur.id.toString() }
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string }
    if (err.code === 'P2002') return { error: 'Nomor faktur sudah digunakan' }
    return { error: err.message ?? 'Gagal menyimpan faktur' }
  }
}