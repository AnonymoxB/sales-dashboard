import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { requireAction } from '@/lib/rbac'
import { ENTITIES, type EntityKey } from '@/lib/import-export/config'
import { parseExcel } from '@/lib/import-export/excel'

export const maxDuration = 60

type ImportResult = {
  success: number
  failed: number
  errors: { row: number; message: string }[]
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // 🛡️ Cek permission
  try {
    await requireAction('admin.import')
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 403 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const entity = formData.get('entity') as EntityKey | null

  if (!file || !entity || !ENTITIES[entity]) {
    return NextResponse.json({ error: 'File atau entity tidak valid' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  let rows: Record<string, unknown>[]
  try {
    rows = parseExcel(buffer)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 })
  }

  const result: ImportResult = { success: 0, failed: 0, errors: [] }

  try {
    switch (entity) {
      // ============================================
      // MASTER DATA
      // ============================================
      case 'cabang': {
        for (let i = 0; i < rows.length; i++) {
          const r = rows[i]
          const rowNum = i + 4
          try {
            const kode = String(r['Kode'] ?? '').trim()
            const nama = String(r['Nama'] ?? '').trim()
            const wilayah = String(r['Wilayah'] ?? '').trim()
            const alamat = String(r['Alamat'] ?? '').trim()

            if (!kode || !nama) {
              result.errors.push({ row: rowNum, message: 'Kode & Nama wajib' })
              result.failed++; continue
            }
            await prisma.cabang.upsert({
              where: { kode },
              update: { nama, wilayah: wilayah || null, alamat: alamat || null },
              create: { kode, nama, wilayah: wilayah || null, alamat: alamat || null },
            })
            result.success++
          } catch (e) {
            result.errors.push({ row: rowNum, message: (e as Error).message })
            result.failed++
          }
        }
        break
      }

      case 'sales': {
        const cabangs = await prisma.cabang.findMany({ select: { id: true, kode: true } })
        const cabangMap = new Map(cabangs.map((c) => [c.kode, c.id]))

        for (let i = 0; i < rows.length; i++) {
          const r = rows[i]
          const rowNum = i + 4
          try {
            const kode = String(r['Kode'] ?? '').trim()
            const nama = String(r['Nama'] ?? '').trim()
            const kodeCabang = String(r['Kode Cabang'] ?? '').trim()
            const telepon = String(r['Telepon'] ?? '').trim()
            const aktifRaw = String(r['Aktif (true/false)'] ?? 'true').trim().toLowerCase()
            const aktif = aktifRaw === 'true' || aktifRaw === '1'

            if (!kode || !nama || !kodeCabang) {
              result.errors.push({ row: rowNum, message: 'Kode, Nama, Kode Cabang wajib diisi' })
              result.failed++; continue
            }
            const idCabang = cabangMap.get(kodeCabang)
            if (!idCabang) {
              result.errors.push({ row: rowNum, message: `Cabang "${kodeCabang}" tidak ditemukan` })
              result.failed++; continue
            }

            await prisma.sales.upsert({
              where: { kode },
              update: { nama, idCabang, telepon: telepon || null, aktif },
              create: { kode, nama, idCabang, telepon: telepon || null, aktif },
            })
            result.success++
          } catch (e) {
            result.errors.push({ row: rowNum, message: (e as Error).message })
            result.failed++
          }
        }
        break
      }

      case 'customer': {
        for (let i = 0; i < rows.length; i++) {
          const r = rows[i]
          const rowNum = i + 4
          try {
            const kode = String(r['Kode'] ?? '').trim()
            const nama = String(r['Nama'] ?? '').trim()
            const alamat = String(r['Alamat'] ?? '').trim()
            const telepon = String(r['Telepon'] ?? '').trim()
            const aktifRaw = String(r['Aktif (true/false)'] ?? 'true').trim().toLowerCase()
            const aktif = aktifRaw === 'true' || aktifRaw === '1'

            if (!kode || !nama) {
              result.errors.push({ row: rowNum, message: 'Kode & Nama wajib' })
              result.failed++; continue
            }

            await prisma.customer.upsert({
              where: { kode },
              update: { nama, alamat: alamat || null, telepon: telepon || null, aktif },
              create: { kode, nama, alamat: alamat || null, telepon: telepon || null, aktif },
            })
            result.success++
          } catch (e) {
            result.errors.push({ row: rowNum, message: (e as Error).message })
            result.failed++
          }
        }
        break
      }

      case 'merk': {
        for (let i = 0; i < rows.length; i++) {
          const r = rows[i]
          const rowNum = i + 4
          try {
            const kode = String(r['Kode'] ?? '').trim()
            const nama = String(r['Nama'] ?? '').trim()
            if (!kode || !nama) {
              result.errors.push({ row: rowNum, message: 'Kode & Nama wajib' })
              result.failed++; continue
            }
            await prisma.merk.upsert({
              where: { kode },
              update: { nama },
              create: { kode, nama },
            })
            result.success++
          } catch (e) {
            result.errors.push({ row: rowNum, message: (e as Error).message })
            result.failed++
          }
        }
        break
      }

      case 'jenis': {
        for (let i = 0; i < rows.length; i++) {
          const r = rows[i]
          const rowNum = i + 4
          try {
            const kode = String(r['Kode'] ?? '').trim()
            const nama = String(r['Nama'] ?? '').trim()
            if (!kode || !nama) {
              result.errors.push({ row: rowNum, message: 'Kode & Nama wajib' })
              result.failed++; continue
            }
            await prisma.jenis.upsert({
              where: { kode },
              update: { nama },
              create: { kode, nama },
            })
            result.success++
          } catch (e) {
            result.errors.push({ row: rowNum, message: (e as Error).message })
            result.failed++
          }
        }
        break
      }

      case 'bahan': {
        const [merks, jenises] = await Promise.all([
          prisma.merk.findMany({ select: { id: true, kode: true } }),
          prisma.jenis.findMany({ select: { id: true, kode: true } }),
        ])
        const merkMap = new Map(merks.map((m) => [m.kode, m.id]))
        const jenisMap = new Map(jenises.map((j) => [j.kode, j.id]))

        for (let i = 0; i < rows.length; i++) {
          const r = rows[i]
          const rowNum = i + 4
          try {
            const kode = String(r['Kode'] ?? '').trim()
            const nama = String(r['Nama'] ?? '').trim()
            const kodeMerk = String(r['Kode Merk'] ?? '').trim()
            const kodeJenis = String(r['Kode Jenis'] ?? '').trim()

            if (!kode || !nama || !kodeMerk || !kodeJenis) {
              result.errors.push({ row: rowNum, message: 'Kode, Nama, Merk, Jenis wajib' })
              result.failed++; continue
            }
            const idMerk = merkMap.get(kodeMerk)
            if (!idMerk) { result.errors.push({ row: rowNum, message: `Merk "${kodeMerk}" tidak ditemukan` }); result.failed++; continue }
            const idJenis = jenisMap.get(kodeJenis)
            if (!idJenis) { result.errors.push({ row: rowNum, message: `Jenis "${kodeJenis}" tidak ditemukan` }); result.failed++; continue }

            await prisma.bahan.upsert({
              where: { kode },
              update: { nama, idMerk, idJenis },
              create: { kode, nama, idMerk, idJenis },
            })
            result.success++
          } catch (e) {
            result.errors.push({ row: rowNum, message: (e as Error).message })
            result.failed++
          }
        }
        break
      }

      case 'part': {
        const bahans = await prisma.bahan.findMany({ select: { id: true, kode: true } })
        const bahanMap = new Map(bahans.map((b) => [b.kode, b.id]))

        for (let i = 0; i < rows.length; i++) {
          const r = rows[i]
          const rowNum = i + 4
          try {
            const kode = String(r['Kode'] ?? '').trim()
            const nama = String(r['Nama'] ?? '').trim()
            const kodeBahan = String(r['Kode Bahan'] ?? '').trim()
            const satuan = String(r['Satuan'] ?? 'PCS').trim() || 'PCS'
            const hargaJual = Number(r['Harga Jual'] ?? 0)
            const hargaBeliRaw = String(r['Harga Beli'] ?? '').trim()
            const hargaBeli = hargaBeliRaw ? Number(hargaBeliRaw) : null
            const aktifRaw = String(r['Aktif (true/false)'] ?? 'true').trim().toLowerCase()
            const aktif = aktifRaw === 'true' || aktifRaw === '1'

            if (!kode || !nama || !kodeBahan) {
              result.errors.push({ row: rowNum, message: 'Kode, Nama, Kode Bahan wajib' })
              result.failed++; continue
            }
            const idBahan = bahanMap.get(kodeBahan)
            if (!idBahan) { result.errors.push({ row: rowNum, message: `Bahan "${kodeBahan}" tidak ditemukan` }); result.failed++; continue }
            if (hargaJual < 0) { result.errors.push({ row: rowNum, message: 'Harga jual tidak valid' }); result.failed++; continue }

            await prisma.part.upsert({
              where: { kode },
              update: { nama, idBahan, satuan, hargaJual, hargaBeli, aktif },
              create: { kode, nama, idBahan, satuan, hargaJual, hargaBeli, aktif },
            })
            result.success++
          } catch (e) {
            result.errors.push({ row: rowNum, message: (e as Error).message })
            result.failed++
          }
        }
        break
      }

      // ============================================
      // TRANSAKSI
      // ============================================
      case 'penjualan': {
        const [sales, parts, customers] = await Promise.all([
          prisma.sales.findMany({ select: { id: true, kode: true, idCabang: true } }),
          prisma.part.findMany({ select: { id: true, kode: true } }),
          prisma.customer.findMany({ select: { id: true, kode: true } }),
        ])
        const salesMap = new Map(sales.map((s) => [s.kode, s]))
        const partMap = new Map(parts.map((p) => [p.kode, p.id]))
        const custMap = new Map(customers.map((c) => [c.kode, c.id]))

        const batch: {
          tanggal: Date
          idSales: number
          idPart: number
          idCabang: number
          idCustomer: number | null
          qty: number
          bonus: number
          hargaSatuan: number
          diskon: number
          totalOmzet: number
        }[] = []

        for (let i = 0; i < rows.length; i++) {
          const r = rows[i]
          const rowNum = i + 4
          try {
            const tanggal = new Date(String(r['Tanggal'] ?? ''))
            const kodeSales = String(r['Kode Sales'] ?? '').trim()
            const kodePart = String(r['Kode Part'] ?? '').trim()
            const kodeCustomer = String(r['Kode Customer'] ?? '').trim()
            const qty = Number(r['Qty'] ?? 0)
            const bonus = Number(r['Bonus'] ?? 0)
            const hargaSatuan = Number(r['Harga Satuan'] ?? 0)
            const diskon = Number(r['Diskon'] ?? 0)

            if (isNaN(tanggal.getTime())) { result.errors.push({ row: rowNum, message: 'Tanggal tidak valid' }); result.failed++; continue }
            const s = salesMap.get(kodeSales)
            if (!s) { result.errors.push({ row: rowNum, message: `Sales "${kodeSales}" tidak ditemukan` }); result.failed++; continue }
            const idPart = partMap.get(kodePart)
            if (!idPart) { result.errors.push({ row: rowNum, message: `Part "${kodePart}" tidak ditemukan` }); result.failed++; continue }
            const idCustomer = kodeCustomer ? (custMap.get(kodeCustomer) ?? null) : null
            if (qty <= 0 || hargaSatuan < 0) { result.errors.push({ row: rowNum, message: 'Qty harus > 0' }); result.failed++; continue }

            const subtotal = qty * hargaSatuan
            const totalOmzet = subtotal - diskon

            batch.push({
              tanggal,
              idSales: s.id,
              idPart,
              idCabang: s.idCabang,
              idCustomer,
              qty,
              bonus,
              hargaSatuan,
              diskon,
              totalOmzet,
            })
          } catch (e) {
            result.errors.push({ row: rowNum, message: (e as Error).message })
            result.failed++
          }
        }

        if (batch.length > 0) {
          for (let i = 0; i < batch.length; i += 500) {
            await prisma.penjualan.createMany({ data: batch.slice(i, i + 500) })
          }
          result.success = batch.length
        }
        break
      }

      case 'target': {
        const sales = await prisma.sales.findMany({
          select: { id: true, kode: true, idCabang: true },
        })
        const salesMap = new Map(sales.map((s) => [s.kode, s]))

        for (let i = 0; i < rows.length; i++) {
          const r = rows[i]
          const rowNum = i + 4
          try {
            const periode = new Date(String(r['Periode'] ?? ''))
            const kodeSales = String(r['Kode Sales'] ?? '').trim()
            const targetOmzet = Number(r['Target Omzet'] ?? 0)

            if (isNaN(periode.getTime())) { result.errors.push({ row: rowNum, message: 'Periode tidak valid' }); result.failed++; continue }
            const s = salesMap.get(kodeSales)
            if (!s) { result.errors.push({ row: rowNum, message: `Sales "${kodeSales}" tidak ditemukan` }); result.failed++; continue }

            await prisma.target.upsert({
              where: { periode_idSales: { periode, idSales: s.id } },
              update: { targetOmzet },
              create: { periode, idSales: s.id, idCabang: s.idCabang, targetOmzet },
            })
            result.success++
          } catch (e) {
            result.errors.push({ row: rowNum, message: (e as Error).message })
            result.failed++
          }
        }
        break
      }

      case 'faktur': {
        const [sales, parts, customers] = await Promise.all([
          prisma.sales.findMany({ select: { id: true, kode: true, idCabang: true } }),
          prisma.part.findMany({ select: { id: true, kode: true } }),
          prisma.customer.findMany({ select: { id: true, kode: true } }),
        ])
        const salesMap = new Map(sales.map((s) => [s.kode, s]))
        const partMap = new Map(parts.map((p) => [p.kode, p.id]))
        const custMap = new Map(customers.map((c) => [c.kode, c.id]))

        const fakturGroups = new Map<string, {
          tanggal: Date
          jatuhTempo: Date
          kodeSales: string
          kodeCustomer: string
          items: { idPart: number; qty: number; bonus: number; hargaSatuan: number; subtotal: number }[]
        }>()

        for (let i = 0; i < rows.length; i++) {
          const r = rows[i]
          const rowNum = i + 4
          try {
            const nomorFaktur = String(r['Nomor Faktur'] ?? '').trim()
            const tanggal = new Date(String(r['Tanggal'] ?? ''))
            const jatuhTempo = new Date(String(r['Jatuh Tempo'] ?? ''))
            const kodeSales = String(r['Kode Sales'] ?? '').trim()
            const kodeCustomer = String(r['Kode Customer'] ?? '').trim()
            const kodePart = String(r['Kode Part'] ?? '').trim()
            const qty = Number(r['Qty'] ?? 0)
            const bonus = Number(r['Bonus'] ?? 0)
            const hargaSatuan = Number(r['Harga Satuan'] ?? 0)

            if (!nomorFaktur || isNaN(tanggal.getTime()) || isNaN(jatuhTempo.getTime())) {
              result.errors.push({ row: rowNum, message: 'Nomor & tanggal wajib valid' })
              result.failed++; continue
            }
            const s = salesMap.get(kodeSales)
            if (!s) { result.errors.push({ row: rowNum, message: `Sales "${kodeSales}" tidak ditemukan` }); result.failed++; continue }
            const idPart = partMap.get(kodePart)
            if (!idPart) { result.errors.push({ row: rowNum, message: `Part "${kodePart}" tidak ditemukan` }); result.failed++; continue }

            if (!fakturGroups.has(nomorFaktur)) {
              fakturGroups.set(nomorFaktur, {
                tanggal,
                jatuhTempo,
                kodeSales,
                kodeCustomer,
                items: [],
              })
            }
            fakturGroups.get(nomorFaktur)!.items.push({
              idPart,
              qty,
              bonus,
              hargaSatuan,
              subtotal: qty * hargaSatuan,
            })
          } catch (e) {
            result.errors.push({ row: rowNum, message: (e as Error).message })
            result.failed++
          }
        }

        for (const [nomorFaktur, group] of fakturGroups) {
          try {
            const existing = await prisma.faktur.findUnique({ where: { nomorFaktur } })
            if (existing) {
              result.errors.push({ row: 0, message: `Faktur "${nomorFaktur}" sudah ada, dilewati` })
              result.failed++
              continue
            }

            const s = salesMap.get(group.kodeSales)!
            const idCustomer = group.kodeCustomer ? (custMap.get(group.kodeCustomer) ?? null) : null

            const subtotalDpp = group.items.reduce((sum, it) => sum + it.subtotal, 0)
            const ppn = Math.round(subtotalDpp * 0.11)
            const totalTagihan = subtotalDpp + ppn
            const isJatuhTempo = group.jatuhTempo < new Date()

            const newFaktur = await prisma.faktur.create({
              data: {
                nomorFaktur,
                tanggal: group.tanggal,
                jatuhTempo: group.jatuhTempo,
                idSales: s.id,
                idCabang: s.idCabang,
                idCustomer,
                subtotalDpp,
                ppn,
                totalTagihan,
                status: isJatuhTempo ? 'JATUH_TEMPO' : 'BELUM_LUNAS',
                detail: {
                  create: group.items.map((it) => ({
                    idPart: it.idPart,
                    qty: it.qty,
                    bonus: it.bonus,
                    hargaSatuan: it.hargaSatuan,
                    subtotal: it.subtotal,
                  })),
                },
              },
            })

            await prisma.hutang.create({
              data: {
                idFaktur: newFaktur.id,
                idSales: s.id,
                idCabang: s.idCabang,
                tanggalFaktur: group.tanggal,
                jatuhTempo: group.jatuhTempo,
                totalHutang: totalTagihan,
                totalBayar: 0,
                sisaHutang: totalTagihan,
                statusLunas: false,
              },
            })

            result.success++
          } catch (e) {
            result.errors.push({ row: 0, message: `Faktur "${nomorFaktur}": ${(e as Error).message}` })
            result.failed++
          }
        }
        break
      }
    }

    // Revalidate cache
    revalidatePath(`/dashboard/${entity}`)
    revalidateTag('dashboard1', 'max')
    revalidateTag('dashboard2', 'max')

    return NextResponse.json(result)
  } catch (e) {
    console.error('Import error:', e)
    return NextResponse.json(
      { error: (e as Error).message, ...result },
      { status: 500 }
    )
  }
}