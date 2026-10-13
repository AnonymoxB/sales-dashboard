import { connection } from 'next/server'
import { TargetEditor } from '@/components/target/target-editor'
import { PeriodeSelector } from '@/components/target/periode-selector'
import prisma from '@/lib/prisma'

export const instant = false

type SearchParams = Promise<{ periode?: string }>

export default async function TargetPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  await connection()

  const params = await searchParams
  const now = new Date()
  const defaultPeriode = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const periodeParam = params.periode ?? defaultPeriode
  const periode = new Date(periodeParam)

  const startOfMonth = new Date(periode.getFullYear(), periode.getMonth(), 1)
  const endOfMonth = new Date(periode.getFullYear(), periode.getMonth() + 1, 0)

  const [listSales, existingTargets, penjualanBulan] = await Promise.all([
    prisma.sales.findMany({
      where: { aktif: true, deletedAt: null },
      orderBy: [{ idCabang: 'asc' }, { nama: 'asc' }],
      include: { cabang: { select: { id: true, nama: true } } },
    }),
    prisma.target.findMany({
      where: {
        deletedAt: null,
        periode: { gte: startOfMonth, lte: endOfMonth },
      },
      select: { idSales: true, targetOmzet: true },
    }),
    prisma.penjualan.groupBy({
      by: ['idSales'],
      _sum: { totalOmzet: true, qty: true },
      where: {
        deletedAt: null,
        tanggal: { gte: startOfMonth, lte: endOfMonth },
      },
    }),
  ])

  const existing = existingTargets.map((t) => ({
    idSales: t.idSales,
    targetOmzet: Number(t.targetOmzet),
  }))

  const omzetPerSales = penjualanBulan.map((p) => ({
    idSales: p.idSales,
    omzet: Number(p._sum.totalOmzet ?? 0),
    qty: Number(p._sum.qty ?? 0),
  }))

  const periodeLabel = periode.toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  })

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    return {
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`,
      label: d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Target Penjualan</h1>
          <p className="text-sm text-muted-foreground">
            Set target omzet per sales untuk periode {periodeLabel}
          </p>
        </div>
        <PeriodeSelector value={periodeParam} options={monthOptions} />
      </div>

      <TargetEditor
        listSales={listSales}
        existing={existing}
        periode={periodeParam}
        omzetPerSales={omzetPerSales}
      />
    </div>
  )
}