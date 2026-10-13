'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { upsertTargetBulk } from '@/lib/actions/target'
import { formatRupiah, formatNumber } from '@/lib/format'

type Sales = {
  id: number
  kode: string
  nama: string
  idCabang: number
  cabang: { nama: string }
}

type TargetExisting = {
  idSales: number
  targetOmzet: number
}

export function TargetEditor({
  listSales,
  existing,
  periode,
  omzetPerSales,
}: {
  listSales: Sales[]
  existing: TargetExisting[]
  periode: string
  omzetPerSales: { idSales: number; omzet: number; qty: number }[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [filterCabang, setFilterCabang] = useState('all')
  const [filterQ, setFilterQ] = useState('')

  // State: map idSales -> target value (string untuk input)
  const initialValues = useMemo(() => {
    const map: Record<number, string> = {}
    for (const s of listSales) {
      const t = existing.find((e) => e.idSales === s.id)
      map[s.id] = t ? String(t.targetOmzet) : ''
    }
    return map
  }, [listSales, existing])

  const [values, setValues] = useState<Record<number, string>>(initialValues)

  // Deteksi perubahan
  const hasChanges = useMemo(() => {
    for (const s of listSales) {
      const original = initialValues[s.id] ?? ''
      const current = values[s.id] ?? ''
      if (original !== current) return true
    }
    return false
  }, [values, initialValues, listSales])

  const totalTarget = useMemo(() => {
    return Object.values(values).reduce(
      (s, v) => s + (parseFloat(v) || 0),
      0
    )
  }, [values])

  const listCabang = useMemo(() => {
    const map = new Map<number, string>()
    for (const s of listSales) map.set(s.idCabang, s.cabang.nama)
    return [...map.entries()].map(([id, nama]) => ({ id, nama }))
  }, [listSales])

  const filteredSales = useMemo(() => {
    return listSales.filter((s) => {
      const matchCabang = filterCabang === 'all' || s.idCabang === parseInt(filterCabang)
      const matchQ =
        !filterQ ||
        s.kode.toLowerCase().includes(filterQ.toLowerCase()) ||
        s.nama.toLowerCase().includes(filterQ.toLowerCase())
      return matchCabang && matchQ
    })
  }, [listSales, filterCabang, filterQ])

  const handleChange = (idSales: number, val: string) => {
    setValues((prev) => ({ ...prev, [idSales]: val }))
  }

  const handleReset = () => {
    setValues(initialValues)
    toast.info('Perubahan dibatalkan')
  }

  const handleSave = async () => {
    if (!hasChanges) {
      toast.info('Tidak ada perubahan')
      return
    }

    setLoading(true)
    const items = listSales
      .map((s) => ({
        idSales: s.id,
        targetOmzet: parseFloat(values[s.id]) || 0,
      }))
      // Kirim hanya yang berubah (optimasi)
      .filter((item) => {
        const original = initialValues[item.idSales] ?? ''
        const current = values[item.idSales] ?? ''
        return original !== current
      })

    const result = await upsertTargetBulk({
      periode,
      items,
    })

    if (result.error) {
      toast.error(result.error)
      setLoading(false)
      return
    }

    toast.success(`${items.length} target berhasil disimpan`)
    setLoading(false)
    router.refresh()
  }

  const omzetMap = useMemo(() => {
    const map = new Map<number, { omzet: number; qty: number }>()
    for (const o of omzetPerSales) map.set(o.idSales, o)
    return map
  }, [omzetPerSales])

  return (
    <div className="space-y-4">
      {/* Filter & Actions Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            placeholder="Cari sales..."
            value={filterQ}
            onChange={(e) => setFilterQ(e.target.value)}
            className="h-9 sm:w-[200px]"
          />
          <Select value={filterCabang} onValueChange={(v) => setFilterCabang(v ?? 'all')}>
            <SelectTrigger className="h-9 sm:w-[180px]">
              <SelectValue placeholder="Semua Cabang" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Cabang</SelectItem>
              {listCabang.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.nama}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          {hasChanges && (
            <Button variant="outline" size="sm" onClick={handleReset} disabled={loading}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          )}
          <Button size="sm" onClick={handleSave} disabled={loading || !hasChanges}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Simpan {hasChanges ? '(ada perubahan)' : ''}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="flex flex-wrap gap-2 text-sm">
        <div className="rounded-md border bg-muted/50 px-3 py-1.5">
          <span className="text-muted-foreground">Total Target: </span>
          <span className="font-semibold">{formatRupiah(totalTarget)}</span>
        </div>
        <div className="rounded-md border bg-muted/50 px-3 py-1.5">
          <span className="text-muted-foreground">Sales: </span>
          <span className="font-semibold">{filteredSales.length}</span>
        </div>
      </div>

      {/* Table */}
      {filteredSales.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">Tidak ada sales yang cocok</p>
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Kode</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Cabang</TableHead>
                <TableHead className="w-[200px] text-right">Target (Rp)</TableHead>
                <TableHead className="w-[180px] text-right">Omzet</TableHead>
                <TableHead className="w-[100px] text-right">Pencapaian</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.map((s) => {
                const omzetData = omzetMap.get(s.id)
                const omzet = omzetData?.omzet ?? 0
                const target = parseFloat(values[s.id]) || 0
                const persentase = target > 0 ? (omzet / target) * 100 : 0

                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-sm">{s.kode}</TableCell>
                    <TableCell className="font-medium">{s.nama}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {s.cabang.nama}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        step="100000"
                        placeholder="0"
                        value={values[s.id] ?? ''}
                        onChange={(e) => handleChange(s.id, e.target.value)}
                        className="h-8 text-right font-mono text-sm"
                        disabled={loading}
                      />
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {formatRupiah(omzet)}
                    </TableCell>
                    <TableCell className="text-right">
                      {target > 0 ? (
                        <Badge
                          variant={
                            persentase >= 100
                              ? 'default'
                              : persentase >= 75
                              ? 'secondary'
                              : 'outline'
                          }
                          className={
                            persentase >= 100
                              ? 'bg-green-600 hover:bg-green-600'
                              : persentase >= 75
                              ? ''
                              : 'text-red-600 border-red-300'
                          }
                        >
                          {persentase.toFixed(1)}%
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}