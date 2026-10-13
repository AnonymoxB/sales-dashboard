'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { refreshDashboardMV } from '@/lib/actions/refresh-mv'

export function RefreshButton() {
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleRefresh = () => {
    startTransition(async () => {
      setLoading(true)
      const result = await refreshDashboardMV()
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Data dashboard berhasil di-refresh')
        router.refresh()
      }
      setLoading(false)
    })
  }

  const isBusy = loading || isPending

  return (
    <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isBusy}>
      <RefreshCw className={`mr-2 h-4 w-4 ${isBusy ? 'animate-spin' : ''}`} />
      {isBusy ? 'Refreshing...' : 'Refresh'}
    </Button>
  )
}