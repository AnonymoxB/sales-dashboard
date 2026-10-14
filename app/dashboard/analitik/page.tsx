import { connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getDashboard2Data, type Dashboard2Filters } from '@/lib/dashboard-queries'
import { KpiCard } from '@/components/dashboard/kpi-card'
import { FilterBar } from '@/components/dashboard/filter-bar'
import { RefreshButton } from '@/components/dashboard/refresh-button'
import {
  DonutChart,
  HorizontalBarChart,
  TargetVsActualLineChart,
  MultiLineChart,
  GroupedBarChart,
  TopItemTable,
} from '@/components/charts/dashboard-charts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Wallet, Package, CheckCircle2, Users, ReceiptText } from 'lucide-react'
import { formatRupiah, formatNumber } from '@/lib/format'
import { PivotTable } from '@/components/dashboard/pivot-table'
import { requirePageAccess } from '@/lib/rbac'

export const instant = false

type SearchParams = Promise<{
  tahun?: string
  bulan?: string
  idSales?: string
  idCustomer?: string
  idBahan?: string
  idJenis?: string
  idPart?: string
}>

export default async function AnalitikPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  await requirePageAccess('/dashboard/analitik')
  await connection()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams

  const filters: Dashboard2Filters = {
    tahun: params.tahun ? parseInt(params.tahun) : undefined,
    bulan: params.bulan ? parseInt(params.bulan) : undefined,
    idSales: params.idSales ? parseInt(params.idSales) : undefined,
    idCustomer: params.idCustomer ? parseInt(params.idCustomer) : undefined,
    idBahan: params.idBahan ? parseInt(params.idBahan) : undefined,
    idJenis: params.idJenis ? parseInt(params.idJenis) : undefined,
    idPart: params.idPart ? parseInt(params.idPart) : undefined,
  }

  const d = await getDashboard2Data(filters)
  const currentYear = d.tahun
  const prevYear = d.tahunLalu

  const trendData = d.trendOmzet2Tahun as Record<string, unknown>[]
  const trendSeries = [`y${prevYear}`, `y${currentYear}`]
  const trendLabels = [String(prevYear), String(currentYear)]

  const topUnitData = d.topUnit2Tahun as Record<string, unknown>[]
  const topUnitSeries = [`y${prevYear}`, `y${currentYear}`]

  const topOmzetPartData = d.kontribusiPart
    .map((p) => ({ nama: p.nama, value: p.omzet, unit: p.unit }))
    .sort((a, b) => b.value - a.value)

  return (
    <div className="w-full min-w-0 space-y-5">
      {/* ============================================
          HEADER
      ============================================ */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analitik Penjualan</h1>
          <p className="text-sm text-muted-foreground">
            Ringkasan tahun {currentYear} · Update {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <RefreshButton />
          <Badge variant="outline">Live</Badge>
        </div>
      </div>

      {/* ============================================
          FILTER BAR
      ============================================ */}
      <FilterBar
        tahun={filters.tahun ?? currentYear}
        bulan={filters.bulan}
        idSales={filters.idSales}
        idCustomer={filters.idCustomer}
        idBahan={filters.idBahan}
        idJenis={filters.idJenis}
        idPart={filters.idPart}
        listSales={d.filterOptions.listSales}
        listCustomer={d.filterOptions.listCustomer}
        listBahan={d.filterOptions.listBahan}
        listJenis={d.filterOptions.listJenis}
        listPart={d.filterOptions.listPart}
      />

      {/* ============================================
          KPI ROW — 5 kartu horizontal
      ============================================ */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          title="Total Omzet"
          value={formatRupiah(d.totalOmzet)}
          description={`Tahun ${currentYear}`}
          icon={Wallet}
          color="text-blue-600"
        />
        <KpiCard
          title="Total In Unit"
          value={formatNumber(d.totalUnit)}
          description="pcs terjual"
          icon={Package}
          color="text-purple-600"
        />
        <KpiCard
          title="Total Bayar"
          value={formatRupiah(d.totalBayar)}
          description="faktur lunas"
          icon={CheckCircle2}
          color="text-green-600"
        />
        <KpiCard
          title="Total Customer"
          value={formatNumber(d.totalCustomer)}
          description="customer unik"
          icon={Users}
          color="text-cyan-600"
        />
        <KpiCard
          title="Hutang Barang"
          value={formatRupiah(d.totalHutang)}
          description="sisa piutang"
          icon={ReceiptText}
          color="text-orange-600"
        />
      </div>

      {/* ============================================
          ROW 1: Target vs Actual | Donut Jenis | Donut Part
      ============================================ */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Target vs Actual</CardTitle>
            <CardDescription className="text-xs">
              Realisasi & target bulanan {currentYear}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pt-2">
            <TargetVsActualLineChart data={d.targetVsActual} />
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Kontribusi by Jenis</CardTitle>
            <CardDescription className="text-xs">Dalam unit</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pt-2">
            <DonutChart data={d.kontribusiJenis} dataKey="unit" labelKey="nama" />
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Kontribusi by Part</CardTitle>
            <CardDescription className="text-xs">Dalam unit</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pt-2">
            <DonutChart data={d.kontribusiPart} dataKey="unit" labelKey="nama" />
          </CardContent>
        </Card>
      </div>

      {/* ============================================
          ROW 2: Top Hutang Item | Omzet Sales | Trend 2 Tahun
      ============================================ */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top 10 Hutang by Item</CardTitle>
            <CardDescription className="text-xs">Dalam value</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pt-2 max-h-[340px] overflow-y-auto">
            <TopItemTable data={d.topHutangItem} />
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Omzet by Nama Sales</CardTitle>
            <CardDescription className="text-xs">Peringkat sales</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pt-2">
            <HorizontalBarChart
              data={d.omzetPerSales}
              dataKey="omzet"
              labelKey="nama"
              color="#3b82f6"
            />
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Trend Omzet by Month</CardTitle>
            <CardDescription className="text-xs">
              {prevYear} vs {currentYear}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pt-2">
            <MultiLineChart
              data={trendData}
              seriesKeys={trendSeries}
              seriesLabels={trendLabels}
            />
          </CardContent>
        </Card>
      </div>

      {/* ============================================
          ROW 3: Top Omzet Part | Top Omzet Customer | Top Unit 2 Tahun
      ============================================ */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top 10 Omzet by Part</CardTitle>
            <CardDescription className="text-xs">Part dengan omzet tertinggi</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pt-2 max-h-[340px] overflow-y-auto">
            <TopItemTable data={topOmzetPartData} />
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top 10 Omzet by Customer</CardTitle>
            <CardDescription className="text-xs">Customer dengan omzet tertinggi</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pt-2">
            <HorizontalBarChart
              data={d.topCustomer}
              dataKey="omzet"
              labelKey="nama"
              color="#10b981"
            />
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top 10 In Unit Item by Year</CardTitle>
            <CardDescription className="text-xs">
              {prevYear} vs {currentYear}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pt-2">
            <GroupedBarChart
              data={topUnitData}
              labelKey="nama"
              seriesKeys={topUnitSeries}
              seriesLabels={trendLabels}
              horizontal
            />
          </CardContent>
        </Card>
      </div>
            {/* ============================================
          ROW 4: Pivot Table Full Cross-Tab
      ============================================ */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Tabel Detail Penjualan per Sales
          </CardTitle>
          <CardDescription className="text-xs">
            Breakdown Omzet, Value, Unit, Bonus, Customer & Item per part untuk setiap sales
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <PivotTable
            data={d.pivotData}
            salesList={d.pivotSalesList}
          />
        </CardContent>
      </Card>
    </div>
  )
}