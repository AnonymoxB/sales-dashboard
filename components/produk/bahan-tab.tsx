'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, MoreHorizontal, Pencil, Trash2, Loader2, Search, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
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
import { createBahan, updateBahan, deleteBahan } from '@/lib/actions/produk'

type Merk = { id: number; kode: string; nama: string }
type Jenis = { id: number; kode: string; nama: string }

type Bahan = {
  id: number
  kode: string
  nama: string
  idMerk: number
  idJenis: number
  merk: { id: number; kode: string; nama: string }
  jenis: { id: number; kode: string; nama: string }
  _count?: { part: number }
}

function BahanFormDialog({
  trigger,
  defaultValues,
  mode,
  listMerk,
  listJenis,
}: {
  trigger: React.ReactElement
  defaultValues?: {
    id: number
    kode: string
    nama: string
    idMerk: number
    idJenis: number
  }
  mode: 'create' | 'edit'
  listMerk: Merk[]
  listJenis: Jenis[]
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [idMerk, setIdMerk] = useState(defaultValues?.idMerk ? String(defaultValues.idMerk) : '')
  const [idJenis, setIdJenis] = useState(defaultValues?.idJenis ? String(defaultValues.idJenis) : '')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const input = {
      kode: String(fd.get('kode') ?? '').trim(),
      nama: String(fd.get('nama') ?? '').trim(),
      idMerk: parseInt(idMerk),
      idJenis: parseInt(idJenis),
    }
    const result =
      mode === 'create'
        ? await createBahan(input)
        : await updateBahan(defaultValues!.id, input)

    if (result.error) {
      toast.error(result.error)
      setLoading(false)
      return
    }
    toast.success(mode === 'create' ? 'Bahan ditambahkan' : 'Bahan diubah')
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
            <DialogTitle>{mode === 'create' ? 'Tambah Bahan' : 'Edit Bahan'}</DialogTitle>
            <DialogDescription>Data bahan produk</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="kode">Kode *</Label>
              <Input id="kode" name="kode" placeholder="BHN-001" defaultValue={defaultValues?.kode} required disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nama">Nama *</Label>
              <Input id="nama" name="nama" placeholder="Oli Mesin" defaultValue={defaultValues?.nama} required disabled={loading} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Merk *</Label>
                <Select value={idMerk} onValueChange={(v) => setIdMerk(v ?? '')}>
                  <SelectTrigger><SelectValue placeholder="Pilih merk" /></SelectTrigger>
                  <SelectContent>
                    {listMerk.map((m) => (
                      <SelectItem key={m.id} value={String(m.id)}>{m.nama}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Jenis *</Label>
                <Select value={idJenis} onValueChange={(v) => setIdJenis(v ?? '')}>
                  <SelectTrigger><SelectValue placeholder="Pilih jenis" /></SelectTrigger>
                  <SelectContent>
                    {listJenis.map((j) => (
                      <SelectItem key={j.id} value={String(j.id)}>{j.nama}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>Batal</Button>
              <Button type="submit" disabled={loading || !idMerk || !idJenis}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</> : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function BahanTab({
  data,
  listMerk,
  listJenis,
  canCreate,
  canUpdate,
  canDelete,
}: {
  data: Bahan[]
  listMerk: Merk[]
  listJenis: Jenis[]
  canCreate: boolean
  canUpdate: boolean
  canDelete: boolean
}) {
  const [deleteTarget, setDeleteTarget] = useState<Bahan | null>(null)
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [filterMerk, setFilterMerk] = useState('all')
  const [filterJenis, setFilterJenis] = useState('all')
  const router = useRouter()

  const showActions = canUpdate || canDelete

  const filtered = data.filter((b) => {
    const matchSearch =
      !search ||
      b.kode.toLowerCase().includes(search.toLowerCase()) ||
      b.nama.toLowerCase().includes(search.toLowerCase())
    const matchMerk = filterMerk === 'all' || b.idMerk === parseInt(filterMerk)
    const matchJenis = filterJenis === 'all' || b.idJenis === parseInt(filterJenis)
    return matchSearch && matchMerk && matchJenis
  })

  const handleDelete = () => {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await deleteBahan(deleteTarget.id)
      if (result.error) toast.error(result.error)
      else {
        toast.success('Bahan dihapus')
        router.refresh()
      }
      setDeleteTarget(null)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Bahan</h2>
          <p className="text-sm text-muted-foreground">Daftar bahan berdasarkan merk & jenis</p>
        </div>
        {canCreate && (
          <BahanFormDialog
            mode="create"
            listMerk={listMerk}
            listJenis={listJenis}
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Bahan
              </Button>
            }
          />
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Cari kode atau nama..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-9" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" type="button">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Select value={filterMerk} onValueChange={(v) => setFilterMerk(v ?? 'all')}>
          <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Semua Merk" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Merk</SelectItem>
            {listMerk.map((m) => (<SelectItem key={m.id} value={String(m.id)}>{m.nama}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={filterJenis} onValueChange={(v) => setFilterJenis(v ?? 'all')}>
          <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Semua Jenis" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Jenis</SelectItem>
            {listJenis.map((j) => (<SelectItem key={j.id} value={String(j.id)}>{j.nama}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">Tidak ada bahan yang cocok</p>
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Kode</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Merk</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead className="w-[80px] text-right">Part</TableHead>
                {showActions && <TableHead className="w-[60px]" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-mono text-sm">{b.kode}</TableCell>
                  <TableCell className="font-medium">{b.nama}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{b.merk.nama}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{b.jenis.nama}</TableCell>
                  <TableCell className="text-right text-sm">{b._count?.part ?? 0}</TableCell>
                  {showActions && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canUpdate && (
                            <BahanFormDialog
                              mode="edit"
                              listMerk={listMerk}
                              listJenis={listJenis}
                              defaultValues={{
                                id: b.id,
                                kode: b.kode,
                                nama: b.nama,
                                idMerk: b.idMerk,
                                idJenis: b.idJenis,
                              }}
                              trigger={
                                <DropdownMenuItem onClick={(e) => e.preventDefault()}>
                                  <Pencil className="mr-2 h-4 w-4" />Edit
                                </DropdownMenuItem>
                              }
                            />
                          )}
                          {canDelete && (
                            <DropdownMenuItem
                              onClick={(e) => { e.preventDefault(); setDeleteTarget(b) }}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />Hapus
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
            <AlertDialogTitle>Hapus bahan?</AlertDialogTitle>
            <AlertDialogDescription>
              Bahan <strong>{deleteTarget?.nama}</strong> akan dihapus permanen.
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
    </div>
  )
}