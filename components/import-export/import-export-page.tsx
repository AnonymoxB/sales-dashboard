'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EntityCard } from '../../app/dashboard/import-export/entity-card'
import { ENTITIES, ENTITY_GROUPS, type EntityKey } from '@/lib/import-export/config'
import { Info } from 'lucide-react'

const GROUP_ENTITIES: Record<string, EntityKey[]> = {
  'Master Data': ['cabang', 'sales', 'customer'],
  'Produk': ['merk', 'jenis', 'bahan', 'part'],
  'Transaksi': ['penjualan', 'target', 'faktur'],
}

export function ImportExportPage() {
  return (
    <div className="space-y-4">
      {/* Info box */}
      <div className="rounded-lg border bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900 p-3">
        <div className="flex gap-2">
          <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-900 dark:text-blue-200 space-y-1">
            <p className="font-medium">Cara pakai:</p>
            <ol className="list-decimal list-inside space-y-0.5">
              <li>Klik <strong>Template</strong> untuk download file Excel kosong dengan petunjuk</li>
              <li>Isi data di sheet <strong>&ldquo;Data&rdquo;</strong> mulai baris ke-4 (abaikan baris contoh)</li>
              <li>Hapus baris contoh, lalu upload kembali</li>
              <li>Kolom wajib ditandai <BadgeRequired /> — kolom lain opsional</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Tabs per group */}
      <Tabs defaultValue={ENTITY_GROUPS[0]} className="space-y-4">
        <TabsList>
          {ENTITY_GROUPS.map((g) => (
            <TabsTrigger key={g} value={g}>
              {g}
              <span className="ml-2 rounded-full bg-muted text-muted-foreground text-[10px] px-1.5">
                {GROUP_ENTITIES[g].length}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {ENTITY_GROUPS.map((g) => (
          <TabsContent key={g} value={g}>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {GROUP_ENTITIES[g].map((key) => (
                <EntityCard key={key} config={ENTITIES[key]} />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

function BadgeRequired() {
  return (
    <span className="inline-flex items-center rounded bg-primary text-primary-foreground text-[10px] px-1.5 font-medium">
      wajib
    </span>
  )
}