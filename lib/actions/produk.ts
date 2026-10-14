'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { requireAction } from '@/lib/rbac'
import {
  merkSchema, jenisSchema, bahanSchema, partSchema,
  type MerkInput, type JenisInput, type BahanInput, type PartInput,
} from '@/lib/validations/produk'

// ============================================
// MERK
// ============================================
export async function createMerk(input: MerkInput) {
  try {
    await requireAction('master.create')
    const parsed = merkSchema.safeParse(input)
    if (!parsed.success) return { error: parsed.error.issues[0].message }

    await prisma.merk.create({
      data: { kode: parsed.data.kode, nama: parsed.data.nama, source: 'manual' },
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
  try {
    await requireAction('master.update')
    const parsed = merkSchema.safeParse(input)
    if (!parsed.success) return { error: parsed.error.issues[0].message }

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
    await requireAction('master.delete')

    const merk = await prisma.merk.findUnique({
      where: { id, deletedAt: null },
      include: { _count: { select: { bahan: { where: { deletedAt: null } } } } },
    })
    if (!merk) return { error: 'Merk tidak ditemukan' }
    if (merk._count.bahan > 0) {
      return { error: `Merk masih dipakai oleh ${merk._count.bahan} bahan.` }
    }
    await prisma.merk.update({ where: { id }, data: { deletedAt: new Date() } })
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
  try {
    await requireAction('master.create')
    const parsed = jenisSchema.safeParse(input)
    if (!parsed.success) return { error: parsed.error.issues[0].message }

    await prisma.jenis.create({
      data: { kode: parsed.data.kode, nama: parsed.data.nama, source: 'manual' },
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
  try {
    await requireAction('master.update')
    const parsed = jenisSchema.safeParse(input)
    if (!parsed.success) return { error: parsed.error.issues[0].message }

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
    await requireAction('master.delete')

    const jenis = await prisma.jenis.findUnique({
      where: { id, deletedAt: null },
      include: { _count: { select: { bahan: { where: { deletedAt: null } } } } },
    })
    if (!jenis) return { error: 'Jenis tidak ditemukan' }
    if (jenis._count.bahan > 0) {
      return { error: `Jenis masih dipakai oleh ${jenis._count.bahan} bahan.` }
    }
    await prisma.jenis.update({ where: { id }, data: { deletedAt: new Date() } })
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
  try {
    await requireAction('master.create')
    const parsed = bahanSchema.safeParse(input)
    if (!parsed.success) return { error: parsed.error.issues[0].message }

    await prisma.bahan.create({
      data: {
        kode: parsed.data.kode,
        nama: parsed.data.nama,
        idMerk: parsed.data.idMerk,
        idJenis: parsed.data.idJenis,
        source: 'manual',
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
  try {
    await requireAction('master.update')
    const parsed = bahanSchema.safeParse(input)
    if (!parsed.success) return { error: parsed.error.issues[0].message }

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
    await requireAction('master.delete')

    const bahan = await prisma.bahan.findUnique({
      where: { id, deletedAt: null },
      include: { _count: { select: { part: { where: { deletedAt: null } } } } },
    })
    if (!bahan) return { error: 'Bahan tidak ditemukan' }
    if (bahan._count.part > 0) {
      return { error: `Bahan masih dipakai oleh ${bahan._count.part} part.` }
    }
    await prisma.bahan.update({ where: { id }, data: { deletedAt: new Date() } })
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
  try {
    await requireAction('master.create')
    const parsed = partSchema.safeParse(input)
    if (!parsed.success) return { error: parsed.error.issues[0].message }

    await prisma.part.create({
      data: {
        kode: parsed.data.kode,
        nama: parsed.data.nama,
        idBahan: parsed.data.idBahan,
        satuan: parsed.data.satuan,
        hargaJual: parsed.data.hargaJual,
        aktif: parsed.data.aktif,
        source: 'manual',
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
  try {
    await requireAction('master.update')
    const parsed = partSchema.safeParse(input)
    if (!parsed.success) return { error: parsed.error.issues[0].message }

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
    await requireAction('master.delete')

    const part = await prisma.part.findUnique({
      where: { id, deletedAt: null },
      include: {
        _count: {
          select: {
            penjualan: { where: { deletedAt: null } },
            detailFaktur: { where: { faktur: { deletedAt: null } } },
          },
        },
      },
    })
    if (!part) return { error: 'Part tidak ditemukan' }

    const total = part._count.penjualan + part._count.detailFaktur
    if (total > 0) {
      return { error: `Part masih dipakai oleh ${total} transaksi.` }
    }
    await prisma.part.update({ where: { id }, data: { deletedAt: new Date() } })
    revalidatePath('/dashboard/produk')
    return { success: true }
  } catch (e: unknown) {
    const err = e as { message?: string }
    return { error: err.message ?? 'Gagal menghapus part' }
  }
}