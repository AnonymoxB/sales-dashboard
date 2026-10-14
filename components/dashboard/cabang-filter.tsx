'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Lock } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Cabang = { id: number; kode: string; nama: string }

export function CabangFilter({
  listCabang,
  lockedCabangId,
}: {
  listCabang: Cabang[]
  lockedCabangId?: number
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const current = searchParams.get('cabang') ?? 'all'

  const isLocked = !!lockedCabangId
  const displayedValue = isLocked ? String(lockedCabangId) : current

  const handleChange = (value: string | null) => {
    if (!value || isLocked) return

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
      <span className="text-sm text-muted-foreground hidden sm:inline flex items-center gap-1">
        Cabang:
        {isLocked && <Lock className="h-3 w-3 text-amber-600" />}
      </span>
      <Select value={displayedValue} onValueChange={handleChange} disabled={isLocked}>
        <SelectTrigger className="w-[220px]">
          <SelectValue placeholder="Semua Cabang" />
        </SelectTrigger>
        <SelectContent>
          {!isLocked && <SelectItem value="all">Semua Cabang</SelectItem>}
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