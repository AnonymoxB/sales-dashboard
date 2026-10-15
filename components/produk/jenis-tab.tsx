'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, MoreHorizontal, Pencil, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
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
import { createJenis, updateJenis, deleteJenis } from '@/lib/actions/produk'

type Jenis = {
  id: number
  kode: string
  nama: string
  _count?: { bahan: number }
}

function JenisFormDialog({
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
        ? await createJenis(input)
        : await updateJenis(defaultValues!.id, input)

    if (result.error) {
      toast.error(result.error)
      setLoading(false)
      return
    }
    toast.success(mode === 'create' ? 'Jenis ditambahkan' : 'Jenis diubah')
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
            <DialogTitle>{mode === 'create' ? 'Tambah Jenis' : 'Edit Jenis'}</DialogTitle>
            <DialogDescription>Data jenis produk</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="kode">Kode *</Label>
              <Input id="kode" name="kode" placeholder="JNS-001" defaultValue={defaultValues?.kode} required disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nama">Nama *</Label>
              <Input id="nama" name="nama" placeholder="Oli" defaultValue={defaultValues?.nama} required disabled={loading} />
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

export function JenisTab({
  data,
  canCreate,
  canUpdate,
  canDelete,
}: {
  data: Jenis[]
  canCreate: boolean
  canUpdate: boolean
  canDelete: boolean
}) {
  const [deleteTarget, setDeleteTarget] = useState<Jenis | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const showActions = canUpdate || canDelete

  const handleDelete = () => {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await deleteJenis(deleteTarget.id)
      if (result.error) toast.error(result.error)
      else {
        toast.success('Jenis dihapus')
        router.refresh()
      }
      setDeleteTarget(null)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Jenis</h2>
          <p className="text-sm text-muted-foreground">Daftar jenis produk</p>
        </div>
        {canCreate && (
          <JenisFormDialog
            mode="create"
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Jenis
              </Button>
            }
          />
        )}
      </div>

      {data.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">Belum ada jenis</p>
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
              {data.map((j) => (
                <TableRow key={j.id}>
                  <TableCell className="font-mono text-sm">{j.kode}</TableCell>
                  <TableCell className="font-medium">{j.nama}</TableCell>
                  <TableCell className="text-right text-sm">{j._count?.bahan ?? 0}</TableCell>
                  {showActions && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canUpdate && (
                            <JenisFormDialog
                              mode="edit"
                              defaultValues={{ id: j.id, kode: j.kode, nama: j.nama }}
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
                                setDeleteTarget(j)
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
            <AlertDialogTitle>Hapus jenis?</AlertDialogTitle>
            <AlertDialogDescription>
              Jenis <strong>{deleteTarget?.nama}</strong> akan dihapus permanen.
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