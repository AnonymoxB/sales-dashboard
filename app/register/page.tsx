'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, UserPlus, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function RegisterPage() {
  const [nama, setNama] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    const normalizedEmail = email.trim().toLowerCase()

    try {
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: { nama },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      console.log('signUp result:', { data, error })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      // Kasus 1: session ada → langsung login
      if (data.session) {
        router.push('/dashboard')
        router.refresh()
        return
      }

      // Kasus 2: user dibuat tapi butuh konfirmasi email
      if (data.user && !data.session) {
        setSuccess(
          'Akun berhasil dibuat. Cek email kamu untuk konfirmasi sebelum login.'
        )
        setLoading(false)
        return
      }

      // Kasus 3: fallback
      setError('Terjadi kesalahan tidak terduga. Coba lagi.')
      setLoading(false)
    } catch (err) {
      console.error('Register error:', err)
      setError(err instanceof Error ? err.message : 'Kesalahan jaringan')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <UserPlus className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Buat Akun</CardTitle>
          <CardDescription>
            Daftar untuk mulai menggunakan Sales Dashboard
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:border-green-800 dark:text-green-300 flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="nama">Nama Lengkap</Label>
              <Input
                id="nama"
                type="text"
                placeholder="John Doe"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                required
                disabled={loading || !!success}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@perusahaan.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={loading || !!success}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                disabled={loading || !!success}
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            {!success && (
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Daftar
                  </>
                )}
              </Button>
            )}

            {success && (
              <Link href="/login" className="w-full">
                <Button type="button" variant="outline" className="w-full">
                  Ke Halaman Login
                </Button>
              </Link>
            )}

            <p className="text-center text-sm text-muted-foreground">
              Sudah punya akun?{' '}
              <Link
                href="/login"
                className="font-medium text-primary hover:underline underline-offset-4"
              >
                Masuk di sini
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}