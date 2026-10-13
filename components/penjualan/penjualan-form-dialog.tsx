'use client'

import React, { useState, useMemo } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createPenjualan, updatePenjualan } from '@/lib/actions/penjualan'
import { formatRupiah } from '@/lib/format'

type SalesOption = {
  id: number
  kode: string
  nama: string
  cabang: { nama: string }
}

type PartOption = {
  id: number
  kode: string
  nama: string
  satuan: string
  hargaJual: number
}

type PenjualanFormDialogProps = {
  trigger: React.ReactElement
  defaultValues?: {
    id: string // bigint disimpan sebagai string
    tanggal: string // YYYY-MM-DD
    idSales: number
    idPart: number
    qty: number
    hargaSatuan: number
    diskon: number
  }
  mode: 'create' | 'edit'
  listSales: SalesOption[]
  listPart: PartOption[]
}

export function PenjualanFormDialog({
  trigger,
  defaultValues,
  mode,
  listSales,
  listPart,
}: PenjualanFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const today = new Date().toISOString().slice(0, 10)

  const [tanggal, setTanggal] = useState(defaultValues?.tanggal ?? today)
  const [idSales, setIdSales] = useState(
    defaultValues?.idSales ? String(defaultValues.idSales) : ''
  )
  const [idPart, setIdPart] = useState(
    defaultValues?.idPart ? String(defaultValues.idPart) : ''
  )
  const [qty, setQty] = useState(defaultValues?.qty ?? 1)
  const [hargaSatuan, setHargaSatuan] = useState(defaultValues?.hargaSatuan ?? 0)
  const [diskon, setDiskon] = useState(defaultValues?.diskon ?? 0)

  // Auto-fill harga saat part dipilih
  const handlePartChange = (value: string | null) => {
    if (!value) return
    setIdPart(value)
    const part = listPart.find((p) => p.id === parseInt(value))
    if (part) setHargaSatuan(part.hargaJual)
  }

  // Total preview
  const total = useMemo(
    () => Math.max(0, qty * hargaSatuan - diskon),
    [qty, hargaSatuan, diskon]
  )

  const selectedSales = listSales.find((s) => s.id === parseInt(idSales))
  const selectedPart = listPart.find((p) => p.id === parseInt(idPart))

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const input = {
      tanggal,
      idSales: parseInt(idSales),
      idPart: parseInt(idPart),
      qty,
      hargaSatuan,
      diskon,
    }

    const result =
      mode === 'create'
        ? await createPenjualan(input)
        : await updatePenjualan(BigInt(defaultValues!.id), input)

    if (result.error) {
      toast.error(result.error)
      setLoading(false)
      return
    }

    toast.success(
      mode === 'create' ? 'Penjualan ditambahkan' : 'Penjualan diubah'
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {mode === 'create' ? 'Tambah Penjualan' : 'Edit Penjualan'}
            </DialogTitle>
            <DialogDescription>
              Input transaksi penjualan harian
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tanggal">Tanggal *</Label>
              <Input
                id="tanggal"
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label>Sales *</Label>
              <Select value={idSales} onValueChange={(v) => setIdSales(v ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih sales" />
                </SelectTrigger>
                <SelectContent>
                  {listSales.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.nama} — {s.cabang.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedSales && (
                <p className="text-xs text-muted-foreground">
                  Cabang: {selectedSales.cabang.nama}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Part *</Label>
              <Select value={idPart} onValueChange={handlePartChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih part" />
                </SelectTrigger>
                <SelectContent>
                  {listPart.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.kode} — {p.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedPart && (
                <p className="text-xs text-muted-foreground">
                  Satuan: {selectedPart.satuan}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="qty">Qty *</Label>
                <Input
                  id="qty"
                  type="number"
                  min="1"
                  value={qty}
                  onChange={(e) => setQty(parseInt(e.target.value) || 0)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hargaSatuan">Harga Satuan *</Label>
                <Input
                  id="hargaSatuan"
                  type="number"
                  min="0"
                  step="100"
                  value={hargaSatuan}
                  onChange={(e) => setHargaSatuan(parseFloat(e.target.value) || 0)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="diskon">Diskon</Label>
              <Input
                id="diskon"
                type="number"
                min="0"
                step="100"
                value={diskon}
                onChange={(e) => setDiskon(parseFloat(e.target.value) || 0)}
                disabled={loading}
              />
            </div>

            {/* Preview total */}
            <div className="rounded-md border bg-muted/50 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Subtotal ({qty} × {formatRupiah(hargaSatuan)})
                </span>
                <span>{formatRupiah(qty * hargaSatuan)}</span>
              </div>
              {diskon > 0 && (
                <div className="flex items-center justify-between text-sm text-destructive">
                  <span>Diskon</span>
                  <span>- {formatRupiah(diskon)}</span>
                </div>
              )}
              <div className="mt-1 flex items-center justify-between border-t pt-1 font-semibold">
                <span>Total Omzet</span>
                <span className="text-primary">{formatRupiah(total)}</span>
              </div>
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
              <Button
                type="submit"
                disabled={loading || !idSales || !idPart}
              >
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