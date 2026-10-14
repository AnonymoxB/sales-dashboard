'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, BookOpen, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ApiKeyTable } from './api-key-table'
import { CreateApiKeyDialog } from './create-api-key-dialog'

type ApiKeyItem = {
  id: number
  nama: string
  prefix: string
  aktif: boolean
  lastUsedAt: string | null
  createdAt: string
}

export function ApiKeysPage({ initialData }: { initialData: ApiKeyItem[] }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-6">
      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-600" />
              <CardTitle className="text-base">Endpoint Integrasi</CardTitle>
            </div>
            <Link href="/dashboard/api-keys/docs">
              <Button size="sm" variant="outline" className="bg-background">
                Buka Dokumentasi
                <ExternalLink className="ml-2 h-3 w-3" />
              </Button>
            </Link>
          </div>
          <CardDescription className="text-blue-900/80 dark:text-blue-200/80">
            Gunakan API key di bawah untuk autentikasi dari sistem eksternal (ERP, mobile app, dll)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Customer Sync
            </span>
            <code className="rounded bg-background/60 px-2 py-1.5 font-mono text-xs break-all">
              POST /api/v1/customers
            </code>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Header
            </span>
            <code className="rounded bg-background/60 px-2 py-1.5 font-mono text-xs break-all">
              X-API-Key: sk_live_xxxxxxxxxxxxxxxxxxxxx
            </code>
          </div>
        </CardContent>
      </Card>

      {/* List API Keys */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Daftar API Key</h2>
            <p className="text-sm text-muted-foreground">
              {initialData.length} key terdaftar
            </p>
          </div>
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Buat API Key
          </Button>
        </div>

        <ApiKeyTable data={initialData} />
      </div>

      <CreateApiKeyDialog open={open} onOpenChange={setOpen} />
    </div>
  )
}