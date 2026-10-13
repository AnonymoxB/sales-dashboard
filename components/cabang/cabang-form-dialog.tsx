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
import { createCabang, updateCabang } from '@/lib/actions/cabang'
import type { CabangInput } from '@/lib/validations/cabang'

type CabangFormDialogProps = {
  trigger: React.ReactElement
  defaultValues?: CabangInput & { id: number }
  mode: 'create' | 'edit'
}

export function CabangFormDialog({ trigger, defaultValues, mode }: CabangFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const input: CabangInput = {
      kode: String(formData.get('kode') ?? '').trim(),
      nama: String(formData.get('nama') ?? '').trim(),
      wilayah: String(formData.get('wilayah') ?? '').trim(),
      alamat: String(formData.get('alamat') ?? '').trim(),
    }

    const result =
      mode === 'create'
        ? await createCabang(input)
        : await updateCabang(defaultValues!.id, input)

    if (result.error) {
      toast.error(result.error)
      setLoading(false)
      return
    }

    toast.success(mode === 'create' ? 'Cabang berhasil ditambahkan' : 'Cabang berhasil diubah')
    setOpen(false)
    setLoading(false)
    router.refresh()
  }

  // Clone trigger & tambahkan onClick untuk buka dialog
  const triggerWithClick = React.cloneElement(trigger, {
    onClick: (e: React.MouseEvent) => {
      e.preventDefault()
      setOpen(true)
      // Teruskan onClick asli kalau ada
      const originalOnClick = (trigger.props as { onClick?: (e: React.MouseEvent) => void }).onClick
      originalOnClick?.(e)
    },
  } as React.HTMLAttributes<HTMLElement>)

  return (
    <>
      {triggerWithClick}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{mode === 'create' ? 'Tambah Cabang' : 'Edit Cabang'}</DialogTitle>
            <DialogDescription>
              {mode === 'create'
                ? 'Isi data cabang baru di bawah ini.'
                : 'Ubah data cabang di bawah ini.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="kode">Kode Cabang *</Label>
              <Input
                id="kode"
                name="kode"
                placeholder="SMG-01"
                defaultValue={defaultValues?.kode}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nama">Nama Cabang *</Label>
              <Input
                id="nama"
                name="nama"
                placeholder="Cabang Semarang"
                defaultValue={defaultValues?.nama}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wilayah">Wilayah</Label>
              <Input
                id="wilayah"
                name="wilayah"
                placeholder="Jateng Pantura"
                defaultValue={defaultValues?.wilayah ?? ''}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alamat">Alamat</Label>
              <Input
                id="alamat"
                name="alamat"
                placeholder="Jl. Raya Semarang No. 1"
                defaultValue={defaultValues?.alamat ?? ''}
                disabled={loading}
              />
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
              <Button type="submit" disabled={loading}>
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