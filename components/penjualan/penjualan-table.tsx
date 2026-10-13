'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Pencil, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { PenjualanFormDialog } from './penjualan-form-dialog'
import { deletePenjualan } from '@/lib/actions/penjualan'
import { formatRupiah, formatNumber } from '@/lib/format'

type Penjualan = {
  id: string
  tanggal: string
  qty: number
  hargaSatuan: number
  diskon: number
  totalOmzet: number
  sales: { id: number; nama: string }
  part: { id: number; kode: string; nama: string; satuan: string }
  cabang: { id: number; nama: string }
}

type SalesOption = {
  id: number
  kode: string
  nama: string
  cabang: { nama: string }
}

type PartOption = {
  id: number
  kode: string
  nama: string
  satuan: string
  hargaJual: number
}

export function PenjualanTable({
  data,
  listSales,
  listPart,
}: {
  data: Penjualan[]
  listSales: SalesOption[]
  listPart: PartOption[]
}) {
  const [deleteTarget, setDeleteTarget] = useState<Penjualan | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleDelete = () => {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await deletePenjualan(BigInt(deleteTarget.id))
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Penjualan dihapus')
        router.refresh()
      }
      setDeleteTarget(null)
    })
  }

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-sm text-muted-foreground">
          Tidak ada penjualan yang cocok. Coba ubah filter atau{' '}
          <span className="font-medium">tambah transaksi baru</span>.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[110px]">Tanggal</TableHead>
              <TableHead>Sales</TableHead>
              <TableHead>Cabang</TableHead>
              <TableHead>Part</TableHead>
              <TableHead className="w-[60px] text-right">Qty</TableHead>
              <TableHead className="text-right">Harga</TableHead>
              <TableHead className="text-right">Diskon</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="text-sm">
                  {new Date(p.tanggal).toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </TableCell>
                <TableCell className="text-sm font-medium">{p.sales.nama}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {p.cabang.nama}
                </TableCell>
                <TableCell className="text-sm">
                  {p.part.nama}
                  <span className="block text-xs text-muted-foreground">
                    {p.part.kode}
                  </span>
                </TableCell>
                <TableCell className="text-right text-sm">
                  {formatNumber(p.qty)}
                  <span className="ml-1 text-xs text-muted-foreground">
                    {p.part.satuan}
                  </span>
                </TableCell>
                <TableCell className="text-right text-sm">
                  {formatRupiah(p.hargaSatuan)}
                </TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">
                  {p.diskon > 0 ? `- ${formatRupiah(p.diskon)}` : '-'}
                </TableCell>
                <TableCell className="text-right text-sm font-semibold">
                  {formatRupiah(p.totalOmzet)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={<Button variant="ghost" size="icon" className="h-8 w-8" />}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <PenjualanFormDialog
                        mode="edit"
                        listSales={listSales}
                        listPart={listPart}
                        defaultValues={{
                          id: p.id,
                          tanggal: new Date(p.tanggal).toISOString().slice(0, 10),
                          idSales: p.sales.id,
                          idPart: p.part.id,
                          qty: p.qty,
                          hargaSatuan: p.hargaSatuan,
                          diskon: p.diskon,
                        }}
                        trigger={
                          <DropdownMenuItem onClick={(e) => e.preventDefault()}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        }
                      />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault()
                          setDeleteTarget(p)
                        }}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Hapus
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus penjualan?</AlertDialogTitle>
            <AlertDialogDescription>
              Transaksi <strong>{deleteTarget?.part.nama}</strong> oleh{' '}
              <strong>{deleteTarget?.sales.nama}</strong> akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                'Hapus'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}