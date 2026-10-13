import { z } from 'zod'

// ===== MERK =====
export const merkSchema = z.object({
  kode: z.string().min(2, 'Kode minimal 2 karakter').max(20),
  nama: z.string().min(2, 'Nama minimal 2 karakter').max(100),
})
export type MerkInput = z.infer<typeof merkSchema>

// ===== JENIS =====
export const jenisSchema = z.object({
  kode: z.string().min(2, 'Kode minimal 2 karakter').max(20),
  nama: z.string().min(2, 'Nama minimal 2 karakter').max(100),
})
export type JenisInput = z.infer<typeof jenisSchema>

// ===== BAHAN =====
export const bahanSchema = z.object({
  kode: z.string().min(2, 'Kode minimal 2 karakter').max(20),
  nama: z.string().min(2, 'Nama minimal 2 karakter').max(100),
  idMerk: z.coerce.number().int().positive('Pilih merk'),
  idJenis: z.coerce.number().int().positive('Pilih jenis'),
})
export type BahanInput = z.infer<typeof bahanSchema>

// ===== PART =====
export const partSchema = z.object({
  kode: z.string().min(2, 'Kode minimal 2 karakter').max(20),
  nama: z.string().min(2, 'Nama minimal 2 karakter').max(100),
  idBahan: z.coerce.number().int().positive('Pilih bahan'),
  satuan: z.string().min(1, 'Satuan wajib').max(20).default('PCS'),
  hargaJual: z.coerce.number().min(0, 'Harga tidak boleh negatif'),
  aktif: z.coerce.boolean().default(true),
})
export type PartInput = z.infer<typeof partSchema>