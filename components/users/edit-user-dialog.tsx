'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { updateUser } from '@/lib/actions/users'

type UserItem = {
  id: string
  email: string
  nama: string | null
  idCabang: number | null
  cabang: { id: number; kode: string; nama: string } | null
}

type Cabang = { id: number; kode: string; nama: string }

export function EditUserDialog({
  trigger,
  user,
  listCabang,
}: {
  trigger: React.ReactElement
  user: UserItem
  listCabang: Cabang[]
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [idCabang, setIdCabang] = useState<string>(
    user.idCabang ? String(user.idCabang) : 'none'
  )
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const fd = new FormData(e.currentTarget)
    const nama = String(fd.get('nama') ?? '').trim()

    const result = await updateUser(user.id, {
      nama,
      idCabang: idCabang === 'none' ? null : parseInt(idCabang),
    })

    if (result.error) {
      toast.error(result.error)
      setLoading(false)
      return
    }

    toast.success('User diubah')
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
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Ubah nama & cabang user
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user.email} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">
                Email tidak bisa diubah
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nama">Nama</Label>
              <Input
                id="nama"
                name="nama"
                placeholder="Nama lengkap"
                defaultValue={user.nama ?? ''}
                disabled={loading}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label>Cabang</Label>
              <Select value={idCabang} onValueChange={(v) => setIdCabang(v ?? 'none')}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih cabang (opsional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Tanpa Cabang —</SelectItem>
                  {listCabang.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.kode} — {c.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Cabang untuk user ini. Kosongkan kalau tidak perlu.
              </p>
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
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Simpan
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}