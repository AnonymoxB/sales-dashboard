import { connection } from 'next/server'
import { ProdukTabs } from '@/components/produk/produk-tabs'
import prisma from '@/lib/prisma'

export const instant = false

export default async function ProdukPage() {
  await connection()

  const [merkList, jenisList, bahanList, partList] = await Promise.all([
    prisma.merk.findMany({
      orderBy: { kode: 'asc' },
      include: { _count: { select: { bahan: true } } },
    }),
    prisma.jenis.findMany({
      orderBy: { kode: 'asc' },
      include: { _count: { select: { bahan: true } } },
    }),
    prisma.bahan.findMany({
      orderBy: { kode: 'asc' },
      include: {
        merk: { select: { id: true, kode: true, nama: true } },
        jenis: { select: { id: true, kode: true, nama: true } },
        _count: { select: { part: true } },
      },
    }),
    prisma.part.findMany({
      orderBy: { kode: 'asc' },
      include: {
        bahan: {
          select: { id: true, nama: true, merk: { select: { nama: true } } },
        },
      },
    }),
  ])

  // Normalisasi: Decimal → number untuk partList
  const partListNormalized = partList.map((p) => ({
    id: p.id,
    kode: p.kode,
    nama: p.nama,
    idBahan: p.idBahan,
    satuan: p.satuan,
    hargaJual: Number(p.hargaJual),
    aktif: p.aktif,
    bahan: p.bahan,
  }))

  const listBahan = bahanList.map((b) => ({
    id: b.id,
    kode: b.kode,
    nama: b.nama,
    merk: { nama: b.merk.nama },
  }))

  const listMerk = merkList.map((m) => ({ id: m.id, kode: m.kode, nama: m.nama }))
  const listJenis = jenisList.map((j) => ({ id: j.id, kode: j.kode, nama: j.nama }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Produk</h1>
        <p className="text-sm text-muted-foreground">
          Kelola merk, jenis, bahan, dan part produk
        </p>
      </div>

      <ProdukTabs
        merkList={merkList}
        jenisList={jenisList}
        bahanList={bahanList}
        partList={partListNormalized}
        listBahan={listBahan}
        listMerk={listMerk}
        listJenis={listJenis}
      />
    </div>
  )
}