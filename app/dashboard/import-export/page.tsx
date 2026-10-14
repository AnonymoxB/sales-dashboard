import { connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ImportExportPage } from '@/components/import-export/import-export-page'
import { requirePageAccess } from '@/lib/rbac'

export const instant = false

export default async function Page() {
  await requirePageAccess('/dashboard/import-export')
  await connection()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Import & Export Data</h1>
        <p className="text-sm text-muted-foreground">
          Download template Excel, isi, lalu upload kembali untuk bulk import data
        </p>
      </div>
      <ImportExportPage />
    </div>
  )
}