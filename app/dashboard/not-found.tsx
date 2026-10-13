import Link from 'next/link'

export default function DashboardNotFound() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="max-w-md text-center space-y-4">
        <p className="text-8xl font-bold leading-none tracking-tighter text-primary/40">
          404
        </p>
        <h1 className="text-xl font-bold tracking-tight">
          Halaman dashboard tidak ditemukan
        </h1>
        <p className="text-sm text-muted-foreground">
          Menu yang Anda tuju tidak tersedia atau sedang dalam pengembangan.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  )
}