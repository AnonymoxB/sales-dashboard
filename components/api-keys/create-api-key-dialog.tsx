'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Copy, Check, AlertTriangle, Key } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createApiKey } from '@/lib/actions/api-key'

export function CreateApiKeyDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [nama, setNama] = useState('')
  const [loading, setLoading] = useState(false)
  const [plaintext, setPlaintext] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const result = await createApiKey(nama)

    if (result.error) {
      toast.error(result.error)
      setLoading(false)
      return
    }

    setPlaintext(result.plaintext!)
    setLoading(false)
  }

  const handleCopy = async () => {
    if (!plaintext) return
    await navigator.clipboard.writeText(plaintext)
    setCopied(true)
    toast.success('API key dicopy ke clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClose = () => {
    setNama('')
    setPlaintext(null)
    setCopied(false)
    onOpenChange(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        {!plaintext ? (
          <>
            <DialogHeader>
              <DialogTitle>Buat API Key Baru</DialogTitle>
              <DialogDescription>
                API key akan ditampilkan sekali. Pastikan langsung disimpan.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nama">Nama Key *</Label>
                <Input
                  id="nama"
                  placeholder="ERP Odoo"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  required
                  disabled={loading}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Contoh: &ldquo;ERP Odoo&rdquo;, &ldquo;Mobile App&rdquo;, &ldquo;Integrasi Zahir&rdquo;
                </p>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                  Batal
                </Button>
                <Button type="submit" disabled={loading || !nama.trim()}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Membuat...
                    </>
                  ) : (
                    <>
                      <Key className="mr-2 h-4 w-4" />
                      Buat API Key
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>API Key Berhasil Dibuat</DialogTitle>
              <DialogDescription>
                Copy key di bawah sekarang. Key tidak akan ditampilkan lagi.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-3 flex gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-900 dark:text-amber-200">
                  Simpan key ini di tempat aman (mis. password manager atau config ERP).
                  Setelah dialog ditutup, key tidak bisa dilihat lagi.
                </p>
              </div>

              <div className="space-y-2">
                <Label>API Key</Label>
                <div className="flex gap-2">
                  <code className="flex-1 rounded-md border bg-muted px-3 py-2 font-mono text-xs break-all">
                    {plaintext}
                  </code>
                  <Button type="button" size="icon" variant="outline" onClick={handleCopy}>
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="rounded-md border bg-muted/50 p-3 space-y-2 text-xs">
                <p className="font-medium">Cara pakai:</p>
                <code className="block rounded bg-background px-2 py-1.5 font-mono break-all">
                  X-API-Key: {plaintext.slice(0, 20)}…
                </code>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleClose} className="w-full">
                Saya sudah simpan key-nya
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}