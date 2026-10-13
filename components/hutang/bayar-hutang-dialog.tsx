'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
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
import { bayarHutang } from '@/lib/actions/hutang'
import { formatRupiah } from '@/lib/format'

export function BayarHutangDialog({
  trigger,
  idHutang,
  nomorFaktur,
  sisaHutang,
}: {
  trigger: React.ReactElement
  idHutang: number
  nomorFaktur: string
  sisaHutang: number
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [jumlah, setJumlah] = useState(sisaHutang)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const result = await bayarHutang({
      idHutang,
      jumlahBayar: jumlah,
    })

    if (result.error) {
      toast.error(result.error)
      setLoading(false)
      return
    }

    toast.success('Pembayaran berhasil disimpan')
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

  const handleLunas = () => {
    setJumlah(sisaHutang)
  }

  return (
    <>
      {triggerWithClick}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Bayar Hutang</DialogTitle>
            <DialogDescription>
              Faktur <span className="font-mono font-medium">{nomorFaktur}</span>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-md border bg-muted/50 p-3 text-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Sisa Hutang</span>
                <span className="font-semibold text-orange-600">
                  {formatRupiah(sisaHutang)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Jumlah Bayar *</Label>
              <Input
                type="number"
                min="1"
                max={sisaHutang}
                step="1000"
                value={jumlah}
                onChange={(e) => setJumlah(parseFloat(e.target.value) || 0)}
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={handleLunas}
                className="text-xs text-primary hover:underline"
              >
                Bayar lunas ({formatRupiah(sisaHutang)})
              </button>
            </div>

            {jumlah > 0 && jumlah < sisaHutang && (
              <div className="rounded-md border bg-card p-3 text-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Sisa setelah bayar</span>
                  <span className="font-medium">
                    {formatRupiah(sisaHutang - jumlah)}
                  </span>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={loading || jumlah <= 0 || jumlah > sisaHutang}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan Pembayaran'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}