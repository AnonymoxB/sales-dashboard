import Link from 'next/link'
import { Clock, XCircle, AlertCircle, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'

export const instant = false

type SearchParams = Promise<{ reason?: string }>

export default async function PendingPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const reason = params.reason ?? 'pending'

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
  })

  // Kalau sudah approved, redirect ke dashboard
  if (dbUser?.status === 'APPROVED') {
    redirect('/dashboard')
  }

  const content = {
    pending: {
      icon: Clock,
      iconColor: 'text-amber-500',
      title: 'Menunggu Persetujuan',
      description:
        'Akun Anda sedang menunggu persetujuan admin. Anda akan bisa mengakses dashboard setelah disetujui.',
    },
    rejected: {
      icon: XCircle,
      iconColor: 'text-red-500',
      title: 'Akun Ditolak',
      description: dbUser?.rejectReason
        ? `Akun Anda ditolak dengan alasan: ${dbUser.rejectReason}`
        : 'Akun Anda ditolak oleh admin. Silakan hubungi admin untuk informasi lebih lanjut.',
    },
    'not-synced': {
      icon: AlertCircle,
      iconColor: 'text-orange-500',
      title: 'Akun Belum Tersinkronisasi',
      description:
        'Akun Anda belum tersinkronisasi dengan sistem. Silakan logout dan login ulang, atau hubungi admin.',
    },
  }[reason] ?? {
    icon: Clock,
    iconColor: 'text-amber-500',
    title: 'Menunggu Persetujuan',
    description: 'Akun Anda sedang menunggu persetujuan admin.',
  }

  const Icon = content.icon

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Icon className={`h-7 w-7 ${content.iconColor}`} />
          </div>
          <CardTitle className="text-xl">{content.title}</CardTitle>
          <CardDescription className="text-sm">{content.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-md border bg-muted/30 p-3 text-xs space-y-1">
            <p className="text-muted-foreground">Email terdaftar:</p>
            <p className="font-medium font-mono break-all">{user.email}</p>
          </div>

          <form action="/auth/logout" method="post">
            <Button type="submit" variant="outline" className="w-full">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}