'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Pencil, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { SalesFormDialog } from './sales-form-dialog'
import { deleteSales } from '@/lib/actions/sales'

type Sales = {
  id: number
  kode: string
  nama: string
  telepon: string | null
  aktif: boolean
  idCabang: number
  cabang: { id: number; kode: string; nama: string }
}

type Cabang = { id: number; kode: string; nama: string }

export function SalesTable({
  data,
  listCabang,
}: {
  data: Sales[]
  listCabang: Cabang[]
}) {
  const [deleteTarget, setDeleteTarget] = useState<Sales | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleDelete = () => {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await deleteSales(deleteTarget.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Sales berhasil dihapus')
        router.refresh()
      }
      setDeleteTarget(null)
    })
  }

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-sm text-muted-foreground">
          Tidak ada sales yang cocok dengan filter. Coba ubah kata kunci atau{' '}
          <span className="font-medium">tambah sales baru</span>.
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
              <TableHead className="w-[120px]">Kode</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Cabang</TableHead>
              <TableHead>Telepon</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-mono text-sm">{s.kode}</TableCell>
                <TableCell className="font-medium">{s.nama}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {s.cabang.nama}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {s.telepon ?? '-'}
                </TableCell>
                <TableCell>
                  <Badge variant={s.aktif ? 'default' : 'secondary'}>
                    {s.aktif ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={<Button variant="ghost" size="icon" className="h-8 w-8" />}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <SalesFormDialog
                        mode="edit"
                        listCabang={listCabang}
                        defaultValues={{
                          id: s.id,
                          kode: s.kode,
                          nama: s.nama,
                          idCabang: s.idCabang,
                          telepon: s.telepon ?? '',
                          aktif: s.aktif,
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
                          setDeleteTarget(s)
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

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus sales?</AlertDialogTitle>
            <AlertDialogDescription>
              Sales <strong>{deleteTarget?.nama}</strong> akan dihapus permanen.
              Tindakan ini tidak bisa dibatalkan.
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