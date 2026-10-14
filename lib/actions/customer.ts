'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { requireAction } from '@/lib/rbac'
import { customerSchema, type CustomerInput } from '@/lib/validations/customer'

export async function createCustomer(input: CustomerInput) {
  try {
    await requireAction('master.create')

    const parsed = customerSchema.safeParse(input)
    if (!parsed.success) return { error: parsed.error.issues[0].message }

    await prisma.customer.create({
      data: {
        kode: parsed.data.kode,
        nama: parsed.data.nama,
        alamat: parsed.data.alamat || null,
        telepon: parsed.data.telepon || null,
        aktif: parsed.data.aktif,
        source: 'manual',
      },
    })
    revalidatePath('/dashboard/customer')
    return { success: true }
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string }
    if (err.code === 'P2002') return { error: 'Kode customer sudah digunakan' }
    return { error: err.message ?? 'Gagal menyimpan customer' }
  }
}

export async function updateCustomer(id: number, input: CustomerInput) {
  try {
    await requireAction('master.update')

    const parsed = customerSchema.safeParse(input)
    if (!parsed.success) return { error: parsed.error.issues[0].message }

    await prisma.customer.update({
      where: { id },
      data: {
        kode: parsed.data.kode,
        nama: parsed.data.nama,
        alamat: parsed.data.alamat || null,
        telepon: parsed.data.telepon || null,
        aktif: parsed.data.aktif,
      },
    })
    revalidatePath('/dashboard/customer')
    return { success: true }
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string }
    if (err.code === 'P2002') return { error: 'Kode customer sudah digunakan' }
    return { error: err.message ?? 'Gagal mengubah customer' }
  }
}

export async function deleteCustomer(id: number) {
  try {
    await requireAction('master.delete')

    const customer = await prisma.customer.findUnique({
      where: { id, deletedAt: null },
      include: {
        _count: {
          select: {
            faktur: { where: { deletedAt: null } },
            penjualan: { where: { deletedAt: null } },
          },
        },
      },
    })

    if (!customer) return { error: 'Customer tidak ditemukan' }

    const total = customer._count.faktur + customer._count.penjualan
    if (total > 0) {
      return {
        error: `Customer masih dipakai di ${total} transaksi. Nonaktifkan saja daripada dihapus.`,
      }
    }

    // SOFT DELETE
    await prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    revalidatePath('/dashboard/customer')
    return { success: true }
  } catch (e: unknown) {
    const err = e as { message?: string }
    return { error: err.message ?? 'Gagal menghapus customer' }
  }
}