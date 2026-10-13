'use client'

import { useState } from 'react'
import {
  Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { formatRupiah, formatNumber } from '@/lib/format'

type Row = {
  namaSales: string
  tahun: number
  unit: number
  omzet: number
  bonus: number
  cust: number
}

type Group = {
  groupName: string
  rows: Row[]
}

export function SalesBreakdownTable({
  title,
  groupLabel,
  groups,
}: {
  title: string
  groupLabel: string
  groups: Group[]
}) {
  const [selected, setSelected] = useState(groups[0]?.groupName ?? '')

  const current = groups.find((g) => g.groupName === selected) ?? groups[0]
  const data = current?.rows ?? []

  const total = data.reduce(
    (acc, r) => ({
      unit: acc.unit + r.unit,
      omzet: acc.omzet + r.omzet,
      bonus: acc.bonus + r.bonus,
      cust: acc.cust + r.cust,
    }),
    { unit: 0, omzet: 0, bonus: 0, cust: 0 }
  )

  const options = groups.map((g) => ({
    value: g.groupName,
    label: g.groupName,
  }))

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-sm font-semibold text-primary truncate">{title}</h3>
          {current && (
            <Badge variant="outline" className="text-[10px] shrink-0">
              {groupLabel}: {current.groupName}
            </Badge>
          )}
        </div>

        {groups.length > 1 && (
          <div className="w-[180px] shrink-0">
            <SearchableSelect
              value={selected}
              onValueChange={setSelected}
              options={options}
              placeholder={`Pilih ${groupLabel}`}
              searchPlaceholder={`Cari ${groupLabel.toLowerCase()}...`}
              className="h-8 text-xs"
            />
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-50 dark:hover:bg-blue-950/50">
              <TableHead className="text-[11px] uppercase font-bold">Nama Sales</TableHead>
              <TableHead className="text-[11px] uppercase font-bold w-[70px]">Year</TableHead>
              <TableHead className="text-[11px] uppercase font-bold text-right">Unit</TableHead>
              <TableHead className="text-[11px] uppercase font-bold text-right">Omzet</TableHead>
              <TableHead className="text-[11px] uppercase font-bold text-right">Bonus</TableHead>
              <TableHead className="text-[11px] uppercase font-bold text-right">Cust</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-6">
                  Belum ada data
                </TableCell>
              </TableRow>
            ) : (
              data.map((r, i) => (
                <TableRow key={`${r.namaSales}-${r.tahun}-${i}`}>
                  <TableCell className="text-xs font-medium">{r.namaSales}</TableCell>
                  <TableCell className="text-xs font-mono">{r.tahun}</TableCell>
                  <TableCell className="text-xs text-right tabular-nums">
                    {formatNumber(r.unit)}
                  </TableCell>
                  <TableCell className="text-xs text-right tabular-nums">
                    {formatRupiah(r.omzet)}
                  </TableCell>
                  <TableCell className="text-xs text-right tabular-nums">
                    {r.bonus > 0 ? formatNumber(r.bonus) : '—'}
                  </TableCell>
                  <TableCell className="text-xs text-right tabular-nums">
                    {formatNumber(r.cust)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          {data.length > 0 && (
            <TableFooter>
              <TableRow className="bg-slate-200 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800">
                <TableCell colSpan={2} className="text-xs uppercase font-bold">
                  Total keseluruhan
                </TableCell>
                <TableCell className="text-xs text-right tabular-nums font-bold">
                  {formatNumber(total.unit)}
                </TableCell>
                <TableCell className="text-xs text-right tabular-nums font-bold">
                  {formatRupiah(total.omzet)}
                </TableCell>
                <TableCell className="text-xs text-right tabular-nums font-bold">
                  {formatNumber(total.bonus)}
                </TableCell>
                <TableCell className="text-xs text-right tabular-nums font-bold">
                  {formatNumber(total.cust)}
                </TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
    </div>
  )
}