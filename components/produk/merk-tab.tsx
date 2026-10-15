'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, MoreHorizontal, Pencil, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { createMerk, updateMerk, deleteMerk } from '@/lib/actions/produk'

type Merk = {
  id: number
  kode: string
  nama: string
  _count?: { bahan: number }
}

function MerkFormDialog({
  trigger,
  defaultValues,
  mode,
}: {
  trigger: React.ReactElement
  defaultValues?: { id: number; kode: string; nama: string }
  mode: 'create' | 'edit'
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const input = {
      kode: String(fd.get('kode') ?? '').trim(),
      nama: String(fd.get('nama') ?? '').trim(),
    }
    const result =
      mode === 'create'
        ? await createMerk(input)
        : await updateMerk(defaultValues!.id, input)

    if (result.error) {
      toast.error(result.error)
      setLoading(false)
      return
    }
    toast.success(mode === 'create' ? 'Merk ditambahkan' : 'Merk diubah')
    setOpen(false)
    setLoading(false)
    router.refresh()
  }

  const triggerWithClick = React.cloneElement(trigger, {
    onClick: (e: React.MouseEvent) => {
      e.preventDefault()
      setOpen(true)
    },
  } as React.HTMLAttributes<HTMLElement>)

  return (
    <>
      {triggerWithClick}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{mode === 'create' ? 'Tambah Merk' : 'Edit Merk'}</DialogTitle>
            <DialogDescription>Data merk produk</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="kode">Kode *</Label>
              <Input id="kode" name="kode" placeholder="MRK-001" defaultValue={defaultValues?.kode} required disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nama">Nama *</Label>
              <Input id="nama" name="nama" placeholder="Yamaha" defaultValue={defaultValues?.nama} required disabled={loading} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>Batal</Button>
              <Button type="submit" disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</> : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function MerkTab({
  data,
  canCreate,
  canUpdate,
  canDelete,
}: {
  data: Merk[]
  canCreate: boolean
  canUpdate: boolean
  canDelete: boolean
}) {
  const [deleteTarget, setDeleteTarget] = useState<Merk | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const showActions = canUpdate || canDelete

  const handleDelete = () => {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await deleteMerk(deleteTarget.id)
      if (result.error) toast.error(result.error)
      else {
        toast.success('Merk dihapus')
        router.refresh()
      }
      setDeleteTarget(null)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Merk</h2>
          <p className="text-sm text-muted-foreground">Daftar merk produk</p>
        </div>
        {canCreate && (
          <MerkFormDialog
            mode="create"
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Merk
              </Button>
            }
          />
        )}
      </div>

      {data.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">Belum ada merk</p>
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Kode</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead className="w-[100px] text-right">Bahan</TableHead>
                {showActions && <TableHead className="w-[60px]" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-mono text-sm">{m.kode}</TableCell>
                  <TableCell className="font-medium">{m.nama}</TableCell>
                  <TableCell className="text-right text-sm">{m._count?.bahan ?? 0}</TableCell>
                  {showActions && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canUpdate && (
                            <MerkFormDialog
                              mode="edit"
                              defaultValues={{ id: m.id, kode: m.kode, nama: m.nama }}
                              trigger={
                                <DropdownMenuItem onClick={(e) => e.preventDefault()}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                              }
                            />
                          )}
                          {canDelete && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.preventDefault()
                                setDeleteTarget(m)
                              }}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Hapus
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus merk?</AlertDialogTitle>
            <AlertDialogDescription>
              Merk <strong>{deleteTarget?.nama}</strong> akan dihapus permanen.
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
              {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menghapus...</> : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}