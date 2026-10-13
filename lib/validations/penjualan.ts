import { z } from 'zod'

export const penjualanSchema = z.object({
  tanggal: z.string().min(1, 'Tanggal wajib'),
  idSales: z.coerce.number().int().positive('Pilih sales'),
  idPart: z.coerce.number().int().positive('Pilih part'),
  qty: z.coerce.number().int().positive('Qty minimal 1'),
  hargaSatuan: z.coerce.number().min(0, 'Harga tidak boleh negatif'),
  diskon: z.coerce.number().min(0).default(0),
})

export type PenjualanInput = z.infer<typeof penjualanSchema>