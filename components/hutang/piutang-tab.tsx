'use client'

import { useState } from 'react'
import { Wallet } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { BayarHutangDialog } from './bayar-hutang-dialog'
import { formatRupiah } from '@/lib/format'

type Piutang = {
  id: number
  nomorFaktur: string
  jatuhTempo: string
  totalHutang: number
  totalBayar: number
  sisaHutang: number
  statusLunas: boolean
  sales: { nama: string }
  cabang: { nama: string }
}

export function PiutangTab({ data }: { data: Piutang[] }) {
  const belumLunas = data.filter((d) => !d.statusLunas)
  const lunas = data.filter((d) => d.statusLunas)
  const totalSisa = belumLunas.reduce((s, d) => s + d.sisaHutang, 0)

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-sm text-muted-foreground">
          Belum ada piutang. Buat faktur dulu di tab Faktur.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-3">
          <p className="text-xs text-muted-foreground">Total Sisa Piutang</p>
          <p className="text-xl font-bold text-orange-600">{formatRupiah(totalSisa)}</p>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <p className="text-xs text-muted-foreground">Faktur Belum Lunas</p>
          <p className="text-xl font-bold">{belumLunas.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <p className="text-xs text-muted-foreground">Faktur Lunas</p>
          <p className="text-xl font-bold text-green-600">{lunas.length}</p>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">No. Faktur</TableHead>
              <TableHead>Sales</TableHead>
              <TableHead>Cabang</TableHead>
              <TableHead>Jatuh Tempo</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Dibayar</TableHead>
              <TableHead className="text-right">Sisa</TableHead>
              <TableHead className="w-[110px]">Status</TableHead>
              <TableHead className="w-[120px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((h) => {
              const isJatuhTempo =
                !h.statusLunas && new Date(h.jatuhTempo) < new Date()

              return (
                <TableRow key={h.id}>
                  <TableCell className="font-mono text-sm">{h.nomorFaktur}</TableCell>
                  <TableCell className="text-sm">{h.sales.nama}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {h.cabang.nama}
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(h.jatuhTempo).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {formatRupiah(h.totalHutang)}
                  </TableCell>
                  <TableCell className="text-right text-sm text-green-600">
                    {formatRupiah(h.totalBayar)}
                  </TableCell>
                  <TableCell className="text-right text-sm font-semibold text-orange-600">
                    {formatRupiah(h.sisaHutang)}
                  </TableCell>
                  <TableCell>
                    {h.statusLunas ? (
                      <Badge className="bg-green-600 hover:bg-green-600">Lunas</Badge>
                    ) : isJatuhTempo ? (
                      <Badge variant="destructive">Jatuh Tempo</Badge>
                    ) : (
                      <Badge variant="secondary">Belum Lunas</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {!h.statusLunas && (
                      <BayarHutangDialog
                        idHutang={h.id}
                        nomorFaktur={h.nomorFaktur}
                        sisaHutang={h.sisaHutang}
                        trigger={
                          <Button size="sm" variant="outline">
                            <Wallet className="mr-2 h-4 w-4" />
                            Bayar
                          </Button>
                        }
                      />
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}