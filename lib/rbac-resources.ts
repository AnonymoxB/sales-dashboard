export type Role = 'ADMIN' | 'MANAGER' | 'SALES'

export type ResourceGroup = {
  label: string
  type: 'page' | 'action'
  resources: {
    key: string          // "page:/dashboard/analitik" atau "action:master.delete"
    label: string
    description?: string
  }[]
}

export const RESOURCE_GROUPS: ResourceGroup[] = [
  {
    label: 'Halaman Dashboard',
    type: 'page',
    resources: [
      { key: 'page:/dashboard', label: 'Overview', description: 'Dashboard utama' },
      { key: 'page:/dashboard/analitik', label: 'Analitik', description: 'Laporan analitik' },
      { key: 'page:/dashboard/penjualan', label: 'Penjualan', description: 'List transaksi penjualan' },
      { key: 'page:/dashboard/target', label: 'Target', description: 'Set target sales' },
      { key: 'page:/dashboard/hutang', label: 'Hutang Barang', description: 'Faktur & piutang' },
    ],
  },
  {
    label: 'Halaman Master Data',
    type: 'page',
    resources: [
      { key: 'page:/dashboard/sales', label: 'Sales' },
      { key: 'page:/dashboard/cabang', label: 'Cabang' },
      { key: 'page:/dashboard/customer', label: 'Customer' },
      { key: 'page:/dashboard/produk', label: 'Produk' },
    ],
  },
  {
    label: 'Halaman Admin',
    type: 'page',
    resources: [
      { key: 'page:/dashboard/import-export', label: 'Import/Export' },
      { key: 'page:/dashboard/api-keys', label: 'API Keys' },
      { key: 'page:/dashboard/api-keys/logs', label: 'API Logs' },
      { key: 'page:/dashboard/trash', label: 'Trash' },
      { key: 'page:/dashboard/users', label: 'Users' },
      { key: 'page:/dashboard/settings/permissions', label: 'Manage Permissions' },
    ],
  },
  {
    label: 'Aksi Master Data',
    type: 'action',
    resources: [
      { key: 'action:master.create', label: 'Create Master', description: 'Tambah cabang/sales/produk/customer' },
      { key: 'action:master.update', label: 'Update Master', description: 'Edit master data' },
      { key: 'action:master.delete', label: 'Delete Master', description: 'Hapus master data' },
    ],
  },
  {
    label: 'Aksi Transaksi',
    type: 'action',
    resources: [
      { key: 'action:penjualan.create', label: 'Create Penjualan' },
      { key: 'action:penjualan.update', label: 'Update Penjualan' },
      { key: 'action:penjualan.delete', label: 'Delete Penjualan' },
      { key: 'action:target.manage', label: 'Manage Target' },
      { key: 'action:faktur.create', label: 'Create Faktur' },
      { key: 'action:faktur.delete', label: 'Delete Faktur' },
      { key: 'action:faktur.bayar', label: 'Bayar Hutang' },
    ],
  },
  {
    label: 'Aksi Admin',
    type: 'action',
    resources: [
      { key: 'action:admin.users', label: 'Manage Users' },
      { key: 'action:admin.api', label: 'Manage API Keys' },
      { key: 'action:admin.trash', label: 'Manage Trash' },
      { key: 'action:admin.import', label: 'Import/Export' },
      { key: 'action:admin.permissions', label: 'Manage Permissions' },
    ],
  },
]

export const ALL_RESOURCES = RESOURCE_GROUPS.flatMap((g) =>
  g.resources.map((r) => r.key)
)

export const DEFAULT_PERMISSIONS: Record<Role, string[]> = {
  ADMIN: [...ALL_RESOURCES], // Admin bisa semua
  MANAGER: [
    // Halaman
    'page:/dashboard',
    'page:/dashboard/analitik',
    'page:/dashboard/penjualan',
    'page:/dashboard/target',
    'page:/dashboard/hutang',
    'page:/dashboard/sales',
    'page:/dashboard/cabang',
    'page:/dashboard/customer',
    'page:/dashboard/produk',
    // Aksi Master
    'action:master.create',
    'action:master.update',
    // Aksi Transaksi
    'action:penjualan.create',
    'action:penjualan.update',
    'action:penjualan.delete',
    'action:target.manage',
    'action:faktur.create',
    'action:faktur.delete',
    'action:faktur.bayar',
  ],
  SALES: [
    // Halaman
    'page:/dashboard',
    'page:/dashboard/penjualan',
    'page:/dashboard/sales',
    'page:/dashboard/cabang',
    'page:/dashboard/customer',
    'page:/dashboard/produk',
    // Aksi
    'action:penjualan.create',
    'action:penjualan.update',
  ],
}