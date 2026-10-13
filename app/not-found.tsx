import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-8xl font-bold tracking-tighter text-primary/40">404</p>
      <h1 className="text-2xl font-bold tracking-tight">
        Halaman tidak ditemukan
      </h1>
      <p className="text-sm text-muted-foreground max-w-sm">
        Halaman yang Anda cari mungkin sudah dipindahkan, dihapus, atau tidak pernah ada.
      </p>
      <Link
        href="/dashboard"
        className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Kembali ke Dashboard
      </Link>
    </div>
  )
}