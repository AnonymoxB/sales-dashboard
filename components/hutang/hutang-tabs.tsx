'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FakturTab } from './faktur-tab'
import { PiutangTab } from './piutang-tab'

type Faktur = {
  id: string
  nomorFaktur: string
  tanggal: string
  jatuhTempo: string
  totalTagihan: number
  status: string
  sales: { nama: string }
  cabang: { nama: string }
  hutang: {
    id: number
    totalBayar: number
    sisaHutang: number
    statusLunas: boolean
  } | null
}

type Piutang = {
  id: number
  nomorFaktur: string
  jatuhTempo: string
  totalHutang: number
  totalBayar: number
  sisaHutang: number
  statusLunas: boolean
  sales: { nama: string }
  cabang: { nama: string }
}

export function HutangTabs({
  fakturList,
  piutangList,
  canDelete,
  canBayar,
}: {
  fakturList: Faktur[]
  piutangList: Piutang[]
  canDelete: boolean
  canBayar: boolean
}) {
  const [tab, setTab] = useState('faktur')

  const belumLunasCount = piutangList.filter((p) => !p.statusLunas).length

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v ?? 'faktur')} className="space-y-6">
      <TabsList>
        <TabsTrigger value="faktur">Faktur</TabsTrigger>
        <TabsTrigger value="piutang">
          Piutang
          {belumLunasCount > 0 && (
            <span className="ml-2 rounded-full bg-orange-500 text-white text-[10px] px-1.5 py-0.5">
              {belumLunasCount}
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="faktur">
        <FakturTab data={fakturList} canDelete={canDelete} />
      </TabsContent>
      <TabsContent value="piutang">
        <PiutangTab data={piutangList} canBayar={canBayar} />
      </TabsContent>
    </Tabs>
  )
}