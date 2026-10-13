import { z } from 'zod'

export const fakturItemSchema = z.object({
  idPart: z.coerce.number().int().positive('Pilih part'),
  qty: z.coerce.number().int().positive('Qty minimal 1'),
  hargaSatuan: z.coerce.number().min(0),
})

export const fakturSchema = z.object({
  nomorFaktur: z.string().min(2).max(50),
  tanggal: z.string().min(1, 'Tanggal wajib'),
  jatuhTempo: z.string().min(1, 'Jatuh tempo wajib'),
  idSales: z.coerce.number().int().positive('Pilih sales'),
  items: z.array(fakturItemSchema).min(1, 'Minimal 1 item'),
})

export type FakturInput = z.infer<typeof fakturSchema>
export type FakturItemInput = z.infer<typeof fakturItemSchema>

export const pembayaranSchema = z.object({
  idHutang: z.coerce.number().int().positive(),
  jumlahBayar: z.coerce.number().positive('Jumlah bayar harus > 0'),
})

export type PembayaranInput = z.infer<typeof pembayaranSchema>