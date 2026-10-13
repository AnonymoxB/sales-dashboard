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
import { CabangFormDialog } from './cabang-form-dialog'
import { deleteCabang } from '@/lib/actions/cabang'

type Cabang = {
  id: number
  kode: string
  nama: string
  wilayah: string | null
  alamat: string | null
  _count?: { sales: number }
}

export function CabangTable({ data }: { data: Cabang[] }) {
  const [deleteTarget, setDeleteTarget] = useState<Cabang | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleDelete = () => {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await deleteCabang(deleteTarget.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Cabang berhasil dihapus')
        router.refresh()
      }
      setDeleteTarget(null)
    })
  }

  if (data.length === 0) {
  return (
    <div className="rounded-lg border border-dashed p-12 text-center">
      <p className="text-sm text-muted-foreground">
        Tidak ada cabang yang cocok dengan filter. Coba ubah kata kunci atau{' '}
        <span className="font-medium">tambah cabang baru</span>.
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
              <TableHead>Wilayah</TableHead>
              <TableHead>Alamat</TableHead>
              <TableHead className="w-[100px] text-right">Sales</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-mono text-sm">{c.kode}</TableCell>
                <TableCell className="font-medium">{c.nama}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {c.wilayah ?? '-'}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {c.alamat ?? '-'}
                </TableCell>
                <TableCell className="text-right text-sm">
                  {c._count?.sales ?? 0}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button variant="ghost" size="icon" className="h-8 w-8" />
                      }
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <CabangFormDialog
                        mode="edit"
                        defaultValues={{
                          id: c.id,
                          kode: c.kode,
                          nama: c.nama,
                          wilayah: c.wilayah ?? '',
                          alamat: c.alamat ?? '',
                        }}
                        trigger={
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        }
                      />
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault()
                          setDeleteTarget(c)
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
            <AlertDialogTitle>Hapus cabang?</AlertDialogTitle>
            <AlertDialogDescription>
              Cabang <strong>{deleteTarget?.nama}</strong> akan dihapus permanen.
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