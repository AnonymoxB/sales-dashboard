import { z } from 'zod'

export const customerSchema = z.object({
  kode: z.string().min(2, 'Kode minimal 2 karakter').max(20),
  nama: z.string().min(2, 'Nama minimal 2 karakter').max(100),
  alamat: z.string().max(255).optional().or(z.literal('')),
  telepon: z.string().max(30).optional().or(z.literal('')),
  aktif: z.coerce.boolean().default(true),
})

export type CustomerInput = z.infer<typeof customerSchema>