import { unstable_cache } from 'next/cache'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DEFAULT_PERMISSIONS } from '@/lib/rbac-resources'

export type Role = 'ADMIN' | 'MANAGER' | 'SALES'

/**
 * Cache permission per role (5 menit, invalidate via tag 'permissions')
 */
export const getPermissionsForRole = unstable_cache(
  async (role: Role): Promise<string[]> => {
    const rows = await prisma.rolePermission.findMany({
      where: { role },
      select: { resource: true },
    })

    // Kalau belum ada di DB, fallback ke default
    if (rows.length === 0) {
      return DEFAULT_PERMISSIONS[role] ?? []
    }

    return rows.map((r) => r.resource)
  },
  ['role-permissions'],
  { revalidate: 300, tags: ['permissions'] }
)

export async function hasPermission(role: Role, resource: string): Promise<boolean> {
  const perms = await getPermissionsForRole(role)
  return perms.includes(resource)
}

/**
 * Cek akses halaman berdasarkan path.
 * Match paling spesifik dulu (longest prefix).
 */
export async function canAccessPage(role: Role, path: string): Promise<boolean> {
  const perms = await getPermissionsForRole(role)
  const pagePerms = perms
    .filter((p) => p.startsWith('page:'))
    .map((p) => p.slice(5)) // hapus "page:"
    .sort((a, b) => b.length - a.length)

  for (const p of pagePerms) {
    if (path === p || path.startsWith(p + '/')) return true
  }
  return false
}

export async function canPerformAction(role: Role, action: string): Promise<boolean> {
  const perms = await getPermissionsForRole(role)
  return perms.includes(`action:${action}`)
}

/**
 * Get current user + role.
 */
export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
  })
  if (!dbUser || dbUser.status !== 'APPROVED') return null

  return {
    id: dbUser.id,
    email: dbUser.email,
    nama: dbUser.nama,
    role: dbUser.role as Role,
    idCabang: dbUser.idCabang,
    supabaseId: user.id,
  }
}

/**
 * Require akses halaman. Redirect ke /dashboard kalau tidak punya akses.
 */
export async function requirePageAccess(path: string) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const allowed = await canAccessPage(user.role, path)
  if (!allowed) redirect('/dashboard')

  return user
}

/**
 * Require aksi. Throw error kalau tidak punya akses.
 */
export async function requireAction(action: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const allowed = await canPerformAction(user.role, action)
  if (!allowed) {
    throw new Error('Forbidden: Anda tidak punya akses untuk aksi ini')
  }
  return user
}

/**
 * Require role tertentu (untuk backward-compat).
 */
export async function requireRole(allowedRoles: Role[]) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!allowedRoles.includes(user.role)) redirect('/dashboard')
  return user
}