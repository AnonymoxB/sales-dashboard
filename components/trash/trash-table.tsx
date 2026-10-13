'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { RotateCcw, Trash2, Loader2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  restoreItem, permanentDelete, restoreAll, emptyTrash, type TrashModel,
} from '@/lib/actions/trash'
import { formatRupiah, formatNumber } from '@/lib/format'

type Column = {
  key: string
  label: string
  format?: 'date' | 'rupiah' | 'number'
}

type Item = Record<string, unknown> & {
  id: number
  deletedAt: string
  source: string
}

export function TrashTable({
  model,
  label,
  columns,
  data,
}: {
  model: TrashModel
  label: string
  columns: Column[]
  data: Item[]
}) {
  const [permanentTarget, setPermanentTarget] = useState<Item | null>(null)
  const [showEmptyAll, setShowEmptyAll] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleRestore = (item: Item) => {
    startTransition(async () => {
      const result = await restoreItem(model, item.id)
      if (result.error) toast.error(result.error)
      else {
        toast.success(`${label} berhasil di-restore`)
        router.refresh()
      }
    })
  }

  const handlePermanentDelete = () => {
    if (!permanentTarget) return
    startTransition(async () => {
      const result = await permanentDelete(model, permanentTarget.id)
      if (result.error) toast.error(result.error)
      else {
        toast.success(`${label} dihapus permanen`)
        router.refresh()
      }
      setPermanentTarget(null)
    })
  }

  const handleRestoreAll = () => {
    startTransition(async () => {
      const result = await restoreAll(model)
      if (result.error) toast.error(result.error)
      else {
        toast.success(`${result.count} ${label.toLowerCase()} di-restore`)
        router.refresh()
      }
    })
  }

  const handleEmptyTrash = () => {
    startTransition(async () => {
      const result = await emptyTrash(model)
      if (result.error) toast.error(result.error)
      else {
        toast.success(`${result.count} ${label.toLowerCase()} dihapus permanen`)
        router.refresh()
      }
      setShowEmptyAll(false)
    })
  }

  const formatValue = (item: Item, col: Column) => {
    const val = item[col.key]
    if (val === null || val === undefined) return '-'
    if (col.format === 'rupiah') return formatRupiah(Number(val))
    if (col.format === 'number') return formatNumber(Number(val))
    if (col.format === 'date') {
      return new Date(String(val)).toLocaleDateString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric',
      })
    }
    return String(val)
  }

  const formatDeletedAt = (iso: string) => {
    const d = new Date(iso)
    const diff = Date.now() - d.getTime()
    const days = Math.floor(diff / 86400000)
    if (days === 0) return 'Hari ini'
    if (days === 1) return 'Kemarin'
    if (days < 30) return `${days} hari lalu`
    const months = Math.floor(days / 30)
    if (months < 12) return `${months} bulan lalu`
    return `${Math.floor(months / 12)} tahun lalu`
  }

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-sm text-muted-foreground">
          Tidak ada {label.toLowerCase()} yang dihapus.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-card p-3">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">{data.length}</strong> {label.toLowerCase()} dihapus
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRestoreAll}
            disabled={isPending}
          >
            <RotateCcw className="mr-2 h-3.5 w-3.5" />
            Restore Semua
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowEmptyAll(true)}
            disabled={isPending}
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Kosongkan
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((c) => (
                <TableHead key={c.key}>{c.label}</TableHead>
              ))}
              <TableHead>Dihapus</TableHead>
              <TableHead>Sumber</TableHead>
              <TableHead className="w-[140px] text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.id}>
                {columns.map((c) => (
                  <TableCell key={c.key} className="text-sm">
                    {formatValue(item, c)}
                  </TableCell>
                ))}
                <TableCell className="text-sm text-muted-foreground">
                  {formatDeletedAt(item.deletedAt)}
                </TableCell>
                <TableCell>
                  <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-muted">
                    {item.source || 'manual'}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => handleRestore(item)}
                      disabled={isPending}
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Restore
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                      onClick={() => setPermanentTarget(item)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Konfirmasi hapus permanen */}
      <AlertDialog open={!!permanentTarget} onOpenChange={(o) => !o && setPermanentTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Hapus permanen?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Data ini akan dihapus <strong>selamanya</strong> dari database. Tidak bisa di-restore lagi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handlePermanentDelete()
              }}
              disabled={isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menghapus...</>
              ) : (
                'Hapus Permanen'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Konfirmasi kosongkan */}
      <AlertDialog open={showEmptyAll} onOpenChange={setShowEmptyAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Kosongkan trash {label}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{data.length}</strong> {label.toLowerCase()} akan dihapus permanen dan tidak bisa di-restore.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleEmptyTrash()
              }}
              disabled={isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menghapus...</>
              ) : (
                'Kosongkan'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}