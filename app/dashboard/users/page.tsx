import { connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { UsersPage } from '@/components/users/users-page'
import { requirePageAccess } from '@/lib/rbac'

export const instant = false

export default async function Page() {
    await requirePageAccess('/dashboard/users')
  await connection()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Cek admin
  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
  })
  if (!dbUser || dbUser.role !== 'ADMIN' || dbUser.status !== 'APPROVED') {
    redirect('/dashboard')
  }

  const [usersRaw, listCabang] = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      include: { cabang: { select: { id: true, kode: true, nama: true } } },
    }),
    prisma.cabang.findMany({
      where: { deletedAt: null },
      orderBy: { nama: 'asc' },
      select: { id: true, kode: true, nama: true },
    }),
  ])

  const users = usersRaw.map((u) => ({
    id: u.id,
    email: u.email,
    nama: u.nama,
    role: u.role,
    status: u.status,
    idCabang: u.idCabang,
    cabang: u.cabang ? { id: u.cabang.id, kode: u.cabang.kode, nama: u.cabang.nama } : null,
    approvedAt: u.approvedAt?.toISOString() ?? null,
    rejectedAt: u.rejectedAt?.toISOString() ?? null,
    rejectReason: u.rejectReason,
    createdAt: u.createdAt.toISOString(),
    isMe: u.id === dbUser.id,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Manajemen User</h1>
        <p className="text-sm text-muted-foreground">
          Approve, reject, dan kelola role user
        </p>
      </div>

      <UsersPage initialData={users} listCabang={listCabang} />
    </div>
  )
}