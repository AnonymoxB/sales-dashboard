'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { requireAction } from '@/lib/rbac'

export async function approveUser(userId: string) {
  try {
    const admin = await requireAction('admin.users')

    await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: admin.email,
        rejectedAt: null,
        rejectedBy: null,
        rejectReason: null,
      },
    })
    revalidatePath('/dashboard/users')
    return { success: true }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function rejectUser(userId: string, reason: string) {
  try {
    const admin = await requireAction('admin.users')

    await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectedBy: admin.email,
        rejectReason: reason || null,
      },
    })
    revalidatePath('/dashboard/users')
    return { success: true }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function changeUserRole(
  userId: string,
  role: 'ADMIN' | 'MANAGER' | 'SALES'
) {
  try {
    const admin = await requireAction('admin.users')

    // Cegah admin ubah role dirinya sendiri
    if (admin.id === userId) {
      return { error: 'Tidak bisa mengubah role Anda sendiri' }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { role },
    })
    revalidatePath('/dashboard/users')
    return { success: true }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function deleteUser(userId: string) {
  try {
    const admin = await requireAction('admin.users')

    if (admin.id === userId) {
      return { error: 'Tidak bisa menghapus akun Anda sendiri' }
    }

    await prisma.user.delete({ where: { id: userId } })
    revalidatePath('/dashboard/users')
    return { success: true }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function setUserCabang(userId: string, idCabang: number | null) {
  try {
    await requireAction('admin.users')

    await prisma.user.update({
      where: { id: userId },
      data: { idCabang },
    })
    revalidatePath('/dashboard/users')
    return { success: true }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function updateUser(
  userId: string,
  data: {
    nama?: string
    idCabang?: number | null
  }
) {
  try {
    await requireAction('admin.users')

    await prisma.user.update({
      where: { id: userId },
      data: {
        nama: data.nama?.trim() || null,
        idCabang: data.idCabang ?? null,
      },
    })
    revalidatePath('/dashboard/users')
    return { success: true }
  } catch (e) {
    return { error: (e as Error).message }
  }
}