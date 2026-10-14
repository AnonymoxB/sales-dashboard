'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
  })
  if (!dbUser || dbUser.role !== 'ADMIN' || dbUser.status !== 'APPROVED') {
    throw new Error('Forbidden: Admin only')
  }
  return dbUser
}

export async function approveUser(userId: string) {
  try {
    const admin = await requireAdmin()

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
    const admin = await requireAdmin()

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

export async function changeUserRole(userId: string, role: 'ADMIN' | 'MANAGER' | 'SALES') {
  try {
    const admin = await requireAdmin()

    // Cegah admin ubah role dirinya sendiri (opsional)
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
    const admin = await requireAdmin()

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
    await requireAdmin()

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