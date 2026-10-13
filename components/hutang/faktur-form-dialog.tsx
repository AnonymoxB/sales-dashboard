'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, Trash2 } from 'lucide-react'
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
import { createFaktur } from '@/lib/actions/hutang'
import { formatRupiah } from '@/lib/format'

type SalesOption = { id: number; kode: string; nama: string; cabang: { nama: string } }
type PartOption = { id: number; kode: string; nama: string; satuan: string; hargaJual: number }

type ItemRow = {
  tempId: string
  idPart: string
  qty: number
  hargaSatuan: number
}

export function FakturFormDialog({
  trigger,
  listSales,
  listPart,
}: {
  trigger: React.ReactElement
  listSales: SalesOption[]
  listPart: PartOption[]
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const today = new Date().toISOString().slice(0, 10)
  const defaultJatuhTempo = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)

  const [nomorFaktur, setNomorFaktur] = useState('')
  const [tanggal, setTanggal] = useState(today)
  const [jatuhTempo, setJatuhTempo] = useState(defaultJatuhTempo)
  const [idSales, setIdSales] = useState('')
  const [items, setItems] = useState<ItemRow[]>([
    { tempId: crypto.randomUUID(), idPart: '', qty: 1, hargaSatuan: 0 },
  ])

  const selectedSales = listSales.find((s) => s.id === parseInt(idSales))

  const totalTagihan = useMemo(
    () => items.reduce((s, i) => s + i.qty * i.hargaSatuan, 0),
    [items]
  )

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { tempId: crypto.randomUUID(), idPart: '', qty: 1, hargaSatuan: 0 },
    ])
  }

  const handleRemoveItem = (tempId: string) => {
    if (items.length <= 1) {
      toast.error('Minimal 1 item')
      return
    }
    setItems((prev) => prev.filter((i) => i.tempId !== tempId))
  }

  const handleItemChange = (tempId: string, patch: Partial<ItemRow>) => {
    setItems((prev) =>
      prev.map((i) => (i.tempId === tempId ? { ...i, ...patch } : i))
    )
  }

  const handlePartChange = (tempId: string, value: string | null) => {
    if (!value) return
    const part = listPart.find((p) => p.id === parseInt(value))
    handleItemChange(tempId, {
      idPart: value,
      hargaSatuan: part?.hargaJual ?? 0,
    })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const input = {
      nomorFaktur: nomorFaktur.trim(),
      tanggal,
      jatuhTempo,
      idSales: parseInt(idSales),
      items: items
        .filter((i) => i.idPart)
        .map((i) => ({
          idPart: parseInt(i.idPart),
          qty: i.qty,
          hargaSatuan: i.hargaSatuan,
        })),
    }

    if (input.items.length === 0) {
      toast.error('Minimal 1 item harus diisi')
      setLoading(false)
      return
    }

    const result = await createFaktur(input)

    if (result.error) {
      toast.error(result.error)
      setLoading(false)
      return
    }

    toast.success('Faktur berhasil dibuat')
    setOpen(false)
    setLoading(false)
    // Reset
    setNomorFaktur('')
    setItems([{ tempId: crypto.randomUUID(), idPart: '', qty: 1, hargaSatuan: 0 }])
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
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Buat Faktur Baru</DialogTitle>
            <DialogDescription>
              Faktur akan otomatis membuat piutang di tab Hutang
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Header */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>No. Faktur *</Label>
                <Input
                  value={nomorFaktur}
                  onChange={(e) => setNomorFaktur(e.target.value)}
                  placeholder="INV-2025-001"
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
              </div>
              <div className="space-y-2">
                <Label>Tanggal Faktur *</Label>
                <Input
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label>Jatuh Tempo *</Label>
                <Input
                  type="date"
                  value={jatuhTempo}
                  onChange={(e) => setJatuhTempo(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {selectedSales && (
              <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm">
                <span className="text-muted-foreground">Cabang: </span>
                <span className="font-medium">{selectedSales.cabang.nama}</span>
              </div>
            )}

            {/* Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base">Detail Item</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddItem}
                  disabled={loading}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Item
                </Button>
              </div>

              <div className="space-y-2">
                {items.map((item, idx) => {
                  const subtotal = item.qty * item.hargaSatuan
                  return (
                    <div
                      key={item.tempId}
                      className="rounded-md border bg-card p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Item #{idx + 1}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => handleRemoveItem(item.tempId)}
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-12">
                        <div className="sm:col-span-5 space-y-1">
                          <Label className="text-xs">Part</Label>
                          <Select
                            value={item.idPart}
                            onValueChange={(v) => handlePartChange(item.tempId, v)}
                          >
                            <SelectTrigger className="h-9">
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
                        </div>
                        <div className="sm:col-span-2 space-y-1">
                          <Label className="text-xs">Qty</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.qty}
                            onChange={(e) =>
                              handleItemChange(item.tempId, {
                                qty: parseInt(e.target.value) || 0,
                              })
                            }
                            className="h-9"
                            disabled={loading}
                          />
                        </div>
                        <div className="sm:col-span-3 space-y-1">
                          <Label className="text-xs">Harga</Label>
                          <Input
                            type="number"
                            min="0"
                            step="100"
                            value={item.hargaSatuan}
                            onChange={(e) =>
                              handleItemChange(item.tempId, {
                                hargaSatuan: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="h-9"
                            disabled={loading}
                          />
                        </div>
                        <div className="sm:col-span-2 space-y-1">
                          <Label className="text-xs">Subtotal</Label>
                          <div className="h-9 flex items-center justify-end px-2 text-sm font-medium bg-muted rounded-md">
                            {formatRupiah(subtotal)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Total */}
            <div className="rounded-md border bg-muted/50 p-3">
              <div className="flex items-center justify-between text-base font-semibold">
                <span>Total Tagihan</span>
                <span className="text-primary text-lg">{formatRupiah(totalTagihan)}</span>
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
              <Button type="submit" disabled={loading || !idSales || !nomorFaktur}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan Faktur'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}