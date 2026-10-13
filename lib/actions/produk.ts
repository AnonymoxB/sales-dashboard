'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import {
  merkSchema,
  jenisSchema,
  bahanSchema,
  partSchema,
  type MerkInput,
  type JenisInput,
  type BahanInput,
  type PartInput,
} from '@/lib/validations/produk'

// ============================================
// MERK
// ============================================
export async function createMerk(input: MerkInput) {
  const parsed = merkSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  try {
    await prisma.merk.create({
      data: { kode: parsed.data.kode, nama: parsed.data.nama },
    })
    revalidatePath('/dashboard/produk')
    return { success: true }
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string }
    if (err.code === 'P2002') return { error: 'Kode merk sudah digunakan' }
    return { error: err.message ?? 'Gagal menyimpan merk' }
  }
}

export async function updateMerk(id: number, input: MerkInput) {
  const parsed = merkSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  try {
    await prisma.merk.update({
      where: { id },
      data: { kode: parsed.data.kode, nama: parsed.data.nama },
    })
    revalidatePath('/dashboard/produk')
    return { success: true }
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string }
    if (err.code === 'P2002') return { error: 'Kode merk sudah digunakan' }
    return { error: err.message ?? 'Gagal mengubah merk' }
  }
}

export async function deleteMerk(id: number) {
  try {
    const merk = await prisma.merk.findUnique({
      where: { id },
      include: { _count: { select: { bahan: true } } },
    })
    if (!merk) return { error: 'Merk tidak ditemukan' }
    if (merk._count.bahan > 0) {
      return {
        error: `Merk masih dipakai oleh ${merk._count.bahan} bahan. Hapus bahan terkait dulu.`,
      }
    }
    await prisma.merk.delete({ where: { id } })
    revalidatePath('/dashboard/produk')
    return { success: true }
  } catch (e: unknown) {
    const err = e as { message?: string }
    return { error: err.message ?? 'Gagal menghapus merk' }
  }
}

// ============================================
// JENIS
// ============================================
export async function createJenis(input: JenisInput) {
  const parsed = jenisSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  try {
    await prisma.jenis.create({
      data: { kode: parsed.data.kode, nama: parsed.data.nama },
    })
    revalidatePath('/dashboard/produk')
    return { success: true }
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string }
    if (err.code === 'P2002') return { error: 'Kode jenis sudah digunakan' }
    return { error: err.message ?? 'Gagal menyimpan jenis' }
  }
}

export async function updateJenis(id: number, input: JenisInput) {
  const parsed = jenisSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  try {
    await prisma.jenis.update({
      where: { id },
      data: { kode: parsed.data.kode, nama: parsed.data.nama },
    })
    revalidatePath('/dashboard/produk')
    return { success: true }
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string }
    if (err.code === 'P2002') return { error: 'Kode jenis sudah digunakan' }
    return { error: err.message ?? 'Gagal mengubah jenis' }
  }
}

export async function deleteJenis(id: number) {
  try {
    const jenis = await prisma.jenis.findUnique({
      where: { id },
      include: { _count: { select: { bahan: true } } },
    })
    if (!jenis) return { error: 'Jenis tidak ditemukan' }
    if (jenis._count.bahan > 0) {
      return {
        error: `Jenis masih dipakai oleh ${jenis._count.bahan} bahan. Hapus bahan terkait dulu.`,
      }
    }
    await prisma.jenis.delete({ where: { id } })
    revalidatePath('/dashboard/produk')
    return { success: true }
  } catch (e: unknown) {
    const err = e as { message?: string }
    return { error: err.message ?? 'Gagal menghapus jenis' }
  }
}

// ============================================
// BAHAN
// ============================================
export async function createBahan(input: BahanInput) {
  const parsed = bahanSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  try {
    await prisma.bahan.create({
      data: {
        kode: parsed.data.kode,
        nama: parsed.data.nama,
        idMerk: parsed.data.idMerk,
        idJenis: parsed.data.idJenis,
      },
    })
    revalidatePath('/dashboard/produk')
    return { success: true }
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string }
    if (err.code === 'P2002') return { error: 'Kode bahan sudah digunakan' }
    return { error: err.message ?? 'Gagal menyimpan bahan' }
  }
}

export async function updateBahan(id: number, input: BahanInput) {
  const parsed = bahanSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  try {
    await prisma.bahan.update({
      where: { id },
      data: {
        kode: parsed.data.kode,
        nama: parsed.data.nama,
        idMerk: parsed.data.idMerk,
        idJenis: parsed.data.idJenis,
      },
    })
    revalidatePath('/dashboard/produk')
    return { success: true }
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string }
    if (err.code === 'P2002') return { error: 'Kode bahan sudah digunakan' }
    return { error: err.message ?? 'Gagal mengubah bahan' }
  }
}

export async function deleteBahan(id: number) {
  try {
    const bahan = await prisma.bahan.findUnique({
      where: { id },
      include: { _count: { select: { part: true } } },
    })
    if (!bahan) return { error: 'Bahan tidak ditemukan' }
    if (bahan._count.part > 0) {
      return {
        error: `Bahan masih dipakai oleh ${bahan._count.part} part. Hapus part terkait dulu.`,
      }
    }
    await prisma.bahan.delete({ where: { id } })
    revalidatePath('/dashboard/produk')
    return { success: true }
  } catch (e: unknown) {
    const err = e as { message?: string }
    return { error: err.message ?? 'Gagal menghapus bahan' }
  }
}

// ============================================
// PART
// ============================================
export async function createPart(input: PartInput) {
  const parsed = partSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  try {
    await prisma.part.create({
      data: {
        kode: parsed.data.kode,
        nama: parsed.data.nama,
        idBahan: parsed.data.idBahan,
        satuan: parsed.data.satuan,
        hargaJual: parsed.data.hargaJual,
        aktif: parsed.data.aktif,
      },
    })
    revalidatePath('/dashboard/produk')
    return { success: true }
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string }
    if (err.code === 'P2002') return { error: 'Kode part sudah digunakan' }
    return { error: err.message ?? 'Gagal menyimpan part' }
  }
}

export async function updatePart(id: number, input: PartInput) {
  const parsed = partSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  try {
    await prisma.part.update({
      where: { id },
      data: {
        kode: parsed.data.kode,
        nama: parsed.data.nama,
        idBahan: parsed.data.idBahan,
        satuan: parsed.data.satuan,
        hargaJual: parsed.data.hargaJual,
        aktif: parsed.data.aktif,
      },
    })
    revalidatePath('/dashboard/produk')
    return { success: true }
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string }
    if (err.code === 'P2002') return { error: 'Kode part sudah digunakan' }
    return { error: err.message ?? 'Gagal mengubah part' }
  }
}

export async function deletePart(id: number) {
  try {
    const part = await prisma.part.findUnique({
      where: { id },
      include: {
        _count: {
          select: { penjualan: true, detailFaktur: true },
        },
      },
    })
    if (!part) return { error: 'Part tidak ditemukan' }

    const total = part._count.penjualan + part._count.detailFaktur
    if (total > 0) {
      return {
        error: `Part masih dipakai oleh ${total} transaksi. Hapus transaksi terkait dulu.`,
      }
    }
    await prisma.part.delete({ where: { id } })
    revalidatePath('/dashboard/produk')
    return { success: true }
  } catch (e: unknown) {
    const err = e as { message?: string }
    return { error: err.message ?? 'Gagal menghapus part' }
  }
}