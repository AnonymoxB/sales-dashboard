'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { RotateCcw, Loader2, CheckCircle2, AlertTriangle, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { PermissionsMatrix } from './permissions-matrix'
import { RESOURCE_GROUPS } from '@/lib/rbac-resources'
import {
  updateRolePermissions,
  resetRolePermissions,
} from '@/lib/actions/permissions'

type Role = 'ADMIN' | 'MANAGER' | 'SALES'

const ROLE_INFO: Record<Role, { label: string; color: string; description: string }> = {
  ADMIN: {
    label: 'Admin',
    color: 'bg-purple-600 hover:bg-purple-600',
    description: 'Akses penuh ke semua fitur',
  },
  MANAGER: {
    label: 'Manager',
    color: 'bg-blue-600 hover:bg-blue-600',
    description: 'Kelola data & transaksi, tanpa akses admin',
  },
  SALES: {
    label: 'Sales',
    color: 'bg-slate-600 hover:bg-slate-600',
    description: 'Input penjualan & lihat data dasar',
  },
}

export function PermissionsPage({
  initialPermissions,
}: {
  initialPermissions: Record<string, string[]>
}) {
  const router = useRouter()
  const [tab, setTab] = useState<Role>('ADMIN')
  const [permissions, setPermissions] = useState<Record<Role, string[]>>({
    ADMIN: initialPermissions.ADMIN ?? [],
    MANAGER: initialPermissions.MANAGER ?? [],
    SALES: initialPermissions.SALES ?? [],
  })
  const [originalPermissions, setOriginalPermissions] = useState(permissions)
  const [isPending, startTransition] = useTransition()
  const [resetTarget, setResetTarget] = useState<Role | null>(null)

  const hasChanges = useMemo(() => {
    return JSON.stringify(permissions[tab].sort()) !== JSON.stringify(originalPermissions[tab].sort())
  }, [permissions, originalPermissions, tab])

  const togglePermission = (resource: string, enabled: boolean) => {
    setPermissions((prev) => {
      const current = prev[tab]
      const next = enabled
        ? [...current, resource]
        : current.filter((r) => r !== resource)
      return { ...prev, [tab]: next }
    })
  }

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateRolePermissions(tab, permissions[tab])
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`${ROLE_INFO[tab].label}: ${result.count} permission disimpan`)
        setOriginalPermissions(permissions)
        router.refresh()
      }
    })
  }

  const handleReset = () => {
    if (!resetTarget) return
    const roleToReset = resetTarget
    startTransition(async () => {
      const result = await resetRolePermissions(roleToReset)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`${ROLE_INFO[roleToReset].label} direset ke default (${result.count} permission)`)
        setResetTarget(null)
        router.refresh()
        // Refresh from server — biar state konsisten
        window.location.reload()
      }
    })
  }

  const activeCount = permissions[tab].length

  return (
    <div className="space-y-6">
      {/* Warning */}
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <CardTitle className="text-sm">Perhatian</CardTitle>
          </div>
          <CardDescription className="text-amber-900/80 dark:text-amber-200/80 text-xs">
            Perubahan permission langsung berlaku setelah disimpan. Pastikan Anda tidak mengunci diri sendiri dari halaman ini.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Tabs per Role */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as Role)} className="space-y-4">
        <TabsList>
          {(['ADMIN', 'MANAGER', 'SALES'] as Role[]).map((r) => (
            <TabsTrigger key={r} value={r}>
              <Badge className={`${ROLE_INFO[r].color} text-white mr-2`}>
                {ROLE_INFO[r].label}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {permissions[r].length} perm
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {(['ADMIN', 'MANAGER', 'SALES'] as Role[]).map((r) => (
          <TabsContent key={r} value={r} className="space-y-4">
            {/* Header actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-3">
              <div className="flex items-center gap-3">
                <Badge className={`${ROLE_INFO[r].color} text-white`}>
                  {ROLE_INFO[r].label}
                </Badge>
                <div className="text-sm">
                  <p className="font-medium">{activeCount} permission aktif</p>
                  <p className="text-xs text-muted-foreground">
                    {ROLE_INFO[r].description}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setResetTarget(r)}
                  disabled={isPending}
                >
                  <RotateCcw className="mr-2 h-3.5 w-3.5" />
                  Reset Default
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isPending || !hasChanges}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-3.5 w-3.5" />
                      Simpan {hasChanges ? '(ada perubahan)' : ''}
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Matrix */}
            <PermissionsMatrix
              permissions={permissions[r]}
              onToggle={r === tab ? togglePermission : () => {}}
              disabled={isPending || r !== tab}
            />
          </TabsContent>
        ))}
      </Tabs>

      {/* Reset Dialog */}
      <Dialog open={!!resetTarget} onOpenChange={(o) => !o && setResetTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Reset permission?
            </DialogTitle>
            <DialogDescription>
              Permission untuk role{' '}
              <strong>{resetTarget && ROLE_INFO[resetTarget].label}</strong> akan
              direset ke default sistem. Perubahan manual akan hilang.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setResetTarget(null)}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleReset}
              disabled={isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mereset...
                </>
              ) : (
                'Reset'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}