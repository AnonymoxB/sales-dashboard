'use client'

import { useState, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatRupiah } from '@/lib/format'

type Faktur = {
  id: string
  nomorFaktur: string
  jatuhTempo: string
  totalTagihan: number
  status: string
  sales: { nama: string }
  cabang: { nama: string }
}

const PAGE_SIZE = 5

export function FakturBelumLunasTable({ data }: { data: Faktur[] }) {
  const [page, setPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)

  const paginated = useMemo(
    () => data.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [data, currentPage]
  )

  if (data.length === 0) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>No. Faktur</TableHead>
            <TableHead>Sales</TableHead>
            <TableHead>Cabang</TableHead>
            <TableHead>Jatuh Tempo</TableHead>
            <TableHead className="text-right">Tagihan</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
              Tidak ada faktur belum lunas
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>No. Faktur</TableHead>
            <TableHead>Sales</TableHead>
            <TableHead>Cabang</TableHead>
            <TableHead>Jatuh Tempo</TableHead>
            <TableHead className="text-right">Tagihan</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginated.map((f) => (
            <TableRow key={f.id}>
              <TableCell className="font-medium text-sm">{f.nomorFaktur}</TableCell>
              <TableCell className="text-sm">{f.sales.nama}</TableCell>
              <TableCell className="text-sm">{f.cabang.nama}</TableCell>
              <TableCell className="text-sm">
                {new Date(f.jatuhTempo).toLocaleDateString('id-ID')}
              </TableCell>
              <TableCell className="text-right text-sm">
                {formatRupiah(Number(f.totalTagihan))}
              </TableCell>
              <TableCell>
                <Badge variant={f.status === 'JATUH_TEMPO' ? 'destructive' : 'secondary'}>
                  {f.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t px-4 py-3">
          <p className="text-xs text-muted-foreground">
            Menampilkan{' '}
            <span className="font-medium">
              {(currentPage - 1) * PAGE_SIZE + 1}
            </span>
            –
            <span className="font-medium">
              {Math.min(currentPage * PAGE_SIZE, data.length)}
            </span>{' '}
            dari <span className="font-medium">{data.length}</span> faktur
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs">
              <span className="font-medium">{currentPage}</span>
              <span className="text-muted-foreground"> / {totalPages}</span>
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}