'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createSales, updateSales } from '@/lib/actions/sales'
import type { SalesInput } from '@/lib/validations/sales'

type Cabang = { id: number; kode: string; nama: string }

type SalesFormDialogProps = {
  trigger: React.ReactElement
  defaultValues?: SalesInput & { id: number }
  mode: 'create' | 'edit'
  listCabang: Cabang[]
}

export function SalesFormDialog({
  trigger,
  defaultValues,
  mode,
  listCabang,
}: SalesFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [idCabang, setIdCabang] = useState<string>(
    defaultValues?.idCabang ? String(defaultValues.idCabang) : ''
  )
  const [aktif, setAktif] = useState(defaultValues?.aktif ?? true)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const input: SalesInput = {
      kode: String(formData.get('kode') ?? '').trim(),
      nama: String(formData.get('nama') ?? '').trim(),
      idCabang: parseInt(idCabang),
      telepon: String(formData.get('telepon') ?? '').trim(),
      aktif,
    }

    const result =
      mode === 'create'
        ? await createSales(input)
        : await updateSales(defaultValues!.id, input)

    if (result.error) {
      toast.error(result.error)
      setLoading(false)
      return
    }

    toast.success(
      mode === 'create' ? 'Sales berhasil ditambahkan' : 'Sales berhasil diubah'
    )
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
            <DialogTitle>
              {mode === 'create' ? 'Tambah Sales' : 'Edit Sales'}
            </DialogTitle>
            <DialogDescription>
              {mode === 'create'
                ? 'Isi data sales baru di bawah ini.'
                : 'Ubah data sales di bawah ini.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="kode">Kode Sales *</Label>
              <Input
                id="kode"
                name="kode"
                placeholder="SLS-001"
                defaultValue={defaultValues?.kode}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nama">Nama Sales *</Label>
              <Input
                id="nama"
                name="nama"
                placeholder="Budi Santoso"
                defaultValue={defaultValues?.nama}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="idCabang">Cabang *</Label>
              <Select value={idCabang} onValueChange={(v) => setIdCabang(v ?? '')}>
                <SelectTrigger id="idCabang">
                  <SelectValue placeholder="Pilih cabang" />
                </SelectTrigger>
                <SelectContent>
                  {listCabang.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.kode} — {c.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telepon">Telepon</Label>
              <Input
                id="telepon"
                name="telepon"
                placeholder="08123456789"
                defaultValue={defaultValues?.telepon ?? ''}
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
              <Label htmlFor="aktif" className="cursor-pointer">
                Sales aktif
              </Label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Batal
              </Button>
              <Button type="submit" disabled={loading || !idCabang}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}