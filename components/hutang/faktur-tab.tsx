'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { deleteFaktur } from '@/lib/actions/hutang'
import { formatRupiah } from '@/lib/format'

type Faktur = {
  id: string
  nomorFaktur: string
  tanggal: string
  jatuhTempo: string
  totalTagihan: number
  status: string
  sales: { nama: string }
  cabang: { nama: string }
  hutang: {
    id: number
    totalBayar: number
    sisaHutang: number
    statusLunas: boolean
  } | null
}

export function FakturTab({
  data,
  canDelete,
}: {
  data: Faktur[]
  canDelete: boolean
}) {
  const [deleteTarget, setDeleteTarget] = useState<Faktur | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleDelete = () => {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await deleteFaktur(BigInt(deleteTarget.id))
      if (result.error) toast.error(result.error)
      else {
        toast.success('Faktur dihapus')
        router.refresh()
      }
      setDeleteTarget(null)
    })
  }

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-sm text-muted-foreground">Belum ada faktur</p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">No. Faktur</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Jatuh Tempo</TableHead>
              <TableHead>Sales</TableHead>
              <TableHead>Cabang</TableHead>
              <TableHead className="text-right">Tagihan</TableHead>
              <TableHead className="text-right">Dibayar</TableHead>
              <TableHead className="text-right">Sisa</TableHead>
              <TableHead className="w-[110px]">Status</TableHead>
              {canDelete && <TableHead className="w-[60px]" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((f) => {
              const sisa = f.hutang?.sisaHutang ?? 0
              const dibayar = f.hutang?.totalBayar ?? 0
              const isJatuhTempo =
                !f.hutang?.statusLunas && new Date(f.jatuhTempo) < new Date()

              return (
                <TableRow key={f.id}>
                  <TableCell className="font-mono text-sm">{f.nomorFaktur}</TableCell>
                  <TableCell className="text-sm">
                    {new Date(f.tanggal).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(f.jatuhTempo).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </TableCell>
                  <TableCell className="text-sm">{f.sales.nama}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {f.cabang.nama}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {formatRupiah(f.totalTagihan)}
                  </TableCell>
                  <TableCell className="text-right text-sm text-green-600">
                    {formatRupiah(dibayar)}
                  </TableCell>
                  <TableCell className="text-right text-sm font-semibold text-orange-600">
                    {formatRupiah(sisa)}
                  </TableCell>
                  <TableCell>
                    {f.hutang?.statusLunas ? (
                      <Badge className="bg-green-600 hover:bg-green-600">Lunas</Badge>
                    ) : isJatuhTempo ? (
                      <Badge variant="destructive">Jatuh Tempo</Badge>
                    ) : (
                      <Badge variant="secondary">Belum Lunas</Badge>
                    )}
                  </TableCell>
                  {canDelete && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.preventDefault()
                              setDeleteTarget(f)
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus faktur?</AlertDialogTitle>
            <AlertDialogDescription>
              Faktur <strong>{deleteTarget?.nomorFaktur}</strong> akan dihapus permanen
              bersama hutang terkait.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDelete() }}
              disabled={isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menghapus...</> : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}