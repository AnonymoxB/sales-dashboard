import { connection } from 'next/server'
import { requirePageAccess } from '@/lib/rbac'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { PermissionsPage } from '@/components/permissions/permissions-page'
import { ALL_RESOURCES } from '@/lib/rbac-resources'

export const instant = false

export default async function Page() {
  await requirePageAccess('/dashboard/settings/permissions')
  await connection()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Ambil semua permission dari DB, group by role
  const rows = await prisma.rolePermission.findMany({
    select: { role: true, resource: true },
  })

  const permissions: Record<string, string[]> = {
    ADMIN: [],
    MANAGER: [],
    SALES: [],
  }

  for (const r of rows) {
    if (!permissions[r.role]) permissions[r.role] = []
    permissions[r.role].push(r.resource)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Manage Permissions</h1>
        <p className="text-sm text-muted-foreground">
          Atur akses halaman & aksi per role
        </p>
      </div>

      <PermissionsPage initialPermissions={permissions} />
    </div>
  )
}