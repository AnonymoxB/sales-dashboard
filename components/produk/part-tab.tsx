'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, MoreHorizontal, Pencil, Trash2, Loader2, Search, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import { createPart, updatePart, deletePart } from '@/lib/actions/produk'
import { formatRupiah } from '@/lib/format'

type Bahan = {
  id: number
  kode: string
  nama: string
  merk: { nama: string }
}

type Part = {
  id: number
  kode: string
  nama: string
  idBahan: number
  satuan: string
  hargaJual: number
  aktif: boolean
  bahan: { id: number; nama: string; merk: { nama: string } }
}

function PartFormDialog({
  trigger,
  defaultValues,
  mode,
  listBahan,
}: {
  trigger: React.ReactElement
  defaultValues?: {
    id: number
    kode: string
    nama: string
    idBahan: number
    satuan: string
    hargaJual: number
    aktif: boolean
  }
  mode: 'create' | 'edit'
  listBahan: Bahan[]
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [idBahan, setIdBahan] = useState(defaultValues?.idBahan ? String(defaultValues.idBahan) : '')
  const [satuan, setSatuan] = useState(defaultValues?.satuan ?? 'PCS')
  const [aktif, setAktif] = useState(defaultValues?.aktif ?? true)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const input = {
      kode: String(fd.get('kode') ?? '').trim(),
      nama: String(fd.get('nama') ?? '').trim(),
      idBahan: parseInt(idBahan),
      satuan,
      hargaJual: parseFloat(String(fd.get('hargaJual') ?? '0')),
      aktif,
    }
    const result =
      mode === 'create' ? await createPart(input) : await updatePart(defaultValues!.id, input)

    if (result.error) {
      toast.error(result.error)
      setLoading(false)
      return
    }
    toast.success(mode === 'create' ? 'Part ditambahkan' : 'Part diubah')
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
            <DialogTitle>{mode === 'create' ? 'Tambah Part' : 'Edit Part'}</DialogTitle>
            <DialogDescription>Data part produk</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="kode">Kode *</Label>
                <Input id="kode" name="kode" placeholder="PRT-001" defaultValue={defaultValues?.kode} required disabled={loading} />
              </div>
              <div className="space-y-2">
                <Label>Satuan *</Label>
                <Select value={satuan} onValueChange={(v) => setSatuan(v ?? 'PCS')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PCS">PCS</SelectItem>
                    <SelectItem value="SET">SET</SelectItem>
                    <SelectItem value="BOX">BOX</SelectItem>
                    <SelectItem value="LITER">LITER</SelectItem>
                    <SelectItem value="KG">KG</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nama">Nama *</Label>
              <Input id="nama" name="nama" placeholder="Filter Oli" defaultValue={defaultValues?.nama} required disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label>Bahan *</Label>
              <Select value={idBahan} onValueChange={(v) => setIdBahan(v ?? '')}>
                <SelectTrigger><SelectValue placeholder="Pilih bahan" /></SelectTrigger>
                <SelectContent>
                  {listBahan.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.nama} — {b.merk.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hargaJual">Harga Jual *</Label>
              <Input
                id="hargaJual"
                name="hargaJual"
                type="number"
                min="0"
                step="100"
                placeholder="50000"
                defaultValue={defaultValues?.hargaJual}
                required
                disabled={loading}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="aktif"
                checked={aktif}
                onChange={(e) => setAktif(e.target.checked)}
                disabled={loading}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="aktif" className="cursor-pointer">Part aktif</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>Batal</Button>
              <Button type="submit" disabled={loading || !idBahan}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</> : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function PartTab({
  data,
  listBahan,
}: {
  data: Part[]
  listBahan: Bahan[]
}) {
  const [deleteTarget, setDeleteTarget] = useState<Part | null>(null)
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [filterBahan, setFilterBahan] = useState('all')
  const router = useRouter()

  const filtered = data.filter((p) => {
    const matchSearch =
      !search ||
      p.kode.toLowerCase().includes(search.toLowerCase()) ||
      p.nama.toLowerCase().includes(search.toLowerCase())
    const matchBahan = filterBahan === 'all' || p.idBahan === parseInt(filterBahan)
    return matchSearch && matchBahan
  })

  const handleDelete = () => {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await deletePart(deleteTarget.id)
      if (result.error) toast.error(result.error)
      else {
        toast.success('Part dihapus')
        router.refresh()
      }
      setDeleteTarget(null)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Part</h2>
          <p className="text-sm text-muted-foreground">Daftar part / item produk</p>
        </div>
        <PartFormDialog
          mode="create"
          listBahan={listBahan}
          trigger={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Part
            </Button>
          }
        />
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
        <Select value={filterBahan} onValueChange={(v) => setFilterBahan(v ?? 'all')}>
          <SelectTrigger className="w-full sm:w-[220px]"><SelectValue placeholder="Semua Bahan" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Bahan</SelectItem>
            {listBahan.map((b) => (
              <SelectItem key={b.id} value={String(b.id)}>{b.nama}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">Tidak ada part yang cocok</p>
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Kode</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Bahan</TableHead>
                <TableHead className="w-[80px]">Satuan</TableHead>
                <TableHead className="text-right">Harga Jual</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-sm">{p.kode}</TableCell>
                  <TableCell className="font-medium">{p.nama}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {p.bahan.nama}
                    <span className="text-xs"> · {p.bahan.merk.nama}</span>
                  </TableCell>
                  <TableCell className="text-sm">{p.satuan}</TableCell>
                  <TableCell className="text-right text-sm">{formatRupiah(Number(p.hargaJual))}</TableCell>
                  <TableCell>
                    <Badge variant={p.aktif ? 'default' : 'secondary'}>
                      {p.aktif ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <PartFormDialog
                          mode="edit"
                          listBahan={listBahan}
                          defaultValues={{
                            id: p.id,
                            kode: p.kode,
                            nama: p.nama,
                            idBahan: p.idBahan,
                            satuan: p.satuan,
                            hargaJual: Number(p.hargaJual),
                            aktif: p.aktif,
                          }}
                          trigger={
                            <DropdownMenuItem onClick={(e) => e.preventDefault()}>
                              <Pencil className="mr-2 h-4 w-4" />Edit
                            </DropdownMenuItem>
                          }
                        />
                        <DropdownMenuItem
                          onClick={(e) => { e.preventDefault(); setDeleteTarget(p) }}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus part?</AlertDialogTitle>
            <AlertDialogDescription>
              Part <strong>{deleteTarget?.nama}</strong> akan dihapus permanen.
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