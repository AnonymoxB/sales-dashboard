'use client'

import { useState, useMemo } from 'react'
import { Search, ArrowUpDown, Download } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { formatCompact, formatNumber } from '@/lib/format'

type PivotSalesCell = {
  omzet: number
  value: number
  unit: number
  bonus: number
  cust: number
  item: number
}

type PivotRow = {
  idPart: number
  kodePart: string
  namaPart: string
  perSales: Record<number, PivotSalesCell>
  total: PivotSalesCell
}

type PivotSalesInfo = { id: number; nama: string }

const METRICS = [
  { key: 'omzet' as const, label: 'OMZET', format: 'compact' as const },
  { key: 'value' as const, label: 'VALUE', format: 'compact' as const },
  { key: 'unit' as const, label: 'UNIT', format: 'compact' as const },
  { key: 'bonus' as const, label: 'BONUS', format: 'number' as const },
  { key: 'cust' as const, label: 'CUST', format: 'number' as const },
  { key: 'item' as const, label: 'ITEM', format: 'number' as const },
]

function fmt(value: number, format: 'compact' | 'number') {
  if (value === 0) return '—'
  if (format === 'compact') return formatCompact(value)
  return formatNumber(value)
}

function emptyCell(): PivotSalesCell {
  return { omzet: 0, value: 0, unit: 0, bonus: 0, cust: 0, item: 0 }
}

export function PivotTable({
  data,
  salesList,
}: {
  data: PivotRow[]
  salesList: PivotSalesInfo[]
}) {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'nama' | 'omzet' | 'unit'>('omzet')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    let rows = data
    if (q) {
      rows = rows.filter(
        (r) =>
          r.namaPart.toLowerCase().includes(q) ||
          r.kodePart.toLowerCase().includes(q)
      )
    }
    const sorted = [...rows].sort((a, b) => {
      let cmp = 0
      if (sortBy === 'nama') cmp = a.namaPart.localeCompare(b.namaPart)
      else if (sortBy === 'omzet') cmp = a.total.omzet - b.total.omzet
      else if (sortBy === 'unit') cmp = a.total.unit - b.total.unit
      return sortDir === 'asc' ? cmp : -cmp
    })
    return sorted
  }, [data, search, sortBy, sortDir])

  const totalsPerSales = useMemo(() => {
    const map: Record<number, PivotSalesCell> = {}
    for (const s of salesList) map[s.id] = emptyCell()
    for (const row of filtered) {
      for (const s of salesList) {
        const cell = row.perSales[s.id] ?? emptyCell()
        const t = map[s.id]
        t.omzet += cell.omzet
        t.value += cell.value
        t.unit += cell.unit
        t.bonus += cell.bonus
        t.cust += cell.cust
        t.item += cell.item
      }
    }
    return map
  }, [filtered, salesList])

  const grandTotal = useMemo(() => {
    const t = emptyCell()
    for (const s of salesList) {
      const st = totalsPerSales[s.id]
      t.omzet += st.omzet
      t.value += st.value
      t.unit += st.unit
      t.bonus += st.bonus
      t.cust += st.cust
      t.item += st.item
    }
    return t
  }, [totalsPerSales, salesList])

  const toggleSort = (key: 'nama' | 'omzet' | 'unit') => {
    if (sortBy === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(key)
      setSortDir(key === 'nama' ? 'asc' : 'desc')
    }
  }

  const handleExportCSV = () => {
    const headers: string[] = ['KODE', 'NAMA PART']
    for (const s of salesList) {
      for (const m of METRICS) headers.push(`${s.nama} - ${m.label}`)
    }
    for (const m of METRICS) headers.push(`TOTAL - ${m.label}`)

    const rows = filtered.map((row) => {
      const r: (string | number)[] = [row.kodePart, row.namaPart]
      for (const s of salesList) {
        const c = row.perSales[s.id] ?? emptyCell()
        for (const m of METRICS) r.push(c[m.key])
      }
      for (const m of METRICS) r.push(row.total[m.key])
      return r
    })

    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${v}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pivot-penjualan-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="w-full min-w-0 space-y-3">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full min-w-0 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari kode atau nama part..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleSort('nama')}
            className={sortBy === 'nama' ? 'border-primary' : ''}
          >
            <ArrowUpDown className="mr-1.5 h-3.5 w-3.5" />
            Nama
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleSort('omzet')}
            className={sortBy === 'omzet' ? 'border-primary' : ''}
          >
            <ArrowUpDown className="mr-1.5 h-3.5 w-3.5" />
            Omzet
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleSort('unit')}
            className={sortBy === 'unit' ? 'border-primary' : ''}
          >
            <ArrowUpDown className="mr-1.5 h-3.5 w-3.5" />
            Unit
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            CSV
          </Button>
        </div>
      </div>

      {/* Table — wrapper dengan overflow-auto untuk scroll internal */}
      <div className="w-full min-w-0 rounded-lg border bg-card overflow-hidden">
        <div className="relative max-h-[600px] overflow-auto">
          <table className="border-collapse text-xs min-w-max">
            <thead className="sticky top-0 z-30">
              {/* Header Row 1: Nama Sales */}
              <tr className="bg-muted">
                <th
                  rowSpan={2}
                  className="sticky left-0 z-40 bg-muted px-3 py-2 text-left font-semibold min-w-[180px] border-r border-b"
                >
                  NAMA PART
                </th>
                {salesList.map((s) => (
                  <th
                    key={s.id}
                    colSpan={METRICS.length}
                    className="px-3 py-2 text-center font-bold border-r border-b text-[11px] uppercase tracking-wide bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200"
                  >
                    {s.nama}
                  </th>
                ))}
                <th
                  colSpan={METRICS.length}
                  className="px-3 py-2 text-center font-bold border-b text-[11px] uppercase tracking-wide bg-primary text-primary-foreground"
                >
                  TOTAL KESELURUHAN
                </th>
              </tr>

              {/* Header Row 2: Metrik */}
              <tr className="bg-muted">
                {salesList.map((s) => (
                  <FragmentMetrics key={`m-${s.id}`} />
                ))}
                {METRICS.map((m) => (
                  <th
                    key={`gt-${m.key}`}
                    className="px-2 py-1.5 text-right font-medium text-muted-foreground whitespace-nowrap min-w-[70px] border-b border-l bg-primary/10"
                  >
                    {m.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={1 + salesList.length * METRICS.length + METRICS.length}
                    className="px-3 py-12 text-center text-muted-foreground"
                  >
                    Tidak ada data
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr
                    key={row.idPart}
                    className="border-b hover:bg-muted/40 transition-colors"
                  >
                    <td className="sticky left-0 z-10 bg-card px-3 py-1.5 border-r">
                      <div className="font-medium text-xs truncate max-w-[160px]">
                        {row.namaPart}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        {row.kodePart}
                      </div>
                    </td>
                    {salesList.map((s) => {
                      const c = row.perSales[s.id] ?? emptyCell()
                      const hasData = c.omzet > 0 || c.unit > 0 || c.item > 0
                      return (
                        <FragmentMetricsCells
                          key={`c-${s.id}`}
                          cell={c}
                          dim={!hasData}
                        />
                      )
                    })}
                    <FragmentMetricsCells cell={row.total} bold />
                  </tr>
                ))
              )}
            </tbody>

            {/* Footer Total — sticky bottom, background SOLID */}
            <tfoot className="sticky bottom-0 z-30">
              <tr>
                <td className="sticky left-0 z-40 bg-slate-200 dark:bg-slate-800 px-3 py-2 border-r border-t-2 border-primary/40 text-[11px] uppercase font-bold">
                  Total Keseluruhan
                </td>
                {salesList.map((s) => (
                  <FragmentMetricsCells
                    key={`t-${s.id}`}
                    cell={totalsPerSales[s.id]}
                    bold
                    footer
                  />
                ))}
                <FragmentMetricsCells cell={grandTotal} bold footer highlight />
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Scroll hint */}
        {filtered.length > 15 && (
          <div className="border-t bg-muted/30 px-3 py-1.5 text-[10px] text-muted-foreground text-center">
            Scroll untuk melihat {filtered.length} part lainnya
          </div>
        )}
      </div>

      {/* Info */}
      <p className="text-[11px] text-muted-foreground">
        Menampilkan {filtered.length} part × {salesList.length} sales · Klik kolom untuk sorting
      </p>
    </div>
  )
}

// ============================================
// Sub-components
// ============================================
function FragmentMetrics() {
  return (
    <>
      {METRICS.map((m) => (
        <th
          key={m.key}
          className="px-2 py-1.5 text-right font-medium text-muted-foreground whitespace-nowrap min-w-[70px] border-r border-b last:border-r-2 bg-muted"
        >
          {m.label}
        </th>
      ))}
    </>
  )
}

function FragmentMetricsCells({
  cell,
  bold = false,
  dim = false,
  footer = false,
  highlight = false,
}: {
  cell: PivotSalesCell
  bold?: boolean
  dim?: boolean
  footer?: boolean
  highlight?: boolean
}) {
  const footerBg = highlight
    ? 'bg-slate-300 dark:bg-slate-700'
    : 'bg-slate-200 dark:bg-slate-800'

  return (
    <>
      {METRICS.map((m) => (
        <td
          key={m.key}
          className={`px-2 py-1.5 text-right tabular-nums whitespace-nowrap border-r border-l last:border-r-2 ${
            footer ? `border-t-2 border-primary/40 ${footerBg}` : ''
          } ${bold ? 'font-bold' : ''} ${
            dim ? 'text-muted-foreground/40' : ''
          }`}
        >
          {fmt(cell[m.key], m.format)}
        </td>
      ))}
    </>
  )
}