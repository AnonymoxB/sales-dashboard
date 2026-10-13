'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Cabang = { id: number; kode: string; nama: string }

export function SalesFilters({ listCabang }: { listCabang: Cabang[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [q, setQ] = useState(searchParams.get('q') ?? '')
  const [cabang, setCabang] = useState(searchParams.get('cabang') ?? 'all')

  useEffect(() => {
    setQ(searchParams.get('q') ?? '')
    setCabang(searchParams.get('cabang') ?? 'all')
  }, [searchParams])

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      const currentQ = params.get('q') ?? ''
      const currentCabang = params.get('cabang') ?? 'all'

      if (q === currentQ && cabang === currentCabang) return

      if (q) params.set('q', q)
      else params.delete('q')

      if (cabang !== 'all') params.set('cabang', cabang)
      else params.delete('cabang')

      params.set('page', '1')
      router.push(`${pathname}?${params.toString()}`)
    }, 300)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, cabang])

  const handleClear = () => {
    setQ('')
    setCabang('all')
    const params = new URLSearchParams(searchParams.toString())
    params.delete('q')
    params.delete('cabang')
    params.set('page', '1')
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative w-full sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Cari kode, nama, atau telepon..."
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

      <Select value={cabang} onValueChange={(v) => setCabang(v ?? 'all')}>
        <SelectTrigger className="w-full sm:w-[200px]">
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
  )
}