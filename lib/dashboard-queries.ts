import { unstable_cache } from 'next/cache'
import prisma from '@/lib/prisma'

// ============================================
// TYPES
// ============================================
export type Dashboard2Filters = {
  idCabang?: number
  tahun?: number
  bulan?: number
  idSales?: number
  idCustomer?: number
  idBahan?: number
  idJenis?: number
  idPart?: number
}

export type PivotSalesCell = {
  omzet: number
  value: number
  unit: number
  bonus: number
  cust: number
  item: number
}

export type PivotRow = {
  idPart: number
  kodePart: string
  namaPart: string
  perSales: Record<number, PivotSalesCell>
  total: PivotSalesCell
}

export type PivotSalesInfo = {
  id: number
  nama: string
}

type Row = Record<string, unknown>

type BreakdownRow = {
  nama_sales: string
  group_name: string
  tahun: number
  unit: bigint
  omzet: number
  bonus: bigint
  cust: bigint
}

type HutangUnitValueRow = {
  nama_sales: string
  total_hutang: number
  sisa_hutang: number
}

type FakturStatusRow = {
  nama_sales: string
  belum_jt: number
  sudah_jt: number
}

// ============================================
// HELPERS
// ============================================
function safeInt(v: number | undefined): number | undefined {
  return v !== undefined && Number.isFinite(v) ? Math.floor(v) : undefined
}

function buildPenjualanWhere(f: Dashboard2Filters, from: string, to: string): string {
  const c: string[] = [
    `p.tanggal >= '${from}'::date`,
    `p.tanggal <= '${to}'::date`,
  ]
  const idCabang = safeInt(f.idCabang)
  const idSales = safeInt(f.idSales)
  const idPart = safeInt(f.idPart)
  const idBahan = safeInt(f.idBahan)
  const idJenis = safeInt(f.idJenis)
  const bulan = safeInt(f.bulan)

  if (idCabang) c.push(`p.id_cabang = ${idCabang}`)
  if (idSales) c.push(`p.id_sales = ${idSales}`)
  if (idPart) c.push(`p.id_part = ${idPart}`)
  if (idBahan) c.push(`b.id = ${idBahan}`)
  if (idJenis) c.push(`j.id = ${idJenis}`)
  if (bulan) c.push(`EXTRACT(MONTH FROM p.tanggal) = ${bulan}`)

  return c.join(' AND ')
}

function buildFakturWhere(f: Dashboard2Filters, from: string, to: string): string {
  const c: string[] = [
    `f.tanggal >= '${from}'::date`,
    `f.tanggal <= '${to}'::date`,
  ]
  const idCabang = safeInt(f.idCabang)
  const idSales = safeInt(f.idSales)
  const idCustomer = safeInt(f.idCustomer)
  const bulan = safeInt(f.bulan)

  if (idCabang) c.push(`f.id_cabang = ${idCabang}`)
  if (idSales) c.push(`f.id_sales = ${idSales}`)
  if (idCustomer) c.push(`f.id_customer = ${idCustomer}`)
  if (bulan) c.push(`EXTRACT(MONTH FROM f.tanggal) = ${bulan}`)

  return c.join(' AND ')
}

function buildHutangWhere(f: Dashboard2Filters): string {
  const c: string[] = ['h.status_lunas = false']
  const idCabang = safeInt(f.idCabang)
  const idSales = safeInt(f.idSales)

  if (idCabang) c.push(`h.id_cabang = ${idCabang}`)
  if (idSales) c.push(`h.id_sales = ${idSales}`)

  return c.join(' AND ')
}

function buildTargetWhere(f: Dashboard2Filters, from: string, to: string): string {
  const c: string[] = [
    `t.periode >= '${from}'::date`,
    `t.periode <= '${to}'::date`,
  ]
  const idCabang = safeInt(f.idCabang)
  const idSales = safeInt(f.idSales)
  const bulan = safeInt(f.bulan)

  if (idCabang) c.push(`t.id_cabang = ${idCabang}`)
  if (idSales) c.push(`t.id_sales = ${idSales}`)
  if (bulan) c.push(`EXTRACT(MONTH FROM t.periode) = ${bulan}`)

  return c.join(' AND ')
}

function emptyCell(): PivotSalesCell {
  return { omzet: 0, value: 0, unit: 0, bonus: 0, cust: 0, item: 0 }
}

const BULAN_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

// ============================================
// DASHBOARD 1 — dengan 7 filter
// ============================================
async function _getDashboard1Data(filters: Dashboard2Filters = {}) {
  const tahun = safeInt(filters.tahun) ?? new Date().getFullYear()
  const bulanNum = safeInt(filters.bulan)
  const idCabang = safeInt(filters.idCabang)

  // Range tanggal
  const fromDate = bulanNum
    ? `${tahun}-${String(bulanNum).padStart(2, '0')}-01`
    : `${tahun}-01-01`
  const toDate = bulanNum
    ? new Date(tahun, bulanNum, 0).toISOString().slice(0, 10)
    : `${tahun}-12-31`

  // Dynamic WHERE
  const pWhere = buildPenjualanWhere(filters, fromDate, toDate)
  const fWhere = buildFakturWhere(filters, fromDate, toDate)
  const hWhere = buildHutangWhere(filters)
  const tWhere = buildTargetWhere(filters, fromDate, toDate)

  const [
    kpiPenjualan,
    targetRow,
    hutangRow,
    fakturBelumLunasRaw,
    omzetPerCabangRows,
    cabangList,
    listSales,
    listCustomer,
    listBahan,
    listJenis,
    listPart,
    breakdownJenisRows,
    breakdownMerkRows,
    breakdownPartRows,
    breakdownBahanRows,
    hutangUnitValueRows,
    fakturStatusRows,
  ] = await Promise.all([
    // 1. KPI Omzet + Unit
    prisma.$queryRawUnsafe<Row[]>(`
      SELECT COALESCE(SUM(p.total_omzet), 0)::numeric AS total_omzet,
             COALESCE(SUM(p.qty), 0)::bigint AS total_qty
      FROM penjualan p
      JOIN part pt ON p.id_part = pt.id
      JOIN bahan b ON pt.id_bahan = b.id
      JOIN jenis j ON b.id_jenis = j.id
      WHERE ${pWhere}
    `),

    // 2. Target
    prisma.$queryRawUnsafe<Row[]>(`
      SELECT COALESCE(SUM(t.target_omzet), 0)::numeric AS total
      FROM target t
      WHERE ${tWhere}
    `),

    // 3. Hutang (sisa + total + count)
    prisma.$queryRawUnsafe<Row[]>(`
      SELECT COALESCE(SUM(h.sisa_hutang), 0)::numeric AS sisa,
             COALESCE(SUM(h.total_hutang), 0)::numeric AS total,
             COUNT(h.id)::bigint AS count
      FROM hutang h
      WHERE ${hWhere}
    `),

    // 4. Faktur belum lunas (TANPA filter tanggal — semua hutang tampil)
    prisma.faktur.findMany({
      where: {
        status: { in: ['BELUM_LUNAS', 'JATUH_TEMPO'] },
        ...(idCabang ? { idCabang } : {}),
        ...(filters.idSales ? { idSales: filters.idSales } : {}),
        ...(filters.idCustomer ? { idCustomer: filters.idCustomer } : {}),
      },
      include: {
        sales: true,
        cabang: true,
        customer: { select: { nama: true } },
      },
      orderBy: { jatuhTempo: 'asc' },
      take: 50,
    }),

    // 5. Omzet per cabang
    prisma.$queryRawUnsafe<Row[]>(`
      SELECT c.id AS id_cabang, c.nama AS nama_cabang,
             COALESCE(SUM(p.total_omzet), 0)::numeric AS omzet
      FROM penjualan p
      JOIN cabang c ON p.id_cabang = c.id
      JOIN part pt ON p.id_part = pt.id
      JOIN bahan b ON pt.id_bahan = b.id
      JOIN jenis j ON b.id_jenis = j.id
      WHERE ${pWhere}
      GROUP BY c.id, c.nama
      ORDER BY omzet DESC
    `),

    // 6. Cabang list
    prisma.cabang.findMany({ orderBy: { nama: 'asc' } }),

    // 7-11. Filter options
    prisma.sales.findMany({
      where: { aktif: true },
      orderBy: { nama: 'asc' },
      select: { id: true, kode: true, nama: true },
    }),
    prisma.customer.findMany({
      where: { aktif: true },
      orderBy: { nama: 'asc' },
      select: { id: true, kode: true, nama: true },
    }),
    prisma.bahan.findMany({
      orderBy: { nama: 'asc' },
      select: { id: true, kode: true, nama: true },
    }),
    prisma.jenis.findMany({
      orderBy: { nama: 'asc' },
      select: { id: true, kode: true, nama: true },
    }),
    prisma.part.findMany({
      where: { aktif: true },
      orderBy: { nama: 'asc' },
      select: { id: true, kode: true, nama: true },
    }),

    // 12. Breakdown Jenis
    prisma.$queryRawUnsafe<BreakdownRow[]>(`
      SELECT s.nama AS nama_sales,
             j.nama AS group_name,
             EXTRACT(YEAR FROM p.tanggal)::int AS tahun,
             COALESCE(SUM(p.qty), 0)::bigint AS unit,
             COALESCE(SUM(p.total_omzet), 0)::numeric AS omzet,
             COALESCE(SUM(p.bonus), 0)::bigint AS bonus,
             COUNT(DISTINCT p.id_customer)::bigint AS cust
      FROM penjualan p
      JOIN sales s ON p.id_sales = s.id
      JOIN part pt ON p.id_part = pt.id
      JOIN bahan b ON pt.id_bahan = b.id
      JOIN jenis j ON b.id_jenis = j.id
      WHERE ${pWhere}
      GROUP BY j.nama, s.nama, EXTRACT(YEAR FROM p.tanggal)
      ORDER BY j.nama, s.nama, tahun
    `),

    // 13. Breakdown Merk
    prisma.$queryRawUnsafe<BreakdownRow[]>(`
      SELECT s.nama AS nama_sales,
             m.nama AS group_name,
             EXTRACT(YEAR FROM p.tanggal)::int AS tahun,
             COALESCE(SUM(p.qty), 0)::bigint AS unit,
             COALESCE(SUM(p.total_omzet), 0)::numeric AS omzet,
             COALESCE(SUM(p.bonus), 0)::bigint AS bonus,
             COUNT(DISTINCT p.id_customer)::bigint AS cust
      FROM penjualan p
      JOIN sales s ON p.id_sales = s.id
      JOIN part pt ON p.id_part = pt.id
      JOIN bahan b ON pt.id_bahan = b.id
      JOIN merk m ON b.id_merk = m.id
      JOIN jenis j ON b.id_jenis = j.id
      WHERE ${pWhere}
      GROUP BY m.nama, s.nama, EXTRACT(YEAR FROM p.tanggal)
      ORDER BY m.nama, s.nama, tahun
    `),

    // 14. Breakdown Part
    prisma.$queryRawUnsafe<BreakdownRow[]>(`
      SELECT s.nama AS nama_sales,
             pt.nama AS group_name,
             EXTRACT(YEAR FROM p.tanggal)::int AS tahun,
             COALESCE(SUM(p.qty), 0)::bigint AS unit,
             COALESCE(SUM(p.total_omzet), 0)::numeric AS omzet,
             COALESCE(SUM(p.bonus), 0)::bigint AS bonus,
             COUNT(DISTINCT p.id_customer)::bigint AS cust
      FROM penjualan p
      JOIN sales s ON p.id_sales = s.id
      JOIN part pt ON p.id_part = pt.id
      JOIN bahan b ON pt.id_bahan = b.id
      JOIN jenis j ON b.id_jenis = j.id
      WHERE ${pWhere}
      GROUP BY pt.nama, s.nama, EXTRACT(YEAR FROM p.tanggal)
      ORDER BY pt.nama, s.nama, tahun
    `),

    // 15. Breakdown Bahan
    prisma.$queryRawUnsafe<BreakdownRow[]>(`
      SELECT s.nama AS nama_sales,
             b.nama AS group_name,
             EXTRACT(YEAR FROM p.tanggal)::int AS tahun,
             COALESCE(SUM(p.qty), 0)::bigint AS unit,
             COALESCE(SUM(p.total_omzet), 0)::numeric AS omzet,
             COALESCE(SUM(p.bonus), 0)::bigint AS bonus,
             COUNT(DISTINCT p.id_customer)::bigint AS cust
      FROM penjualan p
      JOIN sales s ON p.id_sales = s.id
      JOIN part pt ON p.id_part = pt.id
      JOIN bahan b ON pt.id_bahan = b.id
      JOIN jenis j ON b.id_jenis = j.id
      WHERE ${pWhere}
      GROUP BY b.nama, s.nama, EXTRACT(YEAR FROM p.tanggal)
      ORDER BY b.nama, s.nama, tahun
    `),

    // 16. Hutang per sales (chart, TANPA filter tanggal)
    prisma.$queryRawUnsafe<HutangUnitValueRow[]>(`
      SELECT s.nama AS nama_sales,
             COALESCE(SUM(h.total_hutang), 0)::numeric AS total_hutang,
             COALESCE(SUM(h.sisa_hutang), 0)::numeric AS sisa_hutang
      FROM hutang h
      JOIN sales s ON h.id_sales = s.id
      WHERE ${hWhere}
      GROUP BY s.nama
      ORDER BY total_hutang DESC
      LIMIT 10
    `),

    // 17. Faktur status chart (TANPA filter tanggal)
    prisma.$queryRawUnsafe<FakturStatusRow[]>(`
      SELECT s.nama AS nama_sales,
             COALESCE(SUM(CASE WHEN h.jatuh_tempo >= CURRENT_DATE THEN h.sisa_hutang ELSE 0 END), 0)::numeric AS belum_jt,
             COALESCE(SUM(CASE WHEN h.jatuh_tempo < CURRENT_DATE THEN h.sisa_hutang ELSE 0 END), 0)::numeric AS sudah_jt
      FROM hutang h
      JOIN sales s ON h.id_sales = s.id
      WHERE ${hWhere}
      GROUP BY s.nama
      ORDER BY (COALESCE(SUM(h.sisa_hutang), 0)) DESC
      LIMIT 10
    `),
  ])

  // ========================================
  // Process KPI
  // ========================================
  const omzet = Number(kpiPenjualan[0]?.total_omzet ?? 0)
  const totalUnit = Number(kpiPenjualan[0]?.total_qty ?? 0)
  const target = Number(targetRow[0]?.total ?? 0)
  const hutang = Number(hutangRow[0]?.sisa ?? 0)
  const hutangTotal = Number(hutangRow[0]?.total ?? 0)
  const hutangCount = Number(hutangRow[0]?.count ?? 0)

  // Omzet per cabang
  const pencapaianPerCabang = (omzetPerCabangRows as Row[]).map((r) => ({
    nama: r.nama_cabang as string,
    omzet: Number(r.omzet ?? 0),
  }))

  // Pencapaian per sales (dari breakdown part di-group ulang)
  const salesAggMap = new Map<string, { nama: string; omzet: number; qty: number }>()
  for (const r of breakdownPartRows as BreakdownRow[]) {
    const existing = salesAggMap.get(r.nama_sales) ?? {
      nama: r.nama_sales,
      omzet: 0,
      qty: 0,
    }
    existing.omzet += Number(r.omzet)
    existing.qty += Number(r.unit)
    salesAggMap.set(r.nama_sales, existing)
  }
  const pencapaianPerSales = [...salesAggMap.values()]
    .map((s) => ({
      nama: s.nama,
      cabang: '',
      omzet: s.omzet,
      target: 0,
      persentase: 0,
      qty: s.qty,
    }))
    .sort((a, b) => b.omzet - a.omzet)

  // Faktur belum lunas
  const fakturBelumLunas = fakturBelumLunasRaw.map((f) => ({
    id: f.id.toString(),
    nomorFaktur: f.nomorFaktur,
    jatuhTempo: f.jatuhTempo.toISOString(),
    totalTagihan: Number(f.totalTagihan),
    status: f.status,
    sales: { nama: f.sales.nama },
    cabang: { nama: f.cabang.nama },
    customer: { nama: f.customer?.nama ?? '-' },
  }))

  // Breakdown map
  const mapBreakdown = (rows: BreakdownRow[]) => {
    const grouped = new Map<string, {
      namaSales: string
      tahun: number
      unit: number
      omzet: number
      bonus: number
      cust: number
    }[]>()
    for (const r of rows) {
      const key = r.group_name
      if (!grouped.has(key)) grouped.set(key, [])
      grouped.get(key)!.push({
        namaSales: r.nama_sales,
        tahun: r.tahun,
        unit: Number(r.unit),
        omzet: Number(r.omzet),
        bonus: Number(r.bonus),
        cust: Number(r.cust),
      })
    }
    return [...grouped.entries()].map(([groupName, rows]) => ({
      groupName,
      rows,
    }))
  }

  const hutangUnitValue = (hutangUnitValueRows as HutangUnitValueRow[]).map((r) => ({
    nama: r.nama_sales,
    total: Number(r.total_hutang),
    sisa: Number(r.sisa_hutang),
  }))

  const fakturStatus = (fakturStatusRows as FakturStatusRow[]).map((r) => ({
    nama: r.nama_sales,
    belumJT: Number(r.belum_jt),
    sudahJT: Number(r.sudah_jt),
  }))

  return {
    omzet,
    totalUnit,
    target,
    hutang,
    hutangTotal,
    hutangCount,
    tahun,

    fakturBelumLunas,
    pencapaianPerSales,
    pencapaianPerCabang,

    breakdownJenis: mapBreakdown(breakdownJenisRows as BreakdownRow[]),
    breakdownMerk: mapBreakdown(breakdownMerkRows as BreakdownRow[]),
    breakdownPart: mapBreakdown(breakdownPartRows as BreakdownRow[]),
    breakdownBahan: mapBreakdown(breakdownBahanRows as BreakdownRow[]),

    hutangUnitValue,
    fakturStatus,

    listCabang: cabangList.map((c) => ({ id: c.id, kode: c.kode, nama: c.nama })),

    filterOptions: {
      listSales: listSales.map((s) => ({ id: s.id, kode: s.kode, nama: s.nama })),
      listCustomer: listCustomer.map((c) => ({ id: c.id, kode: c.kode, nama: c.nama })),
      listBahan: listBahan.map((b) => ({ id: b.id, kode: b.kode, nama: b.nama })),
      listJenis: listJenis.map((j) => ({ id: j.id, kode: j.kode, nama: j.nama })),
      listPart: listPart.map((p) => ({ id: p.id, kode: p.kode, nama: p.nama })),
    },
  }
}

export const getDashboard1Data = unstable_cache(
  async (filters: Dashboard2Filters = {}) => _getDashboard1Data(filters),
  ['dashboard1'],
  { revalidate: 300, tags: ['dashboard1'] }
)

// ============================================
// DASHBOARD 2
// ============================================
async function _getDashboard2Data(filters: Dashboard2Filters = {}) {
  const tahun = safeInt(filters.tahun) ?? new Date().getFullYear()
  const tahunLalu = tahun - 1

  const fromDate = `${tahun}-01-01`
  const toDate = `${tahun}-12-31`
  const fromDateLalu = `${tahunLalu}-01-01`
  const toDateLalu = `${tahunLalu}-12-31`

  const pWhere = buildPenjualanWhere(filters, fromDate, toDate)
  const fWhere = buildFakturWhere(filters, fromDate, toDate)
  const hWhere = buildHutangWhere(filters)
  const tWhere = buildTargetWhere(filters, fromDate, toDate)
  const pWhereLalu = buildPenjualanWhere({ ...filters, tahun: tahunLalu }, fromDateLalu, toDateLalu)

  const [
    kpiPenjualan,
    kpiBayar,
    kpiCustomer,
    kpiHutang,
    targetVsActualRows,
    kontribusiJenisRows,
    kontribusiPartRows,
    topHutangItemRows,
    omzetPerSalesRows,
    trendBulananRows,
    topCustomerRows,
    topUnit2TahunRows,
    listSales,
    listCustomer,
    listBahan,
    listJenis,
    listPart,
    pivotRows,
  ] = await Promise.all([
    prisma.$queryRawUnsafe<Row[]>(`
      SELECT COALESCE(SUM(p.total_omzet), 0)::numeric AS total_omzet,
             COALESCE(SUM(p.qty), 0)::bigint AS total_qty
      FROM penjualan p
      JOIN part pt ON p.id_part = pt.id
      JOIN bahan b ON pt.id_bahan = b.id
      JOIN jenis j ON b.id_jenis = j.id
      WHERE ${pWhere}
    `),

    prisma.$queryRawUnsafe<Row[]>(`
      SELECT COALESCE(SUM(f.total_tagihan), 0)::numeric AS total
      FROM faktur f
      WHERE f.status = 'LUNAS' AND ${fWhere}
    `),

    prisma.$queryRawUnsafe<Row[]>(`
      SELECT COUNT(DISTINCT f.id_customer)::bigint AS total
      FROM faktur f
      WHERE f.id_customer IS NOT NULL AND ${fWhere}
    `),

    prisma.$queryRawUnsafe<Row[]>(`
      SELECT COALESCE(SUM(h.sisa_hutang), 0)::numeric AS total
      FROM hutang h
      WHERE ${hWhere}
    `),

    prisma.$queryRawUnsafe<Row[]>(`
      WITH realisasi AS (
        SELECT EXTRACT(MONTH FROM p.tanggal)::int AS bulan,
               COALESCE(SUM(p.total_omzet), 0)::numeric AS total
        FROM penjualan p
        JOIN part pt ON p.id_part = pt.id
        JOIN bahan b ON pt.id_bahan = b.id
        JOIN jenis j ON b.id_jenis = j.id
        WHERE ${pWhere}
        GROUP BY EXTRACT(MONTH FROM p.tanggal)
      ),
      tgt AS (
        SELECT EXTRACT(MONTH FROM t.periode)::int AS bulan,
               COALESCE(SUM(t.target_omzet), 0)::numeric AS total
        FROM target t
        WHERE ${tWhere}
        GROUP BY EXTRACT(MONTH FROM t.periode)
      )
      SELECT COALESCE(r.bulan, g.bulan) AS bulan,
             COALESCE(r.total, 0) AS realisasi,
             COALESCE(g.total, 0) AS target
      FROM realisasi r
      FULL OUTER JOIN tgt g ON r.bulan = g.bulan
      ORDER BY bulan
    `),

    prisma.$queryRawUnsafe<Row[]>(`
      SELECT j.nama AS nama,
             COALESCE(SUM(p.total_omzet), 0)::numeric AS omzet,
             COALESCE(SUM(p.qty), 0)::bigint AS unit
      FROM penjualan p
      JOIN part pt ON p.id_part = pt.id
      JOIN bahan b ON pt.id_bahan = b.id
      JOIN jenis j ON b.id_jenis = j.id
      WHERE ${pWhere}
      GROUP BY j.id, j.nama
      ORDER BY unit DESC
      LIMIT 8
    `),

    prisma.$queryRawUnsafe<Row[]>(`
      SELECT pt.nama AS nama,
             COALESCE(SUM(p.total_omzet), 0)::numeric AS omzet,
             COALESCE(SUM(p.qty), 0)::bigint AS unit
      FROM penjualan p
      JOIN part pt ON p.id_part = pt.id
      JOIN bahan b ON pt.id_bahan = b.id
      JOIN jenis j ON b.id_jenis = j.id
      WHERE ${pWhere}
      GROUP BY pt.id, pt.nama
      ORDER BY unit DESC
      LIMIT 8
    `),

    prisma.$queryRawUnsafe<Row[]>(`
      SELECT pt.nama AS nama,
             pt.kode AS kode,
             COALESCE(SUM(df.subtotal), 0)::numeric AS value,
             COALESCE(SUM(df.qty), 0)::bigint AS unit
      FROM hutang h
      JOIN faktur f ON h.id_faktur = f.id
      JOIN detail_faktur df ON df.id_faktur = f.id
      JOIN part pt ON df.id_part = pt.id
      WHERE ${hWhere}
      GROUP BY pt.id, pt.nama, pt.kode
      ORDER BY value DESC
      LIMIT 10
    `),

    prisma.$queryRawUnsafe<Row[]>(`
      SELECT s.nama AS nama,
             COALESCE(SUM(p.total_omzet), 0)::numeric AS omzet,
             COALESCE(SUM(p.qty), 0)::bigint AS unit
      FROM penjualan p
      JOIN sales s ON p.id_sales = s.id
      JOIN part pt ON p.id_part = pt.id
      JOIN bahan b ON pt.id_bahan = b.id
      JOIN jenis j ON b.id_jenis = j.id
      WHERE ${pWhere}
      GROUP BY s.id, s.nama
      ORDER BY omzet DESC
      LIMIT 10
    `),

    prisma.$queryRawUnsafe<Row[]>(`
      SELECT EXTRACT(MONTH FROM p.tanggal)::int AS bulan,
             EXTRACT(YEAR FROM p.tanggal)::int AS tahun,
             COALESCE(SUM(p.total_omzet), 0)::numeric AS total
      FROM penjualan p
      JOIN part pt ON p.id_part = pt.id
      JOIN bahan b ON pt.id_bahan = b.id
      JOIN jenis j ON b.id_jenis = j.id
      WHERE (${pWhere}) OR (${pWhereLalu})
      GROUP BY EXTRACT(YEAR FROM p.tanggal), EXTRACT(MONTH FROM p.tanggal)
      ORDER BY tahun, bulan
    `),

    prisma.$queryRawUnsafe<Row[]>(`
      SELECT c.nama AS nama,
             COALESCE(SUM(f.total_tagihan), 0)::numeric AS omzet,
             COUNT(DISTINCT f.id)::bigint AS jumlah_faktur
      FROM faktur f
      JOIN customer c ON f.id_customer = c.id
      WHERE ${fWhere}
      GROUP BY c.id, c.nama
      ORDER BY omzet DESC
      LIMIT 10
    `),

    prisma.$queryRawUnsafe<Row[]>(`
      SELECT pt.nama AS nama,
             EXTRACT(YEAR FROM p.tanggal)::int AS tahun,
             COALESCE(SUM(p.qty), 0)::bigint AS unit
      FROM penjualan p
      JOIN part pt ON p.id_part = pt.id
      JOIN bahan b ON pt.id_bahan = b.id
      JOIN jenis j ON b.id_jenis = j.id
      WHERE (${pWhere}) OR (${pWhereLalu})
      GROUP BY pt.id, pt.nama, EXTRACT(YEAR FROM p.tanggal)
      ORDER BY unit DESC
      LIMIT 20
    `),

    prisma.sales.findMany({
      where: { aktif: true },
      orderBy: { nama: 'asc' },
      select: { id: true, kode: true, nama: true },
    }),
    prisma.customer.findMany({
      where: { aktif: true },
      orderBy: { nama: 'asc' },
      select: { id: true, kode: true, nama: true },
    }),
    prisma.bahan.findMany({
      orderBy: { nama: 'asc' },
      select: { id: true, kode: true, nama: true },
    }),
    prisma.jenis.findMany({
      orderBy: { nama: 'asc' },
      select: { id: true, kode: true, nama: true },
    }),
    prisma.part.findMany({
      where: { aktif: true },
      orderBy: { nama: 'asc' },
      select: { id: true, kode: true, nama: true },
    }),

    prisma.$queryRawUnsafe<Row[]>(`
      SELECT pt.id::int AS id_part,
             pt.kode AS kode_part,
             pt.nama AS nama_part,
             s.id::int AS id_sales,
             s.nama AS nama_sales,
             COALESCE(SUM(p.total_omzet), 0)::numeric AS omzet,
             COALESCE(SUM(p.qty * COALESCE(pt.harga_beli, 0)), 0)::numeric AS value,
             COALESCE(SUM(p.qty), 0)::bigint AS unit,
             COALESCE(SUM(p.bonus), 0)::bigint AS bonus,
             COUNT(DISTINCT p.id_customer)::bigint AS cust,
             COUNT(p.id)::bigint AS item
      FROM penjualan p
      JOIN part pt ON p.id_part = pt.id
      JOIN sales s ON p.id_sales = s.id
      JOIN bahan b ON pt.id_bahan = b.id
      JOIN jenis j ON b.id_jenis = j.id
      WHERE ${pWhere}
      GROUP BY pt.id, pt.kode, pt.nama, s.id, s.nama
      ORDER BY pt.nama, s.nama
    `),
  ])

  // KPI
  const totalOmzet = Number(kpiPenjualan[0]?.total_omzet ?? 0)
  const totalUnit = Number(kpiPenjualan[0]?.total_qty ?? 0)
  const totalBayar = Number(kpiBayar[0]?.total ?? 0)
  const totalCustomer = Number(kpiCustomer[0]?.total ?? 0)
  const totalHutang = Number(kpiHutang[0]?.total ?? 0)

  const targetVsActual = (targetVsActualRows as Row[]).map((r) => ({
    bulan: BULAN_ID[(r.bulan as number) - 1] ?? `B${r.bulan}`,
    realisasi: Number(r.realisasi ?? 0),
    target: Number(r.target ?? 0),
  }))

  const trendMap = new Map<string, { bulan: string; [key: string]: number | string }>()
  for (const r of trendBulananRows as Row[]) {
    const key = BULAN_ID[(r.bulan as number) - 1] ?? `B${r.bulan}`
    if (!trendMap.has(key)) trendMap.set(key, { bulan: key })
    const entry = trendMap.get(key)!
    entry[`y${r.tahun}`] = Number(r.total ?? 0)
  }
  const trendOmzet2Tahun = BULAN_ID.map((b) => {
    const e = trendMap.get(b) ?? { bulan: b }
    return {
      bulan: b,
      [`y${tahunLalu}`]: (e[`y${tahunLalu}`] as number) ?? 0,
      [`y${tahun}`]: (e[`y${tahun}`] as number) ?? 0,
    }
  })

  const topUnitMap = new Map<string, { nama: string; [key: string]: number | string }>()
  for (const r of topUnit2TahunRows as Row[]) {
    const nama = r.nama as string
    if (!topUnitMap.has(nama)) topUnitMap.set(nama, { nama })
    const entry = topUnitMap.get(nama)!
    entry[`y${r.tahun}`] = Number(r.unit ?? 0)
  }
  const topUnit2Tahun = [...topUnitMap.values()]
    .map((e) => ({
      nama: e.nama,
      [`y${tahunLalu}`]: (e[`y${tahunLalu}`] as number) ?? 0,
      [`y${tahun}`]: (e[`y${tahun}`] as number) ?? 0,
      total: ((e[`y${tahunLalu}`] as number) ?? 0) + ((e[`y${tahun}`] as number) ?? 0),
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)

  // Pivot
  const pivotMap = new Map<number, PivotRow>()
  const salesSet = new Map<number, PivotSalesInfo>()

  for (const r of pivotRows as Row[]) {
    const idPart = r.id_part as number
    const idSales = r.id_sales as number
    const namaSales = r.nama_sales as string

    if (!salesSet.has(idSales)) {
      salesSet.set(idSales, { id: idSales, nama: namaSales })
    }

    if (!pivotMap.has(idPart)) {
      pivotMap.set(idPart, {
        idPart,
        kodePart: r.kode_part as string,
        namaPart: r.nama_part as string,
        perSales: {},
        total: emptyCell(),
      })
    }

    const row = pivotMap.get(idPart)!
    const cell: PivotSalesCell = {
      omzet: Number(r.omzet ?? 0),
      value: Number(r.value ?? 0),
      unit: Number(r.unit ?? 0),
      bonus: Number(r.bonus ?? 0),
      cust: Number(r.cust ?? 0),
      item: Number(r.item ?? 0),
    }
    row.perSales[idSales] = cell

    row.total.omzet += cell.omzet
    row.total.value += cell.value
    row.total.unit += cell.unit
    row.total.bonus += cell.bonus
    row.total.cust += cell.cust
    row.total.item += cell.item
  }

  const pivotData = [...pivotMap.values()].sort((a, b) =>
    a.namaPart.localeCompare(b.namaPart)
  )

  const pivotSalesList = [...salesSet.values()].sort((a, b) =>
    a.nama.localeCompare(b.nama)
  )

  return {
    totalOmzet,
    totalUnit,
    totalBayar,
    totalCustomer,
    totalHutang,
    tahun,
    tahunLalu,

    targetVsActual,
    kontribusiJenis: (kontribusiJenisRows as Row[]).map((r) => ({
      nama: r.nama as string,
      omzet: Number(r.omzet ?? 0),
      unit: Number(r.unit ?? 0),
    })),
    kontribusiPart: (kontribusiPartRows as Row[]).map((r) => ({
      nama: r.nama as string,
      omzet: Number(r.omzet ?? 0),
      unit: Number(r.unit ?? 0),
    })),
    topHutangItem: (topHutangItemRows as Row[]).map((r) => ({
      nama: r.nama as string,
      kode: r.kode as string,
      value: Number(r.value ?? 0),
      unit: Number(r.unit ?? 0),
    })),
    omzetPerSales: (omzetPerSalesRows as Row[]).map((r) => ({
      nama: r.nama as string,
      omzet: Number(r.omzet ?? 0),
      unit: Number(r.unit ?? 0),
    })),
    trendOmzet2Tahun,
    topCustomer: (topCustomerRows as Row[]).map((r) => ({
      nama: r.nama as string,
      omzet: Number(r.omzet ?? 0),
      jumlahFaktur: Number(r.jumlah_faktur ?? 0),
    })),
    topUnit2Tahun,

    pivotData,
    pivotSalesList,

    filterOptions: {
      listSales: listSales.map((s) => ({ id: s.id, kode: s.kode, nama: s.nama })),
      listCustomer: listCustomer.map((c) => ({ id: c.id, kode: c.kode, nama: c.nama })),
      listBahan: listBahan.map((b) => ({ id: b.id, kode: b.kode, nama: b.nama })),
      listJenis: listJenis.map((j) => ({ id: j.id, kode: j.kode, nama: j.nama })),
      listPart: listPart.map((p) => ({ id: p.id, kode: p.kode, nama: p.nama })),
    },
  }
}

export const getDashboard2Data = unstable_cache(
  async (filters: Dashboard2Filters = {}) => _getDashboard2Data(filters),
  ['dashboard2'],
  { revalidate: 600, tags: ['dashboard2'] }
)