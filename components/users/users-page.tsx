'use client'

import { useMemo, useState } from 'react'
import { Search, X, Users, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { UsersTable } from './users-table'

type UserItem = {
  id: string
  email: string
  nama: string | null
  role: 'ADMIN' | 'MANAGER' | 'SALES'
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  idCabang: number | null
  cabang: { id: number; kode: string; nama: string } | null
  approvedAt: string | null
  rejectedAt: string | null
  rejectReason: string | null
  createdAt: string
  isMe: boolean
}

type Cabang = { id: number; kode: string; nama: string }

export function UsersPage({
  initialData,
  listCabang,
}: {
  initialData: UserItem[]
  listCabang: Cabang[]
}) {
  const [q, setQ] = useState('')
  const [tab, setTab] = useState('all')

  const counts = useMemo(() => ({
    all: initialData.length,
    pending: initialData.filter((u) => u.status === 'PENDING').length,
    approved: initialData.filter((u) => u.status === 'APPROVED').length,
    rejected: initialData.filter((u) => u.status === 'REJECTED').length,
  }), [initialData])

  const filtered = useMemo(() => {
    return initialData.filter((u) => {
      if (tab !== 'all' && u.status !== tab.toUpperCase()) return false
      if (q) {
        const query = q.toLowerCase()
        return (
          u.email.toLowerCase().includes(query) ||
          (u.nama ?? '').toLowerCase().includes(query)
        )
      }
      return true
    })
  }, [initialData, tab, q])

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total User</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.all}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{counts.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{counts.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{counts.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter + Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <Tabs value={tab} onValueChange={setTab} className="w-full sm:w-auto">
          <TabsList>
            <TabsTrigger value="all">Semua ({counts.all})</TabsTrigger>
            <TabsTrigger value="pending">
              Pending {counts.pending > 0 && (
                <span className="ml-1 rounded-full bg-amber-500 text-white text-[10px] px-1.5">
                  {counts.pending}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:max-w-xs sm:ml-auto">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari email atau nama..."
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
      </div>

      {/* Table */}
      <UsersTable data={filtered} listCabang={listCabang} />
    </div>
  )
}