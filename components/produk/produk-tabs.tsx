'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MerkTab } from './merk-tab'
import { JenisTab } from './jenis-tab'
import { BahanTab } from './bahan-tab'
import { PartTab } from './part-tab'

type Merk = { id: number; kode: string; nama: string; _count?: { bahan: number } }
type Jenis = { id: number; kode: string; nama: string; _count?: { bahan: number } }
type Bahan = {
  id: number
  kode: string
  nama: string
  idMerk: number
  idJenis: number
  merk: { id: number; kode: string; nama: string }
  jenis: { id: number; kode: string; nama: string }
  _count?: { part: number }
}
type Part = {
  id: number
  kode: string
  nama: string
  idBahan: number
  satuan: string
  hargaJual: number
  aktif: boolean
  bahan: { id: number; nama: string; merk: { nama: string } }
}

export function ProdukTabs({
  merkList,
  jenisList,
  bahanList,
  partList,
  listBahan,
  listMerk,
  listJenis,
}: {
  merkList: Merk[]
  jenisList: Jenis[]
  bahanList: Bahan[]
  partList: Part[]
  listBahan: { id: number; kode: string; nama: string; merk: { nama: string } }[]
  listMerk: Merk[]
  listJenis: Jenis[]
}) {
  const [tab, setTab] = useState('merk')

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v ?? 'merk')} className="space-y-6">
      <TabsList>
        <TabsTrigger value="merk">Merk</TabsTrigger>
        <TabsTrigger value="jenis">Jenis</TabsTrigger>
        <TabsTrigger value="bahan">Bahan</TabsTrigger>
        <TabsTrigger value="part">Part</TabsTrigger>
      </TabsList>

      <TabsContent value="merk"><MerkTab data={merkList} /></TabsContent>
      <TabsContent value="jenis"><JenisTab data={jenisList} /></TabsContent>
      <TabsContent value="bahan">
        <BahanTab data={bahanList} listMerk={listMerk} listJenis={listJenis} />
      </TabsContent>
      <TabsContent value="part">
        <PartTab data={partList} listBahan={listBahan} />
      </TabsContent>
    </Tabs>
  )
}