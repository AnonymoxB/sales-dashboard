import { connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { ApiKeysPage } from '@/components/api-keys/api-keys-page'
import { requirePageAccess } from '@/lib/rbac'

export const instant = false

export default async function Page() {
  await requirePageAccess('/dashboard/api-keys')
  await connection()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const apiKeysRaw = await prisma.apiKey.findMany({
    orderBy: { createdAt: 'desc' },
  })

  const apiKeys = apiKeysRaw.map((k) => ({
    id: k.id,
    nama: k.nama,
    prefix: k.prefix,
    aktif: k.aktif,
    lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
    createdAt: k.createdAt.toISOString(),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">API Keys</h1>
        <p className="text-sm text-muted-foreground">
          Kelola API key untuk integrasi ERP dan layanan eksternal
        </p>
      </div>

      <ApiKeysPage initialData={apiKeys} />
    </div>
  )
}