'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Trash2, Loader2, Power, PowerOff } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { deleteApiKey, toggleApiKey } from '@/lib/actions/api-key'

type ApiKeyItem = {
  id: number
  nama: string
  prefix: string
  aktif: boolean
  lastUsedAt: string | null
  createdAt: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatRelative(iso: string | null) {
  if (!iso) return 'Belum pernah'
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Hari ini'
  if (days === 1) return 'Kemarin'
  if (days < 30) return `${days} hari lalu`
  const months = Math.floor(days / 30)
  return `${months} bulan lalu`
}

export function ApiKeyTable({ data }: { data: ApiKeyItem[] }) {
  const [deleteTarget, setDeleteTarget] = useState<ApiKeyItem | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleDelete = () => {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await deleteApiKey(deleteTarget.id)
      if (result.error) toast.error(result.error)
      else {
        toast.success('API key dihapus')
        router.refresh()
      }
      setDeleteTarget(null)
    })
  }

  const handleToggle = (item: ApiKeyItem) => {
    startTransition(async () => {
      const result = await toggleApiKey(item.id, !item.aktif)
      if (result.error) toast.error(result.error)
      else {
        toast.success(item.aktif ? 'API key dinonaktifkan' : 'API key diaktifkan')
        router.refresh()
      }
    })
  }

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-sm text-muted-foreground">
          Belum ada API key. Klik &quot;Buat API Key&quot; untuk memulai.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Prefix</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Terakhir Dipakai</TableHead>
              <TableHead>Dibuat</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.nama}</TableCell>
                <TableCell>
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                    {item.prefix}…
                  </code>
                </TableCell>
                <TableCell>
                  <Badge variant={item.aktif ? 'default' : 'secondary'}>
                    {item.aktif ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatRelative(item.lastUsedAt)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(item.createdAt)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={<Button variant="ghost" size="icon" className="h-8 w-8" />}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault()
                          handleToggle(item)
                        }}
                        disabled={isPending}
                      >
                        {item.aktif ? (
                          <>
                            <PowerOff className="mr-2 h-4 w-4" />
                            Nonaktifkan
                          </>
                        ) : (
                          <>
                            <Power className="mr-2 h-4 w-4" />
                            Aktifkan
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault()
                          setDeleteTarget(item)
                        }}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Hapus
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus API key?</AlertDialogTitle>
            <AlertDialogDescription>
              API key <strong>{deleteTarget?.nama}</strong> akan dihapus permanen. Sistem
              eksternal yang memakai key ini akan langsung kehilangan akses.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                'Hapus'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}