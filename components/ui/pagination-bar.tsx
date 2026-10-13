'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

type PaginationBarProps = {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
}

function getPageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages: (number | 'ellipsis')[] = []
  const showLeft = current > 4
  const showRight = current < total - 3

  pages.push(1)

  if (showLeft) {
    if (current > 5) pages.push('ellipsis')
    // Tampilkan 2 angka sebelum current
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      pages.push(i)
    }
  } else {
    for (let i = 2; i <= Math.min(total - 1, 5); i++) {
      pages.push(i)
    }
  }

  if (showRight) {
    if (current < total - 4) pages.push('ellipsis')
    // Tampilkan 2 angka sesudah current
    if (current >= total - 3) {
      for (let i = total - 4; i <= total - 1; i++) {
        if (i > 1 && !pages.includes(i)) pages.push(i)
      }
    }
  } else {
    for (let i = Math.max(2, total - 4); i <= total - 1; i++) {
      if (!pages.includes(i)) pages.push(i)
    }
  }

  pages.push(total)

  // Dedup & sort
  const numeric = pages.filter((p): p is number => typeof p === 'number')
  const unique = Array.from(new Set(numeric)).sort((a, b) => a - b)

  // Sisipkan ellipsis jika gap
  const result: (number | 'ellipsis')[] = []
  for (let i = 0; i < unique.length; i++) {
    if (i > 0 && unique[i] - unique[i - 1] > 1) {
      result.push('ellipsis')
    }
    result.push(unique[i])
  }

  return result
}

export function PaginationBar({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
}: PaginationBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  if (totalPages <= 1) return null

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(page))
    router.push(`${pathname}?${params.toString()}`)
  }

  const from = (currentPage - 1) * pageSize + 1
  const to = Math.min(currentPage * pageSize, totalItems)
  const pageNumbers = getPageNumbers(currentPage, totalPages)

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Menampilkan <span className="font-medium">{from}</span>–
        <span className="font-medium">{to}</span> dari{' '}
        <span className="font-medium">{totalItems}</span> data
      </p>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={currentPage <= 1}
          onClick={() => goToPage(currentPage - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {pageNumbers.map((p, i) =>
          p === 'ellipsis' ? (
            <span key={`e-${i}`} className="px-2 text-sm text-muted-foreground">
              …
            </span>
          ) : (
            <Button
              key={p}
              variant={p === currentPage ? 'default' : 'outline'}
              size="icon"
              className="h-8 w-8 text-xs"
              onClick={() => goToPage(p)}
            >
              {p}
            </Button>
          )
        )}

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={currentPage >= totalPages}
          onClick={() => goToPage(currentPage + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}