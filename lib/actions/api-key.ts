'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { generateApiKey } from '@/lib/api-key-utils'

export async function createApiKey(nama: string) {
  const trimmed = nama.trim()
  if (!trimmed) return { error: 'Nama wajib diisi' }
  if (trimmed.length > 100) return { error: 'Nama maksimal 100 karakter' }

  try {
    const { plaintext, hash, prefix } = generateApiKey()
    await prisma.apiKey.create({
      data: { nama: trimmed, keyHash: hash, prefix },
    })
    revalidatePath('/dashboard/api-keys')
    return { success: true, plaintext }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function toggleApiKey(id: number, aktif: boolean) {
  try {
    await prisma.apiKey.update({
      where: { id },
      data: { aktif },
    })
    revalidatePath('/dashboard/api-keys')
    return { success: true }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function deleteApiKey(id: number) {
  try {
    await prisma.apiKey.delete({ where: { id } })
    revalidatePath('/dashboard/api-keys')
    return { success: true }
  } catch (e) {
    return { error: (e as Error).message }
  }
}