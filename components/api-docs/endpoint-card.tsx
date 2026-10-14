'use client'

import { useState } from 'react'
import { Copy, Check, Terminal, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'

type FieldSpec = {
  name: string
  required: boolean
  type: string
  note?: string
}

type EndpointCardProps = {
  name: string
  description: string
  endpoint: string
  bodyKey: string
  bodyExample: unknown
  fields: FieldSpec[]
  responseExample: unknown
  baseUrl: string
  notes?: string[]
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
      {copied ? (
        <>
          <Check className="h-3 w-3 mr-1 text-green-500" /> Copied
        </>
      ) : (
        <>
          <Copy className="h-3 w-3 mr-1" /> Copy
        </>
      )}
    </Button>
  )
}

function CodeBlock({ code, language = 'json' }: { code: string; language?: string }) {
  return (
    <div className="relative">
      <pre className="rounded-md bg-slate-950 text-slate-100 text-xs p-3 overflow-x-auto">
        <code>{code}</code>
      </pre>
      <CopyButton text={code} />
      <span className="absolute top-2 left-3 text-[10px] uppercase text-slate-400 font-mono">
        {language}
      </span>
    </div>
  )
}

export function EndpointCard({
  name,
  description,
  endpoint,
  bodyKey,
  bodyExample,
  fields,
  responseExample,
  baseUrl,
  notes,
}: EndpointCardProps) {
  const [showSpec, setShowSpec] = useState(false)
  const [showResponse, setShowResponse] = useState(false)
  const [showCurl, setShowCurl] = useState(false)

  const curlExample = `curl -X POST "${baseUrl}${endpoint}" \\
  -H "X-API-Key: sk_live_xxxxx" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify({ [bodyKey]: bodyExample }, null, 2)}'`

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      {/* Header */}
      <div className="border-b bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className="bg-emerald-600 hover:bg-emerald-600">POST</Badge>
          <code className="text-sm font-mono font-semibold">{endpoint}</code>
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">{description}</p>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4">
        {/* Request Body */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Request Body
            </h4>
            <span className="text-[10px] text-muted-foreground font-mono">
              application/json
            </span>
          </div>
          <CodeBlock
            code={JSON.stringify({ [bodyKey]: bodyExample }, null, 2)}
            language="json"
          />
        </div>

        {/* Notes */}
        {notes && notes.length > 0 && (
          <div className="rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 px-3 py-2">
            <ul className="text-xs text-blue-900 dark:text-blue-200 space-y-1">
              {notes.map((note, i) => (
                <li key={i}>💡 {note}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Expandable: Field Specs */}
        <div>
          <button
            type="button"
            onClick={() => setShowSpec(!showSpec)}
            className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors"
          >
            {showSpec ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            Field Specification
          </button>
          {showSpec && (
            <div className="mt-2 rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-[11px] uppercase">Field</TableHead>
                    <TableHead className="text-[11px] uppercase w-[80px]">Wajib</TableHead>
                    <TableHead className="text-[11px] uppercase w-[80px]">Tipe</TableHead>
                    <TableHead className="text-[11px] uppercase">Keterangan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((f) => (
                    <TableRow key={f.name}>
                      <TableCell className="font-mono text-xs">{f.name}</TableCell>
                      <TableCell>
                        {f.required ? (
                          <Badge variant="destructive" className="text-[10px] h-5">Ya</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{f.type}</TableCell>
                      <TableCell className="text-xs">{f.note ?? ''}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Expandable: Response */}
        <div>
          <button
            type="button"
            onClick={() => setShowResponse(!showResponse)}
            className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors"
          >
            {showResponse ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            Response
          </button>
          {showResponse && (
            <div className="mt-2">
              <CodeBlock code={JSON.stringify(responseExample, null, 2)} language="json" />
            </div>
          )}
        </div>

        {/* Expandable: cURL */}
        <div>
          <button
            type="button"
            onClick={() => setShowCurl(!showCurl)}
            className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors"
          >
            {showCurl ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            <Terminal className="h-3 w-3" />
            cURL Example
          </button>
          {showCurl && (
            <div className="mt-2">
              <CodeBlock code={curlExample} language="bash" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}