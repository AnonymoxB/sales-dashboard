import { z } from 'zod'

export const salesSchema = z.object({
  kode: z.string().min(2, 'Kode minimal 2 karakter').max(20),
  nama: z.string().min(2, 'Nama minimal 2 karakter').max(100),
  idCabang: z.coerce.number().int().positive('Pilih cabang'),
  telepon: z.string().max(20).optional().or(z.literal('')),
  aktif: z.coerce.boolean().default(true),
})

export type SalesInput = z.infer<typeof salesSchema>