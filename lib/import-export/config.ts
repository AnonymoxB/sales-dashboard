export type EntityKey =
  | 'cabang'
  | 'sales'
  | 'customer'
  | 'merk'
  | 'jenis'
  | 'bahan'
  | 'part'
  | 'penjualan'
  | 'target'
  | 'faktur'

export type ColumnDef = {
  key: string
  label: string
  required?: boolean
  example?: string | number
  type?: 'string' | 'number' | 'date' | 'boolean'
  note?: string
}

export type EntityConfig = {
  key: EntityKey
  label: string
  group: string
  description: string
  columns: ColumnDef[]
  templateNote?: string
}

export const ENTITIES: Record<EntityKey, EntityConfig> = {
  // ============================================
  // MASTER DATA
  // ============================================
  cabang: {
    key: 'cabang',
    label: 'Cabang',
    group: 'Master Data',
    description: 'Data master cabang',
    columns: [
      { key: 'kode', label: 'Kode', required: true, example: 'BDG' },
      { key: 'nama', label: 'Nama', required: true, example: 'Cabang Bandung' },
      { key: 'wilayah', label: 'Wilayah', example: 'Jawa Barat' },
      { key: 'alamat', label: 'Alamat', example: 'Jl. Asia Afrika No. 1' },
    ],
  },

  sales: {
    key: 'sales',
    label: 'Sales',
    group: 'Master Data',
    description: 'Data master sales (per cabang)',
    columns: [
      { key: 'kode', label: 'Kode', required: true, example: 'SLS-007' },
      { key: 'nama', label: 'Nama', required: true, example: 'Gunawan' },
      { key: 'kodeCabang', label: 'Kode Cabang', required: true, example: 'SMG', note: 'Harus cocok dengan kode cabang' },
      { key: 'telepon', label: 'Telepon', example: '081234567007' },
      { key: 'aktif', label: 'Aktif (true/false)', type: 'boolean', example: 'true' },
    ],
  },

  customer: {
    key: 'customer',
    label: 'Customer',
    group: 'Master Data',
    description: 'Data master customer',
    columns: [
      { key: 'kode', label: 'Kode', required: true, example: 'CST-011' },
      { key: 'nama', label: 'Nama', required: true, example: 'Toko Barokah' },
      { key: 'alamat', label: 'Alamat', example: 'Jl. Merdeka No. 1' },
      { key: 'telepon', label: 'Telepon', example: '024-1112222' },
      { key: 'aktif', label: 'Aktif (true/false)', type: 'boolean', example: 'true' },
    ],
  },

  merk: {
    key: 'merk',
    label: 'Merk',
    group: 'Produk',
    description: 'Data master merk produk',
    columns: [
      { key: 'kode', label: 'Kode', required: true, example: 'MRK-BMW' },
      { key: 'nama', label: 'Nama', required: true, example: 'BMW' },
    ],
  },

  jenis: {
    key: 'jenis',
    label: 'Jenis',
    group: 'Produk',
    description: 'Data master jenis produk',
    columns: [
      { key: 'kode', label: 'Kode', required: true, example: 'JNS-LMP' },
      { key: 'nama', label: 'Nama', required: true, example: 'Lampu' },
    ],
  },

  bahan: {
    key: 'bahan',
    label: 'Bahan',
    group: 'Produk',
    description: 'Data master bahan (relasi merk + jenis)',
    columns: [
      { key: 'kode', label: 'Kode', required: true, example: 'BHN-019' },
      { key: 'nama', label: 'Nama', required: true, example: 'Lampu LED Yamaha' },
      { key: 'kodeMerk', label: 'Kode Merk', required: true, example: 'MRK-YMH' },
      { key: 'kodeJenis', label: 'Kode Jenis', required: true, example: 'JNS-LMP' },
    ],
  },

  part: {
    key: 'part',
    label: 'Part',
    group: 'Produk',
    description: 'Data master part (relasi bahan)',
    templateNote: 'Harga beli opsional. Harga jual wajib.',
    columns: [
      { key: 'kode', label: 'Kode', required: true, example: 'PRT-031' },
      { key: 'nama', label: 'Nama', required: true, example: 'LED Yamaha 12V' },
      { key: 'kodeBahan', label: 'Kode Bahan', required: true, example: 'BHN-019' },
      { key: 'satuan', label: 'Satuan', required: true, example: 'PCS' },
      { key: 'hargaJual', label: 'Harga Jual', required: true, type: 'number', example: 125000 },
      { key: 'hargaBeli', label: 'Harga Beli', type: 'number', example: 95000 },
      { key: 'aktif', label: 'Aktif (true/false)', type: 'boolean', example: 'true' },
    ],
  },

  // ============================================
  // TRANSAKSI
  // ============================================
  penjualan: {
    key: 'penjualan',
    label: 'Penjualan',
    group: 'Transaksi',
    description: 'Transaksi penjualan harian',
    templateNote: 'Gunakan KODE (bukan ID) untuk referensi. Format tanggal: YYYY-MM-DD. Semua baris akan di-INSERT sebagai transaksi baru.',
    columns: [
      { key: 'tanggal', label: 'Tanggal', required: true, type: 'date', example: '2026-01-15' },
      { key: 'kodeSales', label: 'Kode Sales', required: true, example: 'SLS-001' },
      { key: 'kodePart', label: 'Kode Part', required: true, example: 'PRT-001' },
      { key: 'kodeCustomer', label: 'Kode Customer', example: 'CST-001', note: 'Opsional' },
      { key: 'qty', label: 'Qty', required: true, type: 'number', example: 5 },
      { key: 'bonus', label: 'Bonus', type: 'number', example: 0 },
      { key: 'hargaSatuan', label: 'Harga Satuan', required: true, type: 'number', example: 45000 },
      { key: 'diskon', label: 'Diskon', type: 'number', example: 0 },
    ],
  },

  target: {
    key: 'target',
    label: 'Target',
    group: 'Transaksi',
    description: 'Target omzet per sales per bulan',
    templateNote: 'Format periode: YYYY-MM-01 (tanggal 1 setiap bulan). Upsert — kalau sudah ada, akan di-update.',
    columns: [
      { key: 'periode', label: 'Periode', required: true, type: 'date', example: '2026-01-01' },
      { key: 'kodeSales', label: 'Kode Sales', required: true, example: 'SLS-001' },
      { key: 'targetOmzet', label: 'Target Omzet', required: true, type: 'number', example: 35000000 },
    ],
  },

  faktur: {
    key: 'faktur',
    label: 'Faktur + Hutang',
    group: 'Transaksi',
    description: 'Buat faktur beserta detail item & hutang',
    templateNote: '1 faktur = beberapa baris di Excel (1 baris per item). Nomor faktur & tanggal harus SAMA untuk item yang sama. PPN otomatis 11% dari subtotal. Hutang otomatis dibuat.',
    columns: [
      { key: 'nomorFaktur', label: 'Nomor Faktur', required: true, example: 'INV-2026-0041', note: 'Sama untuk semua item di faktur yang sama' },
      { key: 'tanggal', label: 'Tanggal', required: true, type: 'date', example: '2026-01-15' },
      { key: 'jatuhTempo', label: 'Jatuh Tempo', required: true, type: 'date', example: '2026-02-14' },
      { key: 'kodeSales', label: 'Kode Sales', required: true, example: 'SLS-001' },
      { key: 'kodeCustomer', label: 'Kode Customer', example: 'CST-001' },
      { key: 'kodePart', label: 'Kode Part', required: true, example: 'PRT-001' },
      { key: 'qty', label: 'Qty', required: true, type: 'number', example: 3 },
      { key: 'bonus', label: 'Bonus', type: 'number', example: 0 },
      { key: 'hargaSatuan', label: 'Harga Satuan', required: true, type: 'number', example: 45000 },
    ],
  },
}

// Group entities untuk UI
export const ENTITY_GROUPS = ['Master Data', 'Produk', 'Transaksi'] as const