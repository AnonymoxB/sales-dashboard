import { connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ApiDocsPage } from '@/components/api-docs/api-docs-page'
import { requirePageAccess } from '@/lib/rbac'

export const instant = false

export default async function Page() {
  await requirePageAccess('/dashboard/api-keys/docs')
  await connection()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return <ApiDocsPage baseUrl="https://dashboard-sales.fuboruindonesia.com" />
}