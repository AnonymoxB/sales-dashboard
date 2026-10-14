'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  MoreHorizontal, CheckCircle2, XCircle, Trash2, Loader2,
  Shield, ShieldCheck, User as UserIcon, Pencil,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  approveUser, rejectUser, changeUserRole, deleteUser, updateUser,
} from '@/lib/actions/users'

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

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function StatusBadge({ status }: { status: UserItem['status'] }) {
  if (status === 'APPROVED') {
    return <Badge className="bg-emerald-600 hover:bg-emerald-600">Approved</Badge>
  }
  if (status === 'REJECTED') {
    return <Badge variant="destructive">Rejected</Badge>
  }
  return <Badge className="bg-amber-600 hover:bg-amber-600">Pending</Badge>
}

function RoleBadge({ role }: { role: UserItem['role'] }) {
  if (role === 'ADMIN') {
    return (
      <Badge className="bg-purple-600 hover:bg-purple-600">
        <ShieldCheck className="mr-1 h-3 w-3" />
        Admin
      </Badge>
    )
  }
  if (role === 'MANAGER') {
    return (
      <Badge className="bg-blue-600 hover:bg-blue-600">
        <Shield className="mr-1 h-3 w-3" />
        Manager
      </Badge>
    )
  }
  return (
    <Badge variant="secondary">
      <UserIcon className="mr-1 h-3 w-3" />
      Sales
    </Badge>
  )
}

export function UsersTable({
  data,
  listCabang,
}: {
  data: UserItem[]
  listCabang: Cabang[]
}) {
  const [editTarget, setEditTarget] = useState<UserItem | null>(null)
  const [rejectTarget, setRejectTarget] = useState<UserItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<UserItem | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [editNama, setEditNama] = useState('')
  const [editIdCabang, setEditIdCabang] = useState<string>('none')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const openEdit = (u: UserItem) => {
    setEditTarget(u)
    setEditNama(u.nama ?? '')
    setEditIdCabang(u.idCabang ? String(u.idCabang) : 'none')
  }

  const handleSaveEdit = () => {
    if (!editTarget) return
    startTransition(async () => {
      const result = await updateUser(editTarget.id, {
        nama: editNama,
        idCabang: editIdCabang === 'none' ? null : parseInt(editIdCabang),
      })
      if (result.error) toast.error(result.error)
      else {
        toast.success('User diubah')
        setEditTarget(null)
        router.refresh()
      }
    })
  }

  const handleApprove = (u: UserItem) => {
    startTransition(async () => {
      const result = await approveUser(u.id)
      if (result.error) toast.error(result.error)
      else {
        toast.success(`${u.nama || u.email} disetujui`)
        router.refresh()
      }
    })
  }

  const handleReject = () => {
    if (!rejectTarget) return
    startTransition(async () => {
      const result = await rejectUser(rejectTarget.id, rejectReason)
      if (result.error) toast.error(result.error)
      else {
        toast.success(`${rejectTarget.nama || rejectTarget.email} ditolak`)
        setRejectTarget(null)
        setRejectReason('')
        router.refresh()
      }
    })
  }

  const handleChangeRole = (u: UserItem, role: 'ADMIN' | 'MANAGER' | 'SALES') => {
    startTransition(async () => {
      const result = await changeUserRole(u.id, role)
      if (result.error) toast.error(result.error)
      else {
        toast.success(`Role ${u.email} diubah ke ${role}`)
        router.refresh()
      }
    })
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await deleteUser(deleteTarget.id)
      if (result.error) toast.error(result.error)
      else {
        toast.success(`${deleteTarget.email} dihapus`)
        setDeleteTarget(null)
        router.refresh()
      }
    })
  }

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-sm text-muted-foreground">
          Tidak ada user yang cocok dengan filter.
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
                <TableHead>User</TableHead>
                <TableHead className="w-[120px]">Role</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead>Cabang</TableHead>
                <TableHead className="w-[150px]">Didaftarkan</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {u.nama || '(tanpa nama)'}
                        {u.isMe && (
                          <Badge variant="outline" className="ml-2 text-[10px]">
                            Anda
                          </Badge>
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {u.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <RoleBadge role={u.role} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={u.status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {u.cabang ? u.cabang.nama : '—'}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDateTime(u.createdAt)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={<Button variant="ghost" size="icon" className="h-8 w-8" />}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={(e) => { e.preventDefault(); openEdit(u) }}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <div className="my-1 h-px bg-border" />

                        {u.status === 'PENDING' && (
                          <>
                            <DropdownMenuItem
                              onClick={(e) => { e.preventDefault(); handleApprove(u) }}
                              disabled={isPending}
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => { e.preventDefault(); setRejectTarget(u) }}
                              disabled={isPending}
                              className="text-destructive focus:text-destructive"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Reject
                            </DropdownMenuItem>
                            <div className="my-1 h-px bg-border" />
                          </>
                        )}

                        {u.status === 'REJECTED' && (
                          <>
                            <DropdownMenuItem
                              onClick={(e) => { e.preventDefault(); handleApprove(u) }}
                              disabled={isPending}
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" />
                              Approve ulang
                            </DropdownMenuItem>
                            <div className="my-1 h-px bg-border" />
                          </>
                        )}

                        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                          Ubah Role
                        </div>
                        <DropdownMenuItem
                          onClick={(e) => { e.preventDefault(); handleChangeRole(u, 'ADMIN') }}
                          disabled={isPending || u.role === 'ADMIN' || u.isMe}
                        >
                          <ShieldCheck className="mr-2 h-4 w-4 text-purple-600" />
                          Admin
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => { e.preventDefault(); handleChangeRole(u, 'MANAGER') }}
                          disabled={isPending || u.role === 'MANAGER' || u.isMe}
                        >
                          <Shield className="mr-2 h-4 w-4 text-blue-600" />
                          Manager
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => { e.preventDefault(); handleChangeRole(u, 'SALES') }}
                          disabled={isPending || u.role === 'SALES' || u.isMe}
                        >
                          <UserIcon className="mr-2 h-4 w-4" />
                          Sales
                        </DropdownMenuItem>

                        <div className="my-1 h-px bg-border" />
                        <DropdownMenuItem
                          onClick={(e) => { e.preventDefault(); setDeleteTarget(u) }}
                          disabled={isPending || u.isMe}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Hapus User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* EDIT DIALOG — render di luar dropdown */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Ubah nama & cabang user</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={editTarget?.email ?? ''} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">Email tidak bisa diubah</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-nama">Nama</Label>
              <Input
                id="edit-nama"
                value={editNama}
                onChange={(e) => setEditNama(e.target.value)}
                placeholder="Nama lengkap"
                disabled={isPending}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Cabang</Label>
              <select
                value={editIdCabang}
                onChange={(e) => setEditIdCabang(e.target.value)}
                disabled={isPending}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="none">— Tanpa Cabang —</option>
                {listCabang.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.kode} — {c.nama}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditTarget(null)}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button type="button" onClick={handleSaveEdit} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={(o) => { if (!o) { setRejectTarget(null); setRejectReason('') } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tolak user?</DialogTitle>
            <DialogDescription>
              User <strong>{rejectTarget?.nama || rejectTarget?.email}</strong> akan ditolak.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reason">Alasan (opsional)</Label>
            <Input
              id="reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Contoh: Bukan karyawan Fuboru"
              disabled={isPending}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => { setRejectTarget(null); setRejectReason('') }}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleReject}
              disabled={isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menolak...</> : 'Tolak'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Hapus user?</DialogTitle>
            <DialogDescription>
              User <strong>{deleteTarget?.email}</strong> akan dihapus dari database.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menghapus...</> : 'Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}