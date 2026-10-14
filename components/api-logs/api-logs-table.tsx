'use client'

import { useState } from 'react'
import { Eye, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'

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

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Baru saja'
  if (minutes < 60) return `${minutes} menit lalu`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} jam lalu`
  const days = Math.floor(hours / 24)
  return `${days} hari lalu`
}

function getStatusBadge(log: LogItem) {
  if (log.statusCode >= 500) return <Badge variant="destructive">500</Badge>
  if (log.statusCode === 429) return <Badge className="bg-amber-600 hover:bg-amber-600">429</Badge>
  if (log.statusCode >= 400) return <Badge variant="destructive">{log.statusCode}</Badge>
  if (log.failed > 0) return <Badge className="bg-amber-600 hover:bg-amber-600">Partial</Badge>
  return <Badge className="bg-emerald-600 hover:bg-emerald-600">200</Badge>
}

export function ApiLogsTable({ data }: { data: LogItem[] }) {
  const [detail, setDetail] = useState<LogItem | null>(null)

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-sm text-muted-foreground">
          Tidak ada log yang cocok dengan filter.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-[150px]">Waktu</TableHead>
                <TableHead className="w-[140px]">API Key</TableHead>
                <TableHead className="w-[180px]">Endpoint</TableHead>
                <TableHead className="w-[80px]">Status</TableHead>
                <TableHead className="w-[80px] text-right">Duration</TableHead>
                <TableHead className="text-right">Created</TableHead>
                <TableHead className="text-right">Updated</TableHead>
                <TableHead className="text-right">Failed</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs">
                    <div className="font-medium">{formatRelative(log.createdAt)}</div>
                    <div className="text-muted-foreground text-[10px]">
                      {formatDateTime(log.createdAt)}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">
                    {log.apiKeyName ? (
                      <span className="font-medium">{log.apiKeyName}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[10px] h-5 font-mono">
                        {log.method}
                      </Badge>
                      <code className="font-mono text-[11px] truncate">{log.endpoint}</code>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(log)}</TableCell>
                  <TableCell className="text-right text-xs">
                    <span
                      className={
                        log.durationMs > 3000
                          ? 'text-red-600 font-medium'
                          : log.durationMs > 1000
                          ? 'text-amber-600'
                          : 'text-muted-foreground'
                      }
                    >
                      {log.durationMs} ms
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-xs">
                    {log.created > 0 ? (
                      <span className="text-emerald-600 font-medium">{log.created}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-xs">
                    {log.updated > 0 ? (
                      <span className="text-blue-600 font-medium">{log.updated}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-xs">
                    {log.failed > 0 ? (
                      <span className="text-red-600 font-medium">{log.failed}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setDetail(log)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Detail Modal */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Detail Log
            </DialogTitle>
            <DialogDescription>{detail && formatDateTime(detail.createdAt)}</DialogDescription>
          </DialogHeader>

          {detail && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <DetailRow label="API Key" value={detail.apiKeyName ?? '—'} />
                <DetailRow label="Method" value={detail.method} mono />
                <DetailRow label="Endpoint" value={detail.endpoint} mono full />
                <DetailRow label="Status Code" value={String(detail.statusCode)} />
                <DetailRow label="Duration" value={`${detail.durationMs} ms`} />
                <DetailRow label="IP Address" value={detail.ipAddress ?? '—'} mono />
              </div>

              {detail.userAgent && (
                <DetailRow label="User Agent" value={detail.userAgent} full small />
              )}

              <div className="border-t pt-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                  Hasil Proses
                </p>
                <div className="grid grid-cols-5 gap-2 text-center">
                  <ResultBox label="Created" value={detail.created} color="text-emerald-600" />
                  <ResultBox label="Updated" value={detail.updated} color="text-blue-600" />
                  <ResultBox label="Deleted" value={detail.deleted} color="text-amber-600" />
                  <ResultBox label="Skipped" value={detail.skipped} color="text-muted-foreground" />
                  <ResultBox label="Failed" value={detail.failed} color="text-red-600" />
                </div>
              </div>

              {detail.errorMsg && (
                <div className="rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-red-900 dark:text-red-200">
                        Error Message
                      </p>
                      <p className="text-xs text-red-800 dark:text-red-300 mt-1">
                        {detail.errorMsg}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {detail.failed === 0 && !detail.errorMsg && (
                <div className="rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 p-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <p className="text-xs text-emerald-900 dark:text-emerald-200">
                    Request berhasil tanpa error
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" onClick={() => setDetail(null)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function DetailRow({
  label,
  value,
  mono = false,
  full = false,
  small = false,
}: {
  label: string
  value: string
  mono?: boolean
  full?: boolean
  small?: boolean
}) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={`${mono ? 'font-mono' : ''} ${
          small ? 'text-[11px]' : 'text-sm'
        } break-all`}
      >
        {value}
      </p>
    </div>
  )
}

function ResultBox({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: string
}) {
  return (
    <div className="rounded-md border bg-muted/30 py-2">
      <p className={`text-lg font-bold ${value > 0 ? color : 'text-muted-foreground/50'}`}>
        {value}
      </p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
    </div>
  )
}