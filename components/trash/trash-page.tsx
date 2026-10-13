'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrashTable } from './trash-table'
import { TrashModel } from '@/lib/actions/trash'

type SerializedItem = Record<string, unknown> & {
  id: number
  deletedAt: string
  source: string
}

type Props = {
  data: Record<TrashModel, SerializedItem[]>
}

const MODELS: { key: TrashModel; label: string; columns: { key: string; label: string; format?: 'date' | 'rupiah' | 'number' }[] }[] = [
  {
    key: 'cabang',
    label: 'Cabang',
    columns: [
      { key: 'kode', label: 'Kode' },
      { key: 'nama', label: 'Nama' },
    ],
  },
  {
    key: 'customer',
    label: 'Customer',
    columns: [
      { key: 'kode', label: 'Kode' },
      { key: 'nama', label: 'Nama' },
    ],
  },
  {
    key: 'sales',
    label: 'Sales',
    columns: [
      { key: 'kode', label: 'Kode' },
      { key: 'nama', label: 'Nama' },
      { key: 'cabang', label: 'Cabang' },
    ],
  },
  {
    key: 'merk',
    label: 'Merk',
    columns: [
      { key: 'kode', label: 'Kode' },
      { key: 'nama', label: 'Nama' },
    ],
  },
  {
    key: 'jenis',
    label: 'Jenis',
    columns: [
      { key: 'kode', label: 'Kode' },
      { key: 'nama', label: 'Nama' },
    ],
  },
  {
    key: 'bahan',
    label: 'Bahan',
    columns: [
      { key: 'kode', label: 'Kode' },
      { key: 'nama', label: 'Nama' },
      { key: 'merk', label: 'Merk' },
      { key: 'jenis', label: 'Jenis' },
    ],
  },
  {
    key: 'part',
    label: 'Part',
    columns: [
      { key: 'kode', label: 'Kode' },
      { key: 'nama', label: 'Nama' },
      { key: 'bahan', label: 'Bahan' },
    ],
  },
  {
    key: 'penjualan',
    label: 'Penjualan',
    columns: [
      { key: 'tanggal', label: 'Tanggal' },
      { key: 'sales', label: 'Sales' },
      { key: 'part', label: 'Part' },
      { key: 'qty', label: 'Qty', format: 'number' },
      { key: 'omzet', label: 'Omzet', format: 'rupiah' },
    ],
  },
  {
    key: 'target',
    label: 'Target',
    columns: [
      { key: 'periode', label: 'Periode' },
      { key: 'sales', label: 'Sales' },
      { key: 'targetOmzet', label: 'Target', format: 'rupiah' },
    ],
  },
  {
    key: 'faktur',
    label: 'Faktur',
    columns: [
      { key: 'nomorFaktur', label: 'No. Faktur' },
      { key: 'sales', label: 'Sales' },
      { key: 'totalTagihan', label: 'Tagihan', format: 'rupiah' },
    ],
  },
  {
    key: 'hutang',
    label: 'Hutang',
    columns: [
      { key: 'nomorFaktur', label: 'No. Faktur' },
      { key: 'sales', label: 'Sales' },
      { key: 'sisaHutang', label: 'Sisa', format: 'rupiah' },
    ],
  },
]

export function TrashPage({ data }: Props) {
  const [tab, setTab] = useState<TrashModel>('cabang')

  const totalDeleted = MODELS.reduce((sum, m) => sum + data[m.key].length, 0)

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as TrashModel)} className="space-y-4">
      <TabsList className="flex-wrap h-auto">
        {MODELS.map((m) => {
          const count = data[m.key].length
          return (
            <TabsTrigger key={m.key} value={m.key} className="gap-2">
              {m.label}
              {count > 0 && (
                <span className="rounded-full bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 min-w-[18px] text-center">
                  {count}
                </span>
              )}
            </TabsTrigger>
          )
        })}
      </TabsList>

      {totalDeleted === 0 && (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">
            Trash kosong. Tidak ada data yang dihapus.
          </p>
        </div>
      )}

      {totalDeleted > 0 && MODELS.map((m) => (
        <TabsContent key={m.key} value={m.key}>
          <TrashTable
            model={m.key}
            label={m.label}
            columns={m.columns}
            data={data[m.key]}
          />
        </TabsContent>
      ))}
    </Tabs>
  )
}