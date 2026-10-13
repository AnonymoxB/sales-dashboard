'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import { formatCompact, formatRupiah } from '@/lib/format'

function toNumber(v: unknown): number {
  if (typeof v === 'number') return v
  if (typeof v === 'string') {
    const n = Number(v)
    return isNaN(n) ? 0 : n
  }
  return 0
}

export function HutangUnitValueChart({
  data,
}: {
  data: { nama: string; total: number; sisa: number }[]
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
        Belum ada data
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data.slice(0, 8)} margin={{ left: 10, right: 10, top: 20 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="nama"
          fontSize={10}
          angle={-15}
          textAnchor="end"
          height={60}
          interval={0}
        />
        <YAxis tickFormatter={(v) => formatCompact(toNumber(v))} fontSize={10} />
        <Tooltip
          formatter={(v) => formatRupiah(toNumber(v))}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="total" fill="#3b82f6" name="Total Rp" radius={[4, 4, 0, 0]} />
        <Bar dataKey="sisa" fill="#06b6d4" name="Rp" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}