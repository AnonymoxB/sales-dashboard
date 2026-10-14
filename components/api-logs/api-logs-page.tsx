'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Search, X, Filter, Activity, AlertTriangle, Clock, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PaginationBar } from '@/components/ui/pagination-bar'
import { ApiLogsTable } from './api-logs-table'

type LogItem = {
  id: string
  apiKeyName: string | null
  endpoint: string
  method: string
  statusCode: number
  created: number
  updated: number
  deleted: number
  skipped: number
  failed: number
  durationMs: number
  ipAddress: string | null
  userAgent: string | null
  errorMsg: string | null
  createdAt: string
}

type Summary = {
  totalRequests24h: number
  failed24h: number
  avgDurationMs: number
  errorRate: number
}

type Props = {
  initialData: LogItem[]
  summary: Summary
  endpoints: string[]
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    pageSize: number
  }
  currentFilters: {
    q: string
    endpoint: string
    status: string
  }
}

export function ApiLogsPage({
  initialData,
  summary,
  endpoints,
  pagination,
  currentFilters,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [q, setQ] = useState(currentFilters.q)
  const [endpoint, setEndpoint] = useState(currentFilters.endpoint || 'all')
  const [status, setStatus] = useState(currentFilters.status || 'all')

  useEffect(() => {
    setQ(currentFilters.q)
    setEndpoint(currentFilters.endpoint || 'all')
    setStatus(currentFilters.status || 'all')
  }, [currentFilters])

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      const currentQ = params.get('q') ?? ''
      const currentEndpoint = params.get('endpoint') ?? ''
      const currentStatus = params.get('status') ?? ''

      const newQ = q.trim()
      const newEndpoint = endpoint === 'all' ? '' : endpoint
      const newStatus = status === 'all' ? '' : status

      if (
        newQ === currentQ &&
        newEndpoint === currentEndpoint &&
        newStatus === currentStatus
      ) {
        return
      }

      if (newQ) params.set('q', newQ)
      else params.delete('q')

      if (newEndpoint) params.set('endpoint', newEndpoint)
      else params.delete('endpoint')

      if (newStatus) params.set('status', newStatus)
      else params.delete('status')

      params.set('page', '1')
      router.push(`${pathname}?${params.toString()}`)
    }, 300)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, endpoint, status])

  const handleClear = () => {
    setQ('')
    setEndpoint('all')
    setStatus('all')
    router.push(pathname)
  }

  const hasFilter = q || endpoint !== 'all' || status !== 'all'

  const errorRateColor =
    summary.errorRate === 0
      ? 'text-green-600'
      : summary.errorRate < 5
      ? 'text-amber-600'
      : 'text-red-600'

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Request (24 jam)</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalRequests24h}</div>
            <p className="text-xs text-muted-foreground">Total pemanggilan API</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${errorRateColor}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${errorRateColor}`}>
              {summary.errorRate.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.failed24h} dari {summary.totalRequests24h} request
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.avgDurationMs} ms</div>
            <p className="text-xs text-muted-foreground">Rata-rata response</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Log</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.totalItems}</div>
            <p className="text-xs text-muted-foreground">Sesuai filter aktif</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Filter</span>
          {hasFilter && (
            <button
              type="button"
              onClick={handleClear}
              className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
              Reset filter
            </button>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative sm:col-span-2 lg:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari API key, IP, atau endpoint..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="h-9 pl-9 pr-9"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <Select value={endpoint} onValueChange={(v) => setEndpoint(v ?? 'all')}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Semua Endpoint" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Endpoint</SelectItem>
              {endpoints.map((e) => (
                <SelectItem key={e} value={e}>
                  {e}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={(v) => setStatus(v ?? 'all')}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="success">Sukses saja</SelectItem>
              <SelectItem value="error">Error saja</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <ApiLogsTable data={initialData} />

      {/* Pagination */}
      <PaginationBar
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalItems={pagination.totalItems}
        pageSize={pagination.pageSize}
      />
    </div>
  )
}