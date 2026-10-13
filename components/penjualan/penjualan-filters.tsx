'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Cabang = { id: number; nama: string }
type Sales = { id: number; nama: string; idCabang: number }

export function PenjualanFilters({
  listCabang,
  listSales,
}: {
  listCabang: Cabang[]
  listSales: Sales[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [q, setQ] = useState(searchParams.get('q') ?? '')
  const [cabang, setCabang] = useState(searchParams.get('cabang') ?? 'all')
  const [sales, setSales] = useState(searchParams.get('sales') ?? 'all')
  const [dari, setDari] = useState(searchParams.get('dari') ?? '')
  const [sampai, setSampai] = useState(searchParams.get('sampai') ?? '')

  useEffect(() => {
    setQ(searchParams.get('q') ?? '')
    setCabang(searchParams.get('cabang') ?? 'all')
    setSales(searchParams.get('sales') ?? 'all')
    setDari(searchParams.get('dari') ?? '')
    setSampai(searchParams.get('sampai') ?? '')
  }, [searchParams])

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      const current = {
        q: params.get('q') ?? '',
        cabang: params.get('cabang') ?? 'all',
        sales: params.get('sales') ?? 'all',
        dari: params.get('dari') ?? '',
        sampai: params.get('sampai') ?? '',
      }

      if (
        q === current.q &&
        cabang === current.cabang &&
        sales === current.sales &&
        dari === current.dari &&
        sampai === current.sampai
      )
        return

      if (q) params.set('q', q)
      else params.delete('q')

      if (cabang !== 'all') params.set('cabang', cabang)
      else params.delete('cabang')

      if (sales !== 'all') params.set('sales', sales)
      else params.delete('sales')

      if (dari) params.set('dari', dari)
      else params.delete('dari')

      if (sampai) params.set('sampai', sampai)
      else params.delete('sampai')

      params.set('page', '1')
      router.push(`${pathname}?${params.toString()}`)
    }, 300)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, cabang, sales, dari, sampai])

  const handleClear = () => {
    setQ('')
    setCabang('all')
    setSales('all')
    setDari('')
    setSampai('')
    const params = new URLSearchParams(searchParams.toString())
    ;['q', 'cabang', 'sales', 'dari', 'sampai'].forEach((k) => params.delete(k))
    params.set('page', '1')
    router.push(`${pathname}?${params.toString()}`)
  }

  // Filter sales berdasarkan cabang terpilih
  const salesFiltered =
    cabang === 'all' ? listSales : listSales.filter((s) => s.idCabang === parseInt(cabang))

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Dari Tanggal</Label>
          <Input
            type="date"
            value={dari}
            onChange={(e) => setDari(e.target.value)}
            className="h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Sampai Tanggal</Label>
          <Input
            type="date"
            value={sampai}
            onChange={(e) => setSampai(e.target.value)}
            className="h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Cabang</Label>
          <Select value={cabang} onValueChange={(v) => setCabang(v ?? 'all')}>
            <SelectTrigger className="h-9">
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
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Sales</Label>
          <Select value={sales} onValueChange={(v) => setSales(v ?? 'all')}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Semua Sales" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Sales</SelectItem>
              {salesFiltered.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.nama}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari nama sales atau part..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9 pr-9"
          />
          {q && (
            <button
              onClick={() => setQ('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <button
          onClick={handleClear}
          className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
          type="button"
        >
          Reset filter
        </button>
      </div>
    </div>
  )
}