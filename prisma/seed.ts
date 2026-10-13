import 'dotenv/config'
import prisma from '../lib/prisma'

// ============================================
// Seeded random (deterministic — hasil konsisten)
// ============================================
let seed = 42
function rand() {
  seed = (seed * 9301 + 49297) % 233280
  return seed / 233280
}
function randInt(min: number, max: number) {
  return Math.floor(rand() * (max - min + 1)) + min
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)]
}
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

async function main() {
  console.log('🌱 Start seeding...\n')

  // ============================================
  // 0. CLEANUP
  // ============================================
  console.log('🧹 Cleaning up...')
  await prisma.hutang.deleteMany()
  await prisma.detailFaktur.deleteMany()
  await prisma.faktur.deleteMany()
  await prisma.penjualan.deleteMany()
  await prisma.target.deleteMany()
  await prisma.part.deleteMany()
  await prisma.bahan.deleteMany()
  await prisma.merk.deleteMany()
  await prisma.jenis.deleteMany()
  await prisma.sales.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.user.updateMany({ data: { idCabang: null } })
  await prisma.cabang.deleteMany()

  // ============================================
  // 1. CABANG
  // ============================================
  console.log('🏢 Seeding cabang...')
  const cabangsData = [
    { kode: 'SMG', nama: 'Cabang Semarang', wilayah: 'Jateng Pantura', alamat: 'Jl. Pemuda No. 100, Semarang' },
    { kode: 'PKL', nama: 'Cabang Pekalongan', wilayah: 'Jateng Pantura', alamat: 'Jl. Hayam Wuruk No. 50, Pekalongan' },
    { kode: 'TGL', nama: 'Cabang Tegal', wilayah: 'Jateng Pantura', alamat: 'Jl. Ahmad Yani No. 25, Tegal' },
  ]
  const cabangs = []
  for (const c of cabangsData) {
    cabangs.push(await prisma.cabang.create({ data: c }))
  }

  // ============================================
  // 2. CUSTOMER
  // ============================================
  console.log('🏪 Seeding customer...')
  const customersData = [
    { kode: 'CST-001', nama: 'Toko Jaya Motor', alamat: 'Jl. Pemuda No. 12, Semarang', telepon: '024-1234567' },
    { kode: 'CST-002', nama: 'Bengkel Sinar Abadi', alamat: 'Jl. Kaligawe No. 45, Semarang', telepon: '024-2345678' },
    { kode: 'CST-003', nama: 'UD Makmur Sentosa', alamat: 'Jl. Sultan Agung No. 78, Semarang', telepon: '024-3456789' },
    { kode: 'CST-004', nama: 'CV Prima Motor', alamat: 'Jl. Majapahit No. 200, Semarang', telepon: '024-4567890' },
    { kode: 'CST-005', nama: 'Toko Sumber Rejeki', alamat: 'Jl. MT Haryono No. 15, Semarang', telepon: '024-5678901' },
    { kode: 'CST-006', nama: 'Bengkel Mandiri Jaya', alamat: 'Jl. Sriwijaya No. 33, Semarang', telepon: '024-6789012' },
    { kode: 'CST-007', nama: 'Toko Berkah Motor', alamat: 'Jl. Kartini No. 88, Semarang', telepon: '024-7890123' },
    { kode: 'CST-008', nama: 'UD Sukses Abadi', alamat: 'Jl. Dr. Cipto No. 56, Semarang', telepon: '024-8901234' },
    { kode: 'CST-009', nama: 'Bengkel Setia Kawan', alamat: 'Jl. Indraprasta No. 21, Semarang', telepon: '024-9012345' },
    { kode: 'CST-010', nama: 'Toko Anugerah Motor', alamat: 'Jl. Brigjen Sudiarto No. 99, Semarang', telepon: '024-0123456' },
  ]
  const customers = []
  for (const c of customersData) {
    customers.push(await prisma.customer.create({ data: c }))
  }

  // ============================================
  // 3. SALES
  // ============================================
  console.log('👤 Seeding sales...')
  const salesData = [
    { kode: 'SLS-001', nama: 'Budi Santoso', cabangIdx: 0, telepon: '081234567001' },
    { kode: 'SLS-002', nama: 'Andi Wijaya', cabangIdx: 0, telepon: '081234567002' },
    { kode: 'SLS-003', nama: 'Citra Dewi', cabangIdx: 1, telepon: '081234567003' },
    { kode: 'SLS-004', nama: 'Dedi Kurniawan', cabangIdx: 1, telepon: '081234567004' },
    { kode: 'SLS-005', nama: 'Eka Pratiwi', cabangIdx: 2, telepon: '081234567005' },
    { kode: 'SLS-006', nama: 'Fajar Ramadhan', cabangIdx: 2, telepon: '081234567006' },
  ]
  const salesList = []
  for (const s of salesData) {
    salesList.push(await prisma.sales.create({
      data: {
        kode: s.kode,
        nama: s.nama,
        idCabang: cabangs[s.cabangIdx].id,
        telepon: s.telepon,
        aktif: true,
      },
    }))
  }

  // ============================================
  // 4. MERK & JENIS
  // ============================================
  console.log('🏷️  Seeding merk & jenis...')
  const merksData = [
    { kode: 'MRK-YMH', nama: 'Yamaha' },
    { kode: 'MRK-HND', nama: 'Honda' },
    { kode: 'MRK-SZK', nama: 'Suzuki' },
    { kode: 'MRK-KWS', nama: 'Kawasaki' },
    { kode: 'MRK-VSP', nama: 'Vespa' },
  ]
  const merks = []
  for (const m of merksData) {
    merks.push(await prisma.merk.create({ data: m }))
  }

  const jenisData = [
    { kode: 'JNS-OLI', nama: 'Oli' },
    { kode: 'JNS-BAN', nama: 'Ban' },
    { kode: 'JNS-AKI', nama: 'Aki' },
    { kode: 'JNS-SPR', nama: 'Spare Part' },
  ]
  const jenises = []
  for (const j of jenisData) {
    jenises.push(await prisma.jenis.create({ data: j }))
  }

  // ============================================
  // 5. BAHAN
  // ============================================
  console.log('🧪 Seeding bahan...')
  const bahanData: [string, number, number][] = [
    ['Oli Yamalube', 0, 0],
    ['Ban IRC Yamaha', 0, 1],
    ['Aki GS Yamaha', 0, 2],
    ['Spare Part Yamaha', 0, 3],
    ['Oli AHM', 1, 0],
    ['Ban FDR Honda', 1, 1],
    ['Aki Yuasa Honda', 1, 2],
    ['Spare Part Honda', 1, 3],
    ['Oli Suzuki', 2, 0],
    ['Ban Swallow Suzuki', 2, 1],
    ['Aki GS Astra Suzuki', 2, 2],
    ['Spare Part Suzuki', 2, 3],
    ['Oli Kawasaki', 3, 0],
    ['Ban IRC Kawasaki', 3, 1],
    ['Spare Part Kawasaki', 3, 3],
    ['Oli Vespa', 4, 0],
    ['Ban Pirelli Vespa', 4, 1],
    ['Spare Part Vespa', 4, 3],
  ]
  const bahans = []
  for (let i = 0; i < bahanData.length; i++) {
    const [nama, idxMerk, idxJenis] = bahanData[i]
    bahans.push(await prisma.bahan.create({
      data: {
        kode: `BHN-${String(i + 1).padStart(3, '0')}`,
        nama,
        idMerk: merks[idxMerk].id,
        idJenis: jenises[idxJenis].id,
      },
    }))
  }

  // ============================================
  // 6. PART (dengan hargaBeli)
  // ============================================
  console.log('🔧 Seeding part...')
  const partData: [string, number, string, number][] = [
    ['Yamalube Matic 0.8L', 0, 'LITER', 45000],
    ['Yamalube Matic 1L', 0, 'LITER', 55000],
    ['Yamalube Sport 1L', 0, 'LITER', 75000],
    ['IRC NR73 80/90-14', 1, 'PCS', 145000],
    ['IRC Fasti 90/90-14', 1, 'PCS', 165000],
    ['Aki GS GTZ5S', 2, 'PCS', 285000],
    ['Aki GS GTZ6V', 2, 'PCS', 345000],
    ['Kampas Rem Yamaha', 3, 'SET', 65000],
    ['Busi NGK Yamaha', 3, 'PCS', 35000],
    ['Filter Oli Yamaha', 3, 'PCS', 45000],
    ['AHM Matic 0.8L', 4, 'LITER', 42000],
    ['AHM Sport 1L', 4, 'LITER', 68000],
    ['FDR Sport XR 80/90-14', 5, 'PCS', 135000],
    ['FDR Genzi 90/90-14', 5, 'PCS', 155000],
    ['Yuasa YTZ5S', 6, 'PCS', 295000],
    ['Yuasa YTZ6V', 6, 'PCS', 365000],
    ['Kampas Rem Honda', 7, 'SET', 60000],
    ['Busi NGK Honda', 7, 'PCS', 32000],
    ['Filter Udara Honda', 7, 'PCS', 55000],
    ['Suzuki Matic 0.8L', 8, 'LITER', 40000],
    ['Swallow SB 80/90-14', 9, 'PCS', 125000],
    ['GS Astra GTZ5S', 10, 'PCS', 275000],
    ['Kampas Rem Suzuki', 11, 'SET', 58000],
    ['Kawasaki Matic 0.8L', 12, 'LITER', 48000],
    ['IRC NR88 90/90-14', 13, 'PCS', 175000],
    ['Kampas Rem Kawasaki', 14, 'SET', 75000],
    ['Vespa Oli 1L', 15, 'LITER', 85000],
    ['Pirelli Angel 110/70-12', 16, 'PCS', 385000],
    ['Kampas Rem Vespa', 17, 'SET', 125000],
    ['Busi NGK Vespa', 17, 'PCS', 55000],
  ]
  const parts = []
  for (let i = 0; i < partData.length; i++) {
    const [nama, idxBahan, satuan, hargaJual] = partData[i]
    // harga beli = 70-85% dari harga jual, dibulatkan ke ratusan
    const hargaBeli = Math.round((hargaJual * (0.70 + rand() * 0.15)) / 100) * 100
    parts.push(await prisma.part.create({
      data: {
        kode: `PRT-${String(i + 1).padStart(3, '0')}`,
        nama,
        idBahan: bahans[idxBahan].id,
        satuan,
        hargaJual,
        hargaBeli,
        aktif: true,
      },
    }))
  }

  // ============================================
  // 7. TARGET
  // ============================================
  console.log('🎯 Seeding target...')
  const now = new Date()
  const targetBulanan = 35_000_000
  for (let i = 0; i < 6; i++) {
    const periode = new Date(now.getFullYear(), now.getMonth() - i, 1)
    for (const sales of salesList) {
      const targetOmzet = targetBulanan + randInt(-5_000_000, 15_000_000)
      await prisma.target.create({
        data: {
          periode,
          idSales: sales.id,
          idCabang: sales.idCabang,
          targetOmzet,
        },
      })
    }
  }

  // ============================================
  // 8. PENJUALAN
  // ============================================
  console.log('💰 Seeding penjualan...')
  const penjualanBatch = []
  for (let i = 0; i < 500; i++) {
    const sales = pick(salesList)
    const part = pick(parts)
    const customer = pick(customers)
    const qty = randInt(1, 8)
    // 20% transaksi dapat bonus 1-3 pcs
    const bonus = rand() < 0.2 ? randInt(1, 3) : 0
    const hargaSatuan = Number(part.hargaJual) + randInt(-2000, 2000)
    const subtotal = qty * hargaSatuan
    const diskon = rand() < 0.3 ? Math.floor((subtotal * randInt(1, 8)) / 100) : 0
    const totalOmzet = subtotal - diskon

    const daysAgo = randInt(0, 180)
    const tanggal = new Date(now.getTime() - daysAgo * 86400000)
    tanggal.setHours(randInt(8, 17), randInt(0, 59), 0, 0)

    penjualanBatch.push({
      tanggal,
      idSales: sales.id,
      idPart: part.id,
      idCabang: sales.idCabang,
      idCustomer: customer.id,
      qty,
      bonus,
      hargaSatuan,
      diskon,
      totalOmzet,
    })
  }
  await prisma.penjualan.createMany({ data: penjualanBatch })

  // ============================================
  // 9. FAKTUR + DETAIL + HUTANG (dengan DPP + PPN + bonus per item)
  // ============================================
  console.log('📄 Seeding faktur & hutang...')
  for (let i = 1; i <= 40; i++) {
    const sales = pick(salesList)
    const customer = pick(customers)
    const jumlahItem = randInt(1, 3)
    const items = shuffle(parts).slice(0, jumlahItem).map((p) => {
      const qty = randInt(1, 5)
      // 15% item faktur dapat bonus
      const bonus = rand() < 0.15 ? randInt(1, 2) : 0
      const hargaSatuan = Number(p.hargaJual)
      return {
        idPart: p.id,
        qty,
        bonus,
        hargaSatuan,
        subtotal: qty * hargaSatuan,
      }
    })

    // Hitung DPP & PPN
    const subtotalDpp = items.reduce((s, it) => s + it.subtotal, 0)
    const ppn = Math.round(subtotalDpp * 0.11)
    const totalTagihan = subtotalDpp + ppn

    const daysAgo = randInt(0, 180)
    const tanggal = new Date(now.getTime() - daysAgo * 86400000)
    tanggal.setHours(9, 0, 0, 0)
    const jatuhTempo = new Date(tanggal.getTime() + 30 * 86400000)

    const randStatus = rand()
    let statusLunas = false
    let totalBayar = 0
    if (randStatus < 0.4) {
      statusLunas = true
      totalBayar = totalTagihan
    } else if (randStatus < 0.7) {
      totalBayar = Math.floor((totalTagihan * randInt(30, 70)) / 100)
    }
    const sisaHutang = totalTagihan - totalBayar

    const fakturStatus = statusLunas
      ? 'LUNAS'
      : jatuhTempo < new Date()
      ? 'JATUH_TEMPO'
      : 'BELUM_LUNAS'

    const newFaktur = await prisma.faktur.create({
      data: {
        nomorFaktur: `INV-${now.getFullYear()}-${String(i).padStart(4, '0')}`,
        tanggal,
        jatuhTempo,
        idSales: sales.id,
        idCabang: sales.idCabang,
        idCustomer: customer.id,
        subtotalDpp,
        ppn,
        totalTagihan,
        status: fakturStatus,
        detail: { create: items },
      },
    })

    await prisma.hutang.create({
      data: {
        idFaktur: newFaktur.id,
        idSales: sales.id,
        idCabang: sales.idCabang,
        tanggalFaktur: tanggal,
        jatuhTempo,
        totalHutang: totalTagihan,
        totalBayar,
        sisaHutang,
        statusLunas,
      },
    })
  }

  // ============================================
  // SUMMARY
  // ============================================
  const summary = {
    cabang: await prisma.cabang.count(),
    customer: await prisma.customer.count(),
    sales: await prisma.sales.count(),
    merk: await prisma.merk.count(),
    jenis: await prisma.jenis.count(),
    bahan: await prisma.bahan.count(),
    part: await prisma.part.count(),
    target: await prisma.target.count(),
    penjualan: await prisma.penjualan.count(),
    faktur: await prisma.faktur.count(),
    hutang: await prisma.hutang.count(),
  }
  console.log('\n✅ Seed selesai!\n')
  console.table(summary)
  console.log('\n📌 Langkah selanjutnya:')
  console.log('   1. Refresh MV — jalankan SQL berikut di Supabase SQL Editor:')
  console.log('      REFRESH MATERIALIZED VIEW CONCURRENTLY mv_pencapaian_sales_bulanan;')
  console.log('      REFRESH MATERIALIZED VIEW CONCURRENTLY mv_pencapaian_part_bulanan;')
  console.log('      REFRESH MATERIALIZED VIEW CONCURRENTLY mv_hutang_per_sales;')
  console.log('      REFRESH MATERIALIZED VIEW CONCURRENTLY mv_omzet_bulanan;')
  console.log('   2. Atau klik tombol "Refresh" di dashboard')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })