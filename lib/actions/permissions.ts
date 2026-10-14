'use server'

import { revalidatePath, updateTag } from 'next/cache'
import prisma from '@/lib/prisma'
import { requireAction } from '@/lib/rbac'
import { DEFAULT_PERMISSIONS, ALL_RESOURCES } from '@/lib/rbac-resources'

type Role = 'ADMIN' | 'MANAGER' | 'SALES'

/**
 * Replace all permissions for a role.
 */
export async function updateRolePermissions(role: Role, resources: string[]) {
  try {
    const admin = await requireAction('admin.permissions')

    // Validate resources
    const invalid = resources.filter((r) => !ALL_RESOURCES.includes(r))
    if (invalid.length > 0) {
      return { error: `Resource tidak valid: ${invalid.join(', ')}` }
    }

    // 🛡️ Proteksi: cegah admin lock diri sendiri
    if (role === admin.role) {
      if (!resources.includes('action:admin.permissions')) {
        return {
          error: 'Tidak bisa menghapus akses "Manage Permissions" dari role Anda sendiri',
        }
      }
      if (!resources.includes('page:/dashboard/settings/permissions')) {
        return {
          error: 'Tidak bisa menghapus akses halaman Permissions dari role Anda sendiri',
        }
      }
    }

    // Transaction: delete old, insert new
    await prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { role } })

      if (resources.length > 0) {
        await tx.rolePermission.createMany({
          data: resources.map((resource) => ({ role, resource })),
        })
      }
    })

    // Invalidate cache
    updateTag('permissions')
    revalidatePath('/dashboard/settings/permissions')

    return { success: true, count: resources.length }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

/**
 * Toggle single permission for a role.
 */
export async function togglePermission(
  role: Role,
  resource: string,
  enabled: boolean
) {
  try {
    const admin = await requireAction('admin.permissions')

    // 🛡️ Proteksi: cegah admin lock diri sendiri via toggle
    if (
      !enabled &&
      role === admin.role &&
      (resource === 'action:admin.permissions' ||
        resource === 'page:/dashboard/settings/permissions')
    ) {
      return {
        error: 'Tidak bisa menghapus akses Manage Permissions dari role Anda sendiri',
      }
    }

    if (enabled) {
      await prisma.rolePermission.upsert({
        where: {
          role_resource: { role, resource },
        },
        update: {},
        create: { role, resource },
      })
    } else {
      await prisma.rolePermission.deleteMany({
        where: { role, resource },
      })
    }

    updateTag('permissions')
    revalidatePath('/dashboard/settings/permissions')

    return { success: true }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

/**
 * Reset a role's permissions to defaults.
 */
export async function resetRolePermissions(role: Role) {
  try {
    await requireAction('admin.permissions')

    const defaults = DEFAULT_PERMISSIONS[role] ?? []

    await prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { role } })

      if (defaults.length > 0) {
        await tx.rolePermission.createMany({
          data: defaults.map((resource) => ({ role, resource })),
        })
      }
    })

    updateTag('permissions')
    revalidatePath('/dashboard/settings/permissions')

    return { success: true, count: defaults.length }
  } catch (e) {
    return { error: (e as Error).message }
  }
}