'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createCustomer, updateCustomer } from '@/lib/actions/customer'
import type { CustomerInput } from '@/lib/validations/customer'

type Props = {
  trigger: React.ReactElement
  defaultValues?: CustomerInput & { id: number }
  mode: 'create' | 'edit'
}

export function CustomerFormDialog({ trigger, defaultValues, mode }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [aktif, setAktif] = useState(defaultValues?.aktif ?? true)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const fd = new FormData(e.currentTarget)
    const input: CustomerInput = {
      kode: String(fd.get('kode') ?? '').trim(),
      nama: String(fd.get('nama') ?? '').trim(),
      alamat: String(fd.get('alamat') ?? '').trim(),
      telepon: String(fd.get('telepon') ?? '').trim(),
      aktif,
    }

    const result =
      mode === 'create'
        ? await createCustomer(input)
        : await updateCustomer(defaultValues!.id, input)

    if (result.error) {
      toast.error(result.error)
      setLoading(false)
      return
    }

    toast.success(mode === 'create' ? 'Customer ditambahkan' : 'Customer diubah')
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
            <DialogTitle>{mode === 'create' ? 'Tambah Customer' : 'Edit Customer'}</DialogTitle>
            <DialogDescription>
              {mode === 'create' ? 'Isi data customer baru.' : 'Ubah data customer.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="kode">Kode Customer *</Label>
              <Input id="kode" name="kode" placeholder="CST-011" defaultValue={defaultValues?.kode} required disabled={loading} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nama">Nama Customer *</Label>
              <Input id="nama" name="nama" placeholder="Toko Barokah" defaultValue={defaultValues?.nama} required disabled={loading} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alamat">Alamat</Label>
              <Input id="alamat" name="alamat" placeholder="Jl. Merdeka No. 1" defaultValue={defaultValues?.alamat ?? ''} disabled={loading} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telepon">Telepon</Label>
              <Input id="telepon" name="telepon" placeholder="024-1234567" defaultValue={defaultValues?.telepon ?? ''} disabled={loading} />
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
              <Label htmlFor="aktif" className="cursor-pointer">Customer aktif</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
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