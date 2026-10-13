import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiKey } from '@/lib/api-auth'
import prisma from '@/lib/prisma'

type CustomerInput = {
  kode?: string
  nama?: string
  alamat?: string
  telepon?: string
  aktif?: boolean
}

type UpsertResult = {
  created: number
  updated: number
  failed: number
  errors: { index: number; kode?: string; message: string }[]
}

export async function POST(request: NextRequest) {
  // 1. Auth
  const auth = await authenticateApiKey(request)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  // 2. Parse body
  let body: { customers?: CustomerInput[] } | CustomerInput
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Support single object OR array via { customers: [...] }
  const customers: CustomerInput[] = Array.isArray(body)
    ? body
    : 'customers' in body && Array.isArray(body.customers)
    ? body.customers
    : 'kode' in body
    ? [body as CustomerInput]
    : []

  if (customers.length === 0) {
    return NextResponse.json(
      { error: 'No customers provided. Send array or { customers: [...] }' },
      { status: 400 }
    )
  }

  if (customers.length > 500) {
    return NextResponse.json(
      { error: 'Maximum 500 customers per request. Split into batches.' },
      { status: 400 }
    )
  }

  // 3. Process
  const result: UpsertResult = { created: 0, updated: 0, failed: 0, errors: [] }

  for (let i = 0; i < customers.length; i++) {
    const c = customers[i]

    try {
      const kode = String(c.kode ?? '').trim()
      const nama = String(c.nama ?? '').trim()
      const alamat = String(c.alamat ?? '').trim()
      const telepon = String(c.telepon ?? '').trim()
      const aktif = c.aktif !== false

      if (!kode || !nama) {
        result.errors.push({ index: i, kode, message: 'kode & nama wajib diisi' })
        result.failed++
        continue
      }

      // Cek existing
      const existing = await prisma.customer.findUnique({ where: { kode } })

      await prisma.customer.upsert({
        where: { kode },
        update: { nama, alamat: alamat || null, telepon: telepon || null, aktif },
        create: { kode, nama, alamat: alamat || null, telepon: telepon || null, aktif },
      })

      if (existing) result.updated++
      else result.created++
    } catch (e) {
      result.errors.push({ index: i, kode: c.kode, message: (e as Error).message })
      result.failed++
    }
  }

  return NextResponse.json({
    success: result.failed === 0,
    ...result,
  })
}

// GET: info endpoint
export async function GET(request: NextRequest) {
  const auth = await authenticateApiKey(request)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  const total = await prisma.customer.count()

  return NextResponse.json({
    endpoint: '/api/v1/customers',
    methods: ['POST (upsert)'],
    authenticatedAs: auth.apiKey?.nama,
    totalCustomers: total,
    documentation: {
      post: {
        body: '{ customers: [{ kode, nama, alamat?, telepon?, aktif? }] }',
        maxBatch: 500,
        note: 'Upsert berdasarkan kode. Create kalau belum ada, update kalau sudah ada.',
      },
    },
  })
}