'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { requireAction } from '@/lib/rbac'
import { cabangSchema, type CabangInput } from '@/lib/validations/cabang'

export async function createCabang(input: CabangInput) {
  try {
    await requireAction('master.create')

    const parsed = cabangSchema.safeParse(input)
    if (!parsed.success) return { error: parsed.error.issues[0].message }

    await prisma.cabang.create({
      data: {
        kode: parsed.data.kode,
        nama: parsed.data.nama,
        wilayah: parsed.data.wilayah || null,
        alamat: parsed.data.alamat || null,
        source: 'manual',
      },
    })
    revalidatePath('/dashboard/cabang')
    return { success: true }
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string }
    if (err.code === 'P2002') return { error: 'Kode cabang sudah digunakan' }
    return { error: err.message ?? 'Gagal menyimpan cabang' }
  }
}

export async function updateCabang(id: number, input: CabangInput) {
  try {
    await requireAction('master.update')

    const parsed = cabangSchema.safeParse(input)
    if (!parsed.success) return { error: parsed.error.issues[0].message }

    await prisma.cabang.update({
      where: { id },
      data: {
        kode: parsed.data.kode,
        nama: parsed.data.nama,
        wilayah: parsed.data.wilayah || null,
        alamat: parsed.data.alamat || null,
      },
    })
    revalidatePath('/dashboard/cabang')
    return { success: true }
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string }
    if (err.code === 'P2002') return { error: 'Kode cabang sudah digunakan' }
    return { error: err.message ?? 'Gagal mengubah cabang' }
  }
}

export async function deleteCabang(id: number) {
  try {
    await requireAction('master.delete')

    const cabang = await prisma.cabang.findUnique({
      where: { id, deletedAt: null },
      include: {
        _count: {
          select: {
            sales: { where: { deletedAt: null } },
            penjualan: { where: { deletedAt: null } },
            target: { where: { deletedAt: null } },
            hutang: { where: { deletedAt: null } },
            faktur: { where: { deletedAt: null } },
            users: true,
          },
        },
      },
    })

    if (!cabang) return { error: 'Cabang tidak ditemukan' }

    const totalRelasi =
      cabang._count.sales +
      cabang._count.penjualan +
      cabang._count.target +
      cabang._count.hutang +
      cabang._count.faktur +
      cabang._count.users

    if (totalRelasi > 0) {
      return {
        error: `Cabang masih dipakai oleh ${totalRelasi} data terkait. Nonaktifkan atau hapus data terkait dulu.`,
      }
    }

    // SOFT DELETE
    await prisma.cabang.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    revalidatePath('/dashboard/cabang')
    return { success: true }
  } catch (e: unknown) {
    const err = e as { message?: string }
    return { error: err.message ?? 'Gagal menghapus cabang' }
  }
}