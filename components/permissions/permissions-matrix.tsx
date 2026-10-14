'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, XCircle } from 'lucide-react'
import { RESOURCE_GROUPS } from '@/lib/rbac-resources'

export function PermissionsMatrix({
  permissions,
  onToggle,
  disabled,
}: {
  permissions: string[]
  onToggle: (resource: string, enabled: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className="space-y-4">
      {RESOURCE_GROUPS.map((group) => (
        <Card key={group.label}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">{group.label}</CardTitle>
                <CardDescription className="text-xs">
                  {group.resources.length} resource
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {group.resources.map((res) => {
                const checked = permissions.includes(res.key)
                return (
                  <button
                    key={res.key}
                    type="button"
                    onClick={() => !disabled && onToggle(res.key, !checked)}
                    disabled={disabled}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {checked ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-muted-foreground shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{res.label}</p>
                        {res.description && (
                          <p className="text-xs text-muted-foreground truncate">
                            {res.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <code className="text-[10px] font-mono text-muted-foreground hidden md:block">
                        {res.key}
                      </code>
                      <div
                        className={`flex h-5 w-9 items-center rounded-full transition-colors ${
                          checked ? 'bg-emerald-600' : 'bg-muted'
                        }`}
                      >
                        <div
                          className={`h-4 w-4 rounded-full bg-white transition-transform ${
                            checked ? 'translate-x-[18px]' : 'translate-x-0.5'
                          }`}
                        />
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}