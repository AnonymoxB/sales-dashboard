'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area,
  RadialBarChart, RadialBar, ComposedChart,
} from 'recharts'
import { formatCompact, formatRupiah, formatNumber } from '@/lib/format'

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#ef4444', '#6366f1']

type ChartProps = {
  data: { nama: string; omzet?: number; qty?: number; unit?: number; target?: number; persentase?: number }[]
  dataKey: string
  labelKey: string
  color?: string
}

function toNumber(v: unknown): number {
  if (typeof v === 'number') return v
  if (typeof v === 'string') {
    const n = Number(v)
    return isNaN(n) ? 0 : n
  }
  if (Array.isArray(v) && v.length > 0) return toNumber(v[0])
  return 0
}

function EmptyChart({ height = 240 }: { height?: number }) {
  return (
    <div
      className="flex items-center justify-center text-sm text-muted-foreground"
      style={{ height }}
    >
      Belum ada data
    </div>
  )
}

// ============================================
// HORIZONTAL BAR
// ============================================
export function HorizontalBarChart({ data, dataKey, labelKey, color = '#3b82f6' }: ChartProps) {
  if (data.length === 0) return <EmptyChart />
  return (
    <ResponsiveContainer width="100%" height={Math.max(240, data.length * 32)}>
      <BarChart data={data.slice(0, 10)} layout="vertical" margin={{ left: 20, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" tickFormatter={(v) => formatCompact(toNumber(v))} fontSize={11} />
        <YAxis type="category" dataKey={labelKey} width={140} fontSize={11} />
        <Tooltip
          formatter={(v) => formatRupiah(toNumber(v))}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
        <Bar dataKey={dataKey} fill={color} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ============================================
// VERTICAL BAR
// ============================================
export function VerticalBarChart({ data, dataKey, labelKey, color = '#8b5cf6' }: ChartProps) {
  if (data.length === 0) return <EmptyChart />
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data.slice(0, 12)} margin={{ left: 10, right: 10 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey={labelKey} fontSize={11} angle={-30} textAnchor="end" height={70} />
        <YAxis tickFormatter={(v) => formatCompact(toNumber(v))} fontSize={11} />
        <Tooltip
          formatter={(v) => formatRupiah(toNumber(v))}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
        <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ============================================
// DONUT
// ============================================
export function DonutChart({ data, dataKey, labelKey }: ChartProps) {
  if (data.length === 0) return <EmptyChart />
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data.slice(0, 8)}
          dataKey={dataKey}
          nameKey={labelKey}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
        >
          {data.slice(0, 8).map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v) => formatCompact(toNumber(v))}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}

// ============================================
// MONTHLY LINE
// ============================================
export function MonthlyLineChart({ data }: { data: { bulan: string; omzet: number }[] }) {
  if (data.length === 0) return <EmptyChart />
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="bulan" fontSize={11} />
        <YAxis tickFormatter={(v) => formatCompact(toNumber(v))} fontSize={11} />
        <Tooltip
          formatter={(v) => formatRupiah(toNumber(v))}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
        <Line type="monotone" dataKey="omzet" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

// ============================================
// TARGET VS ACTUAL  ← INI YANG HILANG
// ============================================
export function TargetVsActualChart({
  omzet,
  target,
}: {
  omzet: number
  target: number
}) {
  const data = [
    { nama: 'Target', value: target },
    { nama: 'Actual', value: omzet },
  ]
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="nama" fontSize={12} />
        <YAxis tickFormatter={(v) => formatCompact(toNumber(v))} fontSize={11} />
        <Tooltip
          formatter={(v) => formatRupiah(toNumber(v))}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          <Cell fill="#8b5cf6" />
          <Cell fill="#3b82f6" />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ============================================
// GAUGE
// ============================================
export function GaugeChart({
  value,
  target,
  label = 'Pencapaian',
}: {
  value: number
  target: number
  label?: string
}) {
  const persen = target > 0 ? Math.min((value / target) * 100, 150) : 0
  const data = [
    {
      name: label,
      value: Math.min(persen, 100),
      fill: persen >= 100 ? '#10b981' : persen >= 75 ? '#f59e0b' : '#ef4444',
    },
  ]

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={220}>
        <RadialBarChart
          data={data}
          startAngle={180}
          endAngle={0}
          innerRadius="60%"
          outerRadius="100%"
          barSize={20}
        >
          <RadialBar background dataKey="value" cornerRadius={10} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
        <span className="text-3xl font-bold">{persen.toFixed(1)}%</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    </div>
  )
}

// ============================================
// AREA TREND
// ============================================
export function AreaTrendChart({
  data,
}: {
  data: { bulan: string; omzet: number }[]
}) {
  if (data.length === 0) return <EmptyChart />
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorOmzet" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="bulan" fontSize={11} />
        <YAxis tickFormatter={(v) => formatCompact(toNumber(v))} fontSize={11} />
        <Tooltip
          formatter={(v) => formatRupiah(toNumber(v))}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
        <Area
          type="monotone"
          dataKey="omzet"
          stroke="#3b82f6"
          strokeWidth={2}
          fill="url(#colorOmzet)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ============================================
// COMBO OMZET + TARGET
// ============================================
export function ComboOmzetTargetChart({
  data,
}: {
  data: { bulan: string; omzet: number; target: number }[]
}) {
  if (data.length === 0) return <EmptyChart />
  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="bulan" fontSize={11} />
        <YAxis tickFormatter={(v) => formatCompact(toNumber(v))} fontSize={11} />
        <Tooltip
          formatter={(v) => formatRupiah(toNumber(v))}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="omzet" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Omzet" />
        <Line
          type="monotone"
          dataKey="target"
          stroke="#ef4444"
          strokeWidth={2}
          dot={{ r: 3 }}
          name="Target"
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

// ============================================
// TOP N TABLE
// ============================================
export function TopNTable({
  data,
  dataKey,
  labelKey,
  format = 'rupiah',
  limit = 10,
}: {
  data: { [key: string]: unknown }[]
  dataKey: string
  labelKey: string
  format?: 'rupiah' | 'number'
  limit?: number
}) {
  if (data.length === 0) return <EmptyChart />
  const max = Math.max(...data.map((d) => toNumber(d[dataKey])))

  return (
    <div className="space-y-1">
      {data.slice(0, limit).map((d, i) => {
        const value = toNumber(d[dataKey])
        const pct = max > 0 ? (value / max) * 100 : 0
        return (
          <div key={i} className="relative overflow-hidden rounded-md">
            <div
              className="absolute inset-y-0 left-0 bg-primary/10 transition-all"
              style={{ width: `${pct}%` }}
            />
            <div className="relative flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-5 text-xs font-mono text-muted-foreground shrink-0">
                  {i + 1}
                </span>
                <span className="text-sm font-medium truncate">
                  {String(d[labelKey])}
                </span>
              </div>
              <span className="text-sm font-semibold shrink-0 ml-2">
                {format === 'rupiah'
                  ? formatRupiah(value)
                  : formatNumber(value)}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ============================================
// TARGET VS ACTUAL LINE (2 series: realisasi & target)
// ============================================
export function TargetVsActualLineChart({
  data,
}: {
  data: { bulan: string; realisasi: number; target: number }[]
}) {
  if (data.length === 0) return <EmptyChart />
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="bulan" fontSize={11} />
        <YAxis tickFormatter={(v) => formatCompact(toNumber(v))} fontSize={11} />
        <Tooltip
          formatter={(v) => formatRupiah(toNumber(v))}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line
          type="monotone"
          dataKey="realisasi"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ r: 3 }}
          name="Realisasi"
        />
        <Line
          type="monotone"
          dataKey="target"
          stroke="#94a3b8"
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={{ r: 3 }}
          name="Target"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

// ============================================
// MULTI LINE (Trend 2 tahun: y2025 vs y2026)
// ============================================
export function MultiLineChart({
  data,
  seriesKeys,
  seriesLabels,
}: {
  data: Record<string, unknown>[]
  seriesKeys: string[]
  seriesLabels: string[]
}) {
  if (data.length === 0) return <EmptyChart />
  const colors = ['#94a3b8', '#3b82f6']
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="bulan" fontSize={11} />
        <YAxis tickFormatter={(v) => formatCompact(toNumber(v))} fontSize={11} />
        <Tooltip
          formatter={(v) => formatRupiah(toNumber(v))}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {seriesKeys.map((key, i) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={colors[i % colors.length]}
            strokeWidth={2}
            dot={{ r: 3 }}
            name={seriesLabels[i] ?? key}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

// ============================================
// GROUPED BAR (Top 10 Unit 2 tahun)
// ============================================
export function GroupedBarChart({
  data,
  labelKey,
  seriesKeys,
  seriesLabels,
  horizontal = false,
}: {
  data: Record<string, unknown>[]
  labelKey: string
  seriesKeys: string[]
  seriesLabels: string[]
  horizontal?: boolean
}) {
  if (data.length === 0) return <EmptyChart />
  const colors = ['#94a3b8', '#3b82f6']
  return (
    <ResponsiveContainer width="100%" height={Math.max(280, data.length * 32)}>
      <BarChart
        data={data}
        layout={horizontal ? 'vertical' : 'horizontal'}
        margin={{ left: horizontal ? 20 : 10, right: 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={!horizontal} horizontal={horizontal} />
        {horizontal ? (
          <>
            <XAxis type="number" tickFormatter={(v) => formatCompact(toNumber(v))} fontSize={11} />
            <YAxis type="category" dataKey={labelKey} width={140} fontSize={11} />
          </>
        ) : (
          <>
            <XAxis dataKey={labelKey} fontSize={11} angle={-30} textAnchor="end" height={70} />
            <YAxis tickFormatter={(v) => formatCompact(toNumber(v))} fontSize={11} />
          </>
        )}
        <Tooltip
          formatter={(v) => formatNumber(toNumber(v))}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {seriesKeys.map((key, i) => (
          <Bar
            key={key}
            dataKey={key}
            fill={colors[i % colors.length]}
            radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
            name={seriesLabels[i] ?? key}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

// ============================================
// TOP ITEM TABLE (Top 10 Hutang by Item)
// ============================================
export function TopItemTable({
  data,
}: {
  data: { nama: string; kode?: string; value: number; unit?: number }[]
}) {
  if (data.length === 0) return <EmptyChart />
  const max = Math.max(...data.map((d) => d.value))
  return (
    <div className="space-y-1">
      {data.slice(0, 10).map((d, i) => {
        const pct = max > 0 ? (d.value / max) * 100 : 0
        return (
          <div key={i} className="relative overflow-hidden rounded-md">
            <div
              className="absolute inset-y-0 left-0 bg-primary/10 transition-all"
              style={{ width: `${pct}%` }}
            />
            <div className="relative flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-mono text-muted-foreground shrink-0 w-6">
                  {i + 1}.
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{d.nama}</p>
                  {d.kode && (
                    <p className="text-xs text-muted-foreground font-mono">{d.kode}</p>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0 ml-2">
                <p className="text-sm font-semibold">{formatRupiah(d.value)}</p>
                {d.unit !== undefined && (
                  <p className="text-xs text-muted-foreground">
                    {formatNumber(d.unit)} pcs
                  </p>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}