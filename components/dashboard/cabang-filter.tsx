'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Cabang = { id: number; kode: string; nama: string }

export function CabangFilter({ listCabang }: { listCabang: Cabang[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const current = searchParams.get('cabang') ?? 'all'

  const handleChange = (value: string | null) => {
    if (!value) return

    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all') {
      params.delete('cabang')
    } else {
      params.set('cabang', value)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground hidden sm:inline">Cabang:</span>
      <Select value={current} onValueChange={handleChange}>
        <SelectTrigger className="w-[220px]">
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