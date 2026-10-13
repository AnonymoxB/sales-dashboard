import { z } from 'zod'

export const cabangSchema = z.object({
  kode: z.string().min(2, 'Kode minimal 2 karakter').max(20),
  nama: z.string().min(2, 'Nama minimal 2 karakter').max(100),
  wilayah: z.string().max(100).optional().or(z.literal('')),
  alamat: z.string().max(255).optional().or(z.literal('')),
})

export type CabangInput = z.infer<typeof cabangSchema>