'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function CabangFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [q, setQ] = useState(searchParams.get('q') ?? '')

  // Sync state kalau URL berubah dari luar
  useEffect(() => {
    setQ(searchParams.get('q') ?? '')
  }, [searchParams])

  // Debounce: update URL setelah user berhenti ngetik 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      const currentQ = params.get('q') ?? ''

      if (q === currentQ) return

      if (q) {
        params.set('q', q)
      } else {
        params.delete('q')
      }
      params.set('page', '1') // Reset ke halaman 1 saat filter berubah
      router.push(`${pathname}?${params.toString()}`)
    }, 300)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  const handleClear = () => {
    setQ('')
    const params = new URLSearchParams(searchParams.toString())
    params.delete('q')
    params.set('page', '1')
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Cari kode, nama, atau wilayah..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9 pr-9"
        />
        {q && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}