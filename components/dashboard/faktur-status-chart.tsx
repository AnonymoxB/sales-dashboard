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

export function FakturStatusChart({
  data,
}: {
  data: { nama: string; belumJT: number; sudahJT: number }[]
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
        Belum ada data
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(280, data.length * 40)}>
      <BarChart
        data={data.slice(0, 8)}
        layout="vertical"
        margin={{ left: 20, right: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={(v) => formatCompact(toNumber(v))}
          fontSize={10}
        />
        <YAxis
          type="category"
          dataKey="nama"
          width={140}
          fontSize={10}
        />
        <Tooltip
          formatter={(v) => formatRupiah(toNumber(v))}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar
          dataKey="belumJT"
          fill="#3b82f6"
          name="Belum JT"
          stackId="a"
          radius={[0, 0, 0, 0]}
        />
        <Bar
          dataKey="sudahJT"
          fill="#06b6d4"
          name="Sudah JT"
          stackId="a"
          radius={[0, 4, 4, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}