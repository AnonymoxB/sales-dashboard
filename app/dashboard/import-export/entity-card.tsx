'use client'

import { useRef, useState } from 'react'
import {
  Download,
  Upload,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import type { EntityConfig } from '@/lib/import-export/config'

type ImportResult = {
  success: number
  failed: number
  errors: { row: number; message: string }[]
}

export function EntityCard({ config }: { config: EntityConfig }) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  const handleDownload = (mode: 'template' | 'export') => {
    const url = `/api/export?entity=${config.key}&mode=${mode}`
    window.location.href = url
    toast.info(mode === 'template' ? 'Mendownload template...' : 'Mendownload data...')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.name.endsWith('.xlsx') && !f.name.endsWith('.xls')) {
      toast.error('File harus berformat Excel (.xlsx)')
      return
    }
    setFile(f)
    setResult(null)
  }

  const handleUpload = async () => {
    if (!file) {
      toast.error('Pilih file dulu')
      return
    }

    setUploading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('entity', config.key)

      const res = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? 'Gagal import')
        setResult({
          success: data.success ?? 0,
          failed: data.failed ?? 0,
          errors: data.errors ?? [{ row: 0, message: data.error }],
        })
      } else {
        setResult(data)
        if (data.success > 0) {
          toast.success(`${data.success} baris berhasil diimport`)
        }
        if (data.failed > 0) {
          toast.warning(`${data.failed} baris gagal`)
        }
      }
    } catch (e) {
      toast.error('Kesalahan jaringan')
      setResult({
        success: 0,
        failed: 0,
        errors: [{ row: 0, message: (e as Error).message }],
      })
    } finally {
      setUploading(false)
    }
  }

  const handleClear = () => {
    setFile(null)
    setResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-primary shrink-0" />
            <h3 className="font-semibold truncate">{config.label}</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{config.description}</p>
        </div>
        <Badge variant="outline" className="text-[10px] shrink-0">
          {config.columns.length} kolom
        </Badge>
      </div>

      {/* Kolom preview */}
      <div className="flex flex-wrap gap-1">
        {config.columns.map((c) => (
          <Badge
            key={c.key}
            variant={c.required ? 'default' : 'secondary'}
            className="text-[10px] font-normal"
          >
            {c.label}
            {c.required && ' *'}
          </Badge>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleDownload('template')}
        >
          <Download className="mr-2 h-3.5 w-3.5" />
          Template
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleDownload('export')}
        >
          <Download className="mr-2 h-3.5 w-3.5" />
          Export Data
        </Button>
      </div>

      {/* Upload area */}
      <div className="space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          className="hidden"
        />

        {!file ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex w-full flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-muted-foreground/25 px-4 py-6 text-center transition-colors hover:border-primary/50 hover:bg-muted/50 disabled:opacity-50"
          >
            <Upload className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">Pilih file Excel</span>
            <span className="text-[11px] text-muted-foreground">
              atau klik untuk browse
            </span>
          </button>
        ) : (
          <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
            <FileSpreadsheet className="h-4 w-4 text-primary shrink-0" />
            <span className="text-xs truncate flex-1">{file.name}</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleClear}
              disabled={uploading}
              className="h-6 px-2 text-xs"
            >
              Ganti
            </Button>
            <Button
              size="sm"
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Upload...
                </>
              ) : (
                <>
                  <Upload className="mr-1.5 h-3.5 w-3.5" />
                  Upload
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Hasil import */}
      {result && (
        <div className="space-y-2 rounded-md border bg-muted/30 p-3">
          <div className="flex items-center gap-3 text-xs">
            {result.success > 0 && (
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {result.success} sukses
              </span>
            )}
            {result.failed > 0 && (
              <span className="flex items-center gap-1 text-red-600">
                <XCircle className="h-3.5 w-3.5" />
                {result.failed} gagal
              </span>
            )}
            {result.success === 0 && result.failed === 0 && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <AlertCircle className="h-3.5 w-3.5" />
                Tidak ada data
              </span>
            )}
          </div>

          {result.errors.length > 0 && (
            <div className="max-h-[150px] overflow-y-auto space-y-1">
              {result.errors.slice(0, 20).map((err, i) => (
                <div
                  key={i}
                  className="text-[11px] text-red-600 bg-red-50 dark:bg-red-950/30 rounded px-2 py-1"
                >
                  {err.row > 0 && <strong>Baris {err.row}: </strong>}
                  {err.message}
                </div>
              ))}
              {result.errors.length > 20 && (
                <p className="text-[11px] text-muted-foreground text-center">
                  +{result.errors.length - 20} error lainnya
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Note */}
      {config.templateNote && (
        <p className="text-[11px] text-muted-foreground border-t pt-2">
          💡 {config.templateNote}
        </p>
      )}
    </div>
  )
}