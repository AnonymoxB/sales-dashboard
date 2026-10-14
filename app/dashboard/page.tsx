import { connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getDashboard1Data, type Dashboard2Filters } from '@/lib/dashboard-queries'
import { KpiCard } from '@/components/dashboard/kpi-card'
import { FilterBar } from '@/components/dashboard/filter-bar'
import { RefreshButton } from '@/components/dashboard/refresh-button'
import { HorizontalBarChart } from '@/components/charts/dashboard-charts'
import { SalesBreakdownTable } from '@/components/dashboard/sales-breakdown-table'
import { HutangUnitValueChart } from '@/components/dashboard/hutang-unit-value-chart'
import { FakturStatusChart } from '@/components/dashboard/faktur-status-chart'
import { FakturBelumLunasTable } from '@/components/dashboard/faktur-belum-lunas-table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Wallet, Target, ReceiptText, TrendingUp } from 'lucide-react'
import { formatRupiah } from '@/lib/format'

export const instant = false

type SearchParams = Promise<{
  cabang?: string
  tahun?: string
  bulan?: string
  idSales?: string
  idCustomer?: string
  idBahan?: string
  idJenis?: string
  idPart?: string
}>

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  await connection()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { id: true, role: true, status: true, idCabang: true },
  })
  if (!dbUser || dbUser.status !== 'APPROVED') redirect('/login')

  const params = await searchParams

  // 🛡️ Cabang lock: ADMIN bebas, role lain terkunci ke cabang sendiri
  const isAdmin = dbUser.role === 'ADMIN'
  const lockedCabangId = !isAdmin && dbUser.idCabang ? dbUser.idCabang : null

  const filters: Dashboard2Filters = {
    tahun: params.tahun ? parseInt(params.tahun) : undefined,
    bulan: params.bulan ? parseInt(params.bulan) : undefined,
    idSales: params.idSales ? parseInt(params.idSales) : undefined,
    idCustomer: params.idCustomer ? parseInt(params.idCustomer) : undefined,
    idBahan: params.idBahan ? parseInt(params.idBahan) : undefined,
    idJenis: params.idJenis ? parseInt(params.idJenis) : undefined,
    idPart: params.idPart ? parseInt(params.idPart) : undefined,
    idCabang: lockedCabangId ?? (params.cabang ? parseInt(params.cabang) : undefined),
  }

  const [data, listCabang] = await Promise.all([
    getDashboard1Data(filters),
    isAdmin
      ? prisma.cabang.findMany({
          where: { deletedAt: null },
          orderBy: { nama: 'asc' },
          select: { id: true, kode: true, nama: true },
        })
      : dbUser.idCabang
        ? prisma.cabang.findMany({
            where: { id: dbUser.idCabang },
            select: { id: true, kode: true, nama: true },
          })
        : Promise.resolve([]),
  ])

  const pencapaian = data.target > 0 ? (data.omzet / data.target) * 100 : 0
  const currentYear = data.tahun
  const cabangNama = listCabang[0]?.nama

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Monitoring Penjualan</h1>
          <p className="text-sm text-muted-foreground">
            Ringkasan tahun {currentYear}
            {cabangNama && lockedCabangId && (
              <> · Cabang: <strong>{cabangNama}</strong></>
            )}
            {' · '}Update{' '}
            {new Date().toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <RefreshButton />
          <Badge variant="outline">Live</Badge>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        tahun={filters.tahun ?? currentYear}
        bulan={filters.bulan}
        idSales={filters.idSales}
        idCustomer={filters.idCustomer}
        idBahan={filters.idBahan}
        idJenis={filters.idJenis}
        idPart={filters.idPart}
        idCabang={filters.idCabang}
        lockedCabangId={lockedCabangId ?? undefined}
        listSales={data.filterOptions.listSales}
        listCustomer={data.filterOptions.listCustomer}
        listBahan={data.filterOptions.listBahan}
        listJenis={data.filterOptions.listJenis}
        listPart={data.filterOptions.listPart}
        listCabang={listCabang}
      />

      {/* KPI Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Total Omzet" value={formatRupiah(data.omzet)} description="Bulan ini" icon={Wallet} color="text-blue-600" />
        <KpiCard title="Total Target" value={formatRupiah(data.target)} description="Bulan ini" icon={Target} color="text-purple-600" />
        <KpiCard title="Pencapaian" value={`${pencapaian.toFixed(2)}%`} description={pencapaian >= 100 ? 'Target tercapai 🎉' : 'Belum mencapai target'} icon={TrendingUp} color={pencapaian >= 100 ? 'text-green-600' : 'text-red-600'} />
        <KpiCard title="Hutang Barang" value={formatRupiah(data.hutang)} description={`${data.hutangCount} faktur belum lunas`} icon={ReceiptText} color="text-orange-600" />
      </div>

      {/* Row 1: Target vs Omzet | Omzet per Sales */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Target vs Omzet Penjualan</CardTitle>
            <CardDescription>Perbandingan target dan realisasi</CardDescription>
          </CardHeader>
          <CardContent>
            <HorizontalBarChart
              data={[
                { nama: 'Target', omzet: data.target },
                { nama: 'Omzet', omzet: data.omzet },
              ]}
              dataKey="omzet"
              labelKey="nama"
              color="#8b5cf6"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Omzet Penjualan by Sales</CardTitle>
            <CardDescription>Peringkat sales berdasarkan omzet</CardDescription>
          </CardHeader>
          <CardContent>
            <HorizontalBarChart data={data.pencapaianPerSales} dataKey="omzet" labelKey="nama" color="#3b82f6" />
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Breakdown by Jenis | Merk */}
      <div className="grid gap-4 lg:grid-cols-2">
        <SalesBreakdownTable title="Pencapaian Penjualan by Jenis" groupLabel="Jenis" groups={data.breakdownJenis} />
        <SalesBreakdownTable title="Pencapaian Penjualan by Merk" groupLabel="Merk" groups={data.breakdownMerk} />
      </div>

      {/* Row 3: Breakdown by Bahan | Part */}
      <div className="grid gap-4 lg:grid-cols-2">
        <SalesBreakdownTable title="Pencapaian Penjualan by Bahan" groupLabel="Bahan" groups={data.breakdownBahan} />
        <SalesBreakdownTable title="Pencapaian Penjualan by Part" groupLabel="Part" groups={data.breakdownPart} />
      </div>

      {/* Row 4: Omzet per Cabang | Hutang per Sales */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Omzet per Cabang</CardTitle>
            <CardDescription>Perbandingan omzet seluruh cabang</CardDescription>
          </CardHeader>
          <CardContent>
            <HorizontalBarChart
              data={data.pencapaianPerCabang}
              dataKey="omzet"
              labelKey="nama"
              color="#10b981"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hutang Barang by Unit & Value</CardTitle>
            <CardDescription>Total hutang vs sisa per sales</CardDescription>
          </CardHeader>
          <CardContent>
            <HutangUnitValueChart data={data.hutangUnitValue} />
          </CardContent>
        </Card>
      </div>

      {/* Row 5: Faktur Status Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Faktur Belum Lunas by Status Jatuh Tempo</CardTitle>
          <CardDescription>Sisa hutang belum JT vs sudah JT per sales</CardDescription>
        </CardHeader>
        <CardContent>
          <FakturStatusChart data={data.fakturStatus} />
        </CardContent>
      </Card>

      {/* Row 6: Tabel Faktur Belum Lunas */}
      <Card>
        <CardHeader>
          <CardTitle>Faktur Belum Lunas — Detail</CardTitle>
          <CardDescription>Daftar faktur yang perlu ditindaklanjuti</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <FakturBelumLunasTable data={data.fakturBelumLunas} />
        </CardContent>
      </Card>
    </div>
  )
}