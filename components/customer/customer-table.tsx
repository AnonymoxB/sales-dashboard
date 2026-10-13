'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Pencil, Trash2, Loader2 } from 'lucide-react'
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
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { CustomerFormDialog } from './customer-form-dialog'
import { deleteCustomer } from '@/lib/actions/customer'

type Customer = {
  id: number
  kode: string
  nama: string
  alamat: string | null
  telepon: string | null
  aktif: boolean
}

export function CustomerTable({ data }: { data: Customer[] }) {
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleDelete = () => {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await deleteCustomer(deleteTarget.id)
      if (result.error) toast.error(result.error)
      else {
        toast.success('Customer dihapus')
        router.refresh()
      }
      setDeleteTarget(null)
    })
  }

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-sm text-muted-foreground">
          Tidak ada customer yang cocok. Coba ubah filter atau{' '}
          <span className="font-medium">tambah customer baru</span>.
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
              <TableHead>Alamat</TableHead>
              <TableHead>Telepon</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-mono text-sm">{c.kode}</TableCell>
                <TableCell className="font-medium">{c.nama}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {c.alamat ?? '-'}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {c.telepon ?? '-'}
                </TableCell>
                <TableCell>
                  <Badge variant={c.aktif ? 'default' : 'secondary'}>
                    {c.aktif ? 'Aktif' : 'Nonaktif'}
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
                      <CustomerFormDialog
                        mode="edit"
                        defaultValues={{
                          id: c.id,
                          kode: c.kode,
                          nama: c.nama,
                          alamat: c.alamat ?? '',
                          telepon: c.telepon ?? '',
                          aktif: c.aktif,
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

      {/* Pakai Dialog biasa, bukan AlertDialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Hapus customer?</DialogTitle>
            <DialogDescription>
              Customer <strong>{deleteTarget?.nama}</strong> akan dihapus.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button
              type="button"
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
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}