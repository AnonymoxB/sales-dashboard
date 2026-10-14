'use client'

import { useState } from 'react'
import { Copy, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type Props = {
  name: string
  endpoint: string
  baseUrl: string
  bodyKey: string
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-7 px-2 text-xs absolute top-2 right-2 opacity-70 hover:opacity-100"
      onClick={handleCopy}
    >
      {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
    </Button>
  )
}

export function EndpointGetCard({ name, endpoint, baseUrl, bodyKey }: Props) {
  const [open, setOpen] = useState(false)
  const curl = `curl -X GET "${baseUrl}${endpoint}" \\
  -H "X-API-Key: sk_live_xxxxx"`

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-2.5 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
      >
        <Badge className="bg-blue-600 hover:bg-blue-600">GET</Badge>
        <code className="text-xs font-mono font-semibold flex-1">{endpoint}</code>
        <span className="text-xs text-muted-foreground">{name}</span>
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>
      {open && (
        <div className="p-3 space-y-2">
          <p className="text-xs text-muted-foreground">
            Health check — dapat info jumlah data aktif & soft deleted.
          </p>
          <div className="relative">
            <pre className="rounded-md bg-slate-950 text-slate-100 text-xs p-3 pr-20 overflow-x-auto">
              <code>{curl}</code>
            </pre>
            <CopyButton text={curl} />
            <span className="absolute top-2 left-3 text-[10px] uppercase text-slate-400 font-mono">
              bash
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            Response berisi: <code>endpoint</code>, <code>authenticatedAs</code>, <code>totalActive</code>, <code>totalSoftDeleted</code>, dan <code>body</code> untuk POST <code>{bodyKey}</code>.
          </div>
        </div>
      )}
    </div>
  )
}