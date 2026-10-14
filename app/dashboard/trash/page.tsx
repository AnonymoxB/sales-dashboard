import { connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { TrashPage } from '@/components/trash/trash-page'
import { requirePageAccess } from '@/lib/rbac'

export const instant = false

export default async function Page() {
    await requirePageAccess('/dashboard/trash')
  await connection()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const deletedFilter = { NOT: { deletedAt: null } }

  const [
    cabang, customer, sales, merk, jenis, bahan, part,
    penjualan, target, faktur, hutang,
  ] = await Promise.all([
    prisma.cabang.findMany({
      where: deletedFilter,
      orderBy: { deletedAt: 'desc' },
      take: 200,
    }),
    prisma.customer.findMany({
      where: deletedFilter,
      orderBy: { deletedAt: 'desc' },
      take: 200,
    }),
    prisma.sales.findMany({
      where: deletedFilter,
      orderBy: { deletedAt: 'desc' },
      take: 200,
      include: { cabang: { select: { nama: true } } },
    }),
    prisma.merk.findMany({
      where: deletedFilter,
      orderBy: { deletedAt: 'desc' },
      take: 200,
    }),
    prisma.jenis.findMany({
      where: deletedFilter,
      orderBy: { deletedAt: 'desc' },
      take: 200,
    }),
    prisma.bahan.findMany({
      where: deletedFilter,
      orderBy: { deletedAt: 'desc' },
      take: 200,
      include: { merk: { select: { nama: true } }, jenis: { select: { nama: true } } },
    }),
    prisma.part.findMany({
      where: deletedFilter,
      orderBy: { deletedAt: 'desc' },
      take: 200,
      include: { bahan: { select: { nama: true } } },
    }),
    prisma.penjualan.findMany({
      where: deletedFilter,
      orderBy: { deletedAt: 'desc' },
      take: 200,
      include: {
        sales: { select: { nama: true } },
        part: { select: { nama: true } },
      },
    }),
    prisma.target.findMany({
      where: deletedFilter,
      orderBy: { deletedAt: 'desc' },
      take: 200,
      include: { sales: { select: { nama: true } } },
    }),
    prisma.faktur.findMany({
      where: deletedFilter,
      orderBy: { deletedAt: 'desc' },
      take: 200,
      include: { sales: { select: { nama: true } } },
    }),
    prisma.hutang.findMany({
      where: deletedFilter,
      orderBy: { deletedAt: 'desc' },
      take: 200,
      include: {
        faktur: { select: { nomorFaktur: true } },
        sales: { select: { nama: true } },
      },
    }),
  ])

  // Serialize untuk client component
  const data = {
    cabang: cabang.map((x) => ({
      id: x.id,
      kode: x.kode,
      nama: x.nama,
      deletedAt: x.deletedAt!.toISOString(),
      source: x.source,
    })),
    customer: customer.map((x) => ({
      id: x.id,
      kode: x.kode,
      nama: x.nama,
      deletedAt: x.deletedAt!.toISOString(),
      source: x.source,
    })),
    sales: sales.map((x) => ({
      id: x.id,
      kode: x.kode,
      nama: x.nama,
      cabang: x.cabang.nama,
      deletedAt: x.deletedAt!.toISOString(),
      source: x.source,
    })),
    merk: merk.map((x) => ({
      id: x.id,
      kode: x.kode,
      nama: x.nama,
      deletedAt: x.deletedAt!.toISOString(),
      source: x.source,
    })),
    jenis: jenis.map((x) => ({
      id: x.id,
      kode: x.kode,
      nama: x.nama,
      deletedAt: x.deletedAt!.toISOString(),
      source: x.source,
    })),
    bahan: bahan.map((x) => ({
      id: x.id,
      kode: x.kode,
      nama: x.nama,
      merk: x.merk.nama,
      jenis: x.jenis.nama,
      deletedAt: x.deletedAt!.toISOString(),
      source: x.source,
    })),
    part: part.map((x) => ({
      id: x.id,
      kode: x.kode,
      nama: x.nama,
      bahan: x.bahan.nama,
      deletedAt: x.deletedAt!.toISOString(),
      source: x.source,
    })),
    penjualan: penjualan.map((x) => ({
      id: Number(x.id),
      tanggal: x.tanggal.toISOString().slice(0, 10),
      sales: x.sales.nama,
      part: x.part.nama,
      qty: x.qty,
      omzet: Number(x.totalOmzet),
      deletedAt: x.deletedAt!.toISOString(),
      source: x.source,
    })),
    target: target.map((x) => ({
      id: x.id,
      periode: x.periode.toISOString().slice(0, 10),
      sales: x.sales.nama,
      targetOmzet: Number(x.targetOmzet),
      deletedAt: x.deletedAt!.toISOString(),
      source: x.source,
    })),
    faktur: faktur.map((x) => ({
      id: Number(x.id),
      nomorFaktur: x.nomorFaktur,
      sales: x.sales.nama,
      totalTagihan: Number(x.totalTagihan),
      deletedAt: x.deletedAt!.toISOString(),
      source: x.source,
    })),
    hutang: hutang.map((x) => ({
      id: Number(x.id),
      nomorFaktur: x.faktur.nomorFaktur,
      sales: x.sales.nama,
      sisaHutang: Number(x.sisaHutang),
      deletedAt: x.deletedAt!.toISOString(),
      source: x.source,
    })),
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Trash / Sampah</h1>
        <p className="text-sm text-muted-foreground">
          Data yang dihapus (soft delete) bisa di-restore di sini
        </p>
      </div>

      <TrashPage data={data} />
    </div>
  )
}