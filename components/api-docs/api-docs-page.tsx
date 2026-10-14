'use client'

import Link from 'next/link'
import { ArrowLeft, BookOpen, Key, AlertCircle, Code, Database, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EndpointCard } from './endpoint-card'
import { EndpointGetCard } from './endpoint-get-card'

export function ApiDocsPage({ baseUrl }: { baseUrl: string }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">API Documentation</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Panduan integrasi ERP ke Sales Dashboard
          </p>
        </div>
        <Link href="/dashboard/api-keys">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
        </Link>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Code className="h-4 w-4 text-blue-600" />
              <CardTitle className="text-sm">Base URL</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <code className="text-xs font-mono bg-background/60 rounded px-2 py-1.5 block break-all">
              {baseUrl}
            </code>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-900">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-emerald-600" />
              <CardTitle className="text-sm">Authentication</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <code className="text-xs font-mono bg-background/60 rounded px-2 py-1.5 block">
              X-API-Key: sk_live_xxx
            </code>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-600" />
              <CardTitle className="text-sm">Max Batch</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">500</p>
            <p className="text-xs text-muted-foreground">item per request</p>
          </CardContent>
        </Card>
      </div>

      {/* Warning: urutan sync */}
      <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-900">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <CardTitle className="text-sm">Urutan Sinkronisasi WAJIB</CardTitle>
          </div>
          <CardDescription className="text-orange-900/80 dark:text-orange-200/80">
            Karena ada relasi antar tabel, ikuti urutan ini:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <Badge variant="outline" className="bg-background">1. Cabang</Badge>
            <span className="text-muted-foreground">→</span>
            <Badge variant="outline" className="bg-background">2. Merk, Jenis</Badge>
            <span className="text-muted-foreground">→</span>
            <Badge variant="outline" className="bg-background">3. Customer</Badge>
            <span className="text-muted-foreground">→</span>
            <Badge variant="outline" className="bg-background">4. Sales</Badge>
            <span className="text-muted-foreground">→</span>
            <Badge variant="outline" className="bg-background">5. Bahan</Badge>
            <span className="text-muted-foreground">→</span>
            <Badge variant="outline" className="bg-background">6. Part</Badge>
            <span className="text-muted-foreground">→</span>
            <Badge variant="outline" className="bg-background">7. Target</Badge>
            <span className="text-muted-foreground">→</span>
            <Badge variant="outline" className="bg-background">8. Penjualan</Badge>
            <span className="text-muted-foreground">→</span>
            <Badge variant="outline" className="bg-background">9. Faktur</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="master" className="space-y-4">
        <TabsList>
          <TabsTrigger value="master">Master Data</TabsTrigger>
          <TabsTrigger value="transaksi">Transaksi</TabsTrigger>
          <TabsTrigger value="response">Response</TabsTrigger>
        </TabsList>

        {/* MASTER DATA */}
        <TabsContent value="master" className="space-y-4">
          <EndpointGetCard
            name="Cabang"
            endpoint="/api/v1/cabang"
            baseUrl={baseUrl}
            bodyKey="cabang"
          />
          <EndpointCard
            name="Cabang"
            description="Sinkronisasi data master cabang"
            endpoint="/api/v1/cabang"
            bodyKey="cabang"
            baseUrl={baseUrl}
            bodyExample={{
              externalId: 'ERP-CBG-001',
              kode: 'BDG',
              nama: 'Cabang Bandung',
              wilayah: 'Jawa Barat',
              alamat: 'Jl. Asia Afrika No. 1',
            }}
            fields={[
              { name: 'externalId', required: false, type: 'string', note: 'ID unik dari ERP (untuk idempotency)' },
              { name: 'kode', required: true, type: 'string', note: 'Max 20 karakter, unik' },
              { name: 'nama', required: true, type: 'string', note: 'Max 100 karakter' },
              { name: 'wilayah', required: false, type: 'string', note: '' },
              { name: 'alamat', required: false, type: 'string', note: '' },
              { name: 'deleted', required: false, type: 'boolean', note: 'true untuk soft delete' },
            ]}
            responseExample={{
              success: true, created: 1, updated: 0, deleted: 0, skipped: 0, failed: 0, errors: [],
            }}
          />

          <EndpointGetCard
            name="Sales"
            endpoint="/api/v1/sales"
            baseUrl={baseUrl}
            bodyKey="sales"
          />
          <EndpointCard
            name="Sales"
            description="Sinkronisasi data master sales (butuh kodeCabang yang sudah ada)"
            endpoint="/api/v1/sales"
            bodyKey="sales"
            baseUrl={baseUrl}
            notes={['Field kodeCabang harus cocok dengan kode cabang yang sudah di-sync']}
            bodyExample={{
              externalId: 'ERP-SLS-101',
              kode: 'SLS-101',
              nama: 'Gunawan',
              kodeCabang: 'BDG',
              telepon: '081234567101',
              aktif: true,
            }}
            fields={[
              { name: 'externalId', required: false, type: 'string', note: '' },
              { name: 'kode', required: true, type: 'string', note: 'Unik' },
              { name: 'nama', required: true, type: 'string', note: '' },
              { name: 'kodeCabang', required: true, type: 'string', note: 'Harus cocok dengan Cabang yang ada' },
              { name: 'telepon', required: false, type: 'string', note: '' },
              { name: 'aktif', required: false, type: 'boolean', note: 'Default: true' },
              { name: 'deleted', required: false, type: 'boolean', note: '' },
            ]}
            responseExample={{
              success: true, created: 1, updated: 0, deleted: 0, skipped: 0, failed: 0, errors: [],
            }}
          />

          <EndpointGetCard
            name="Customer"
            endpoint="/api/v1/customers"
            baseUrl={baseUrl}
            bodyKey="customers"
          />
          <EndpointCard
            name="Customer"
            description="Sinkronisasi data master customer / perusahaan"
            endpoint="/api/v1/customers"
            bodyKey="customers"
            baseUrl={baseUrl}
            bodyExample={{
              externalId: 'ERP-CST-101',
              kode: 'CST-101',
              nama: 'Toko Barokah Motor',
              alamat: 'Jl. Merdeka No. 10',
              telepon: '022-1112222',
              aktif: true,
            }}
            fields={[
              { name: 'externalId', required: false, type: 'string', note: '' },
              { name: 'kode', required: true, type: 'string', note: 'Unik' },
              { name: 'nama', required: true, type: 'string', note: '' },
              { name: 'alamat', required: false, type: 'string', note: '' },
              { name: 'telepon', required: false, type: 'string', note: '' },
              { name: 'aktif', required: false, type: 'boolean', note: 'Default: true' },
              { name: 'deleted', required: false, type: 'boolean', note: '' },
            ]}
            responseExample={{
              success: true, created: 1, updated: 0, deleted: 0, skipped: 0, failed: 0, errors: [],
            }}
          />

          <EndpointGetCard
            name="Merk"
            endpoint="/api/v1/merk"
            baseUrl={baseUrl}
            bodyKey="merk"
          />
          <EndpointCard
            name="Merk"
            description="Sinkronisasi data master merk produk"
            endpoint="/api/v1/merk"
            bodyKey="merk"
            baseUrl={baseUrl}
            bodyExample={{
              externalId: 'ERP-MRK-001',
              kode: 'MRK-BMW',
              nama: 'BMW',
            }}
            fields={[
              { name: 'externalId', required: false, type: 'string', note: '' },
              { name: 'kode', required: true, type: 'string', note: 'Unik' },
              { name: 'nama', required: true, type: 'string', note: '' },
              { name: 'deleted', required: false, type: 'boolean', note: '' },
            ]}
            responseExample={{
              success: true, created: 1, updated: 0, deleted: 0, skipped: 0, failed: 0, errors: [],
            }}
          />

          <EndpointGetCard
            name="Jenis"
            endpoint="/api/v1/jenis"
            baseUrl={baseUrl}
            bodyKey="jenis"
          />
          <EndpointCard
            name="Jenis"
            description="Sinkronisasi data master jenis produk"
            endpoint="/api/v1/jenis"
            bodyKey="jenis"
            baseUrl={baseUrl}
            bodyExample={{
              externalId: 'ERP-JNS-001',
              kode: 'JNS-LMP',
              nama: 'Lampu',
            }}
            fields={[
              { name: 'externalId', required: false, type: 'string', note: '' },
              { name: 'kode', required: true, type: 'string', note: 'Unik' },
              { name: 'nama', required: true, type: 'string', note: '' },
              { name: 'deleted', required: false, type: 'boolean', note: '' },
            ]}
            responseExample={{
              success: true, created: 1, updated: 0, deleted: 0, skipped: 0, failed: 0, errors: [],
            }}
          />

          <EndpointGetCard
            name="Bahan"
            endpoint="/api/v1/bahan"
            baseUrl={baseUrl}
            bodyKey="bahan"
          />
          <EndpointCard
            name="Bahan"
            description="Sinkronisasi data master bahan (butuh Merk + Jenis yang sudah ada)"
            endpoint="/api/v1/bahan"
            bodyKey="bahan"
            baseUrl={baseUrl}
            notes={['Butuh kodeMerk dan kodeJenis yang sudah di-sync']}
            bodyExample={{
              externalId: 'ERP-BHN-101',
              kode: 'BHN-101',
              nama: 'Lampu LED Yamaha',
              kodeMerk: 'MRK-YMH',
              kodeJenis: 'JNS-LMP',
            }}
            fields={[
              { name: 'externalId', required: false, type: 'string', note: '' },
              { name: 'kode', required: true, type: 'string', note: 'Unik' },
              { name: 'nama', required: true, type: 'string', note: '' },
              { name: 'kodeMerk', required: true, type: 'string', note: 'Harus cocok dengan Merk' },
              { name: 'kodeJenis', required: true, type: 'string', note: 'Harus cocok dengan Jenis' },
              { name: 'deleted', required: false, type: 'boolean', note: '' },
            ]}
            responseExample={{
              success: true, created: 1, updated: 0, deleted: 0, skipped: 0, failed: 0, errors: [],
            }}
          />

          <EndpointGetCard
            name="Part"
            endpoint="/api/v1/parts"
            baseUrl={baseUrl}
            bodyKey="parts"
          />
          <EndpointCard
            name="Part"
            description="Sinkronisasi data master part (butuh Bahan yang sudah ada)"
            endpoint="/api/v1/parts"
            bodyKey="parts"
            baseUrl={baseUrl}
            bodyExample={{
              externalId: 'ERP-PRT-101',
              kode: 'PRT-101',
              nama: 'LED Yamaha 12V',
              kodeBahan: 'BHN-101',
              satuan: 'PCS',
              hargaJual: 125000,
              hargaBeli: 95000,
              aktif: true,
            }}
            fields={[
              { name: 'externalId', required: false, type: 'string', note: '' },
              { name: 'kode', required: true, type: 'string', note: 'Unik' },
              { name: 'nama', required: true, type: 'string', note: '' },
              { name: 'kodeBahan', required: true, type: 'string', note: 'Harus cocok dengan Bahan' },
              { name: 'satuan', required: true, type: 'string', note: 'PCS, SET, BOX, LITER, KG' },
              { name: 'hargaJual', required: true, type: 'number', note: 'Tanpa titik/koma' },
              { name: 'hargaBeli', required: false, type: 'number', note: '' },
              { name: 'aktif', required: false, type: 'boolean', note: 'Default: true' },
              { name: 'deleted', required: false, type: 'boolean', note: '' },
            ]}
            responseExample={{
              success: true, created: 1, updated: 0, deleted: 0, skipped: 0, failed: 0, errors: [],
            }}
          />
        </TabsContent>

        {/* TRANSAKSI */}
        <TabsContent value="transaksi" className="space-y-4">
          <EndpointGetCard
            name="Target"
            endpoint="/api/v1/target"
            baseUrl={baseUrl}
            bodyKey="target"
          />
          <EndpointCard
            name="Target"
            description="Sinkronisasi target omzet per sales per bulan (upsert by periode+sales)"
            endpoint="/api/v1/target"
            bodyKey="target"
            baseUrl={baseUrl}
            notes={['Format periode: YYYY-MM-01 (tanggal 1 setiap bulan)']}
            bodyExample={{
              externalId: 'ERP-TGT-2026-01-SLS101',
              periode: '2026-01-01',
              kodeSales: 'SLS-101',
              targetOmzet: 40000000,
            }}
            fields={[
              { name: 'externalId', required: false, type: 'string', note: '' },
              { name: 'periode', required: true, type: 'string', note: 'Format: YYYY-MM-01' },
              { name: 'kodeSales', required: true, type: 'string', note: '' },
              { name: 'targetOmzet', required: true, type: 'number', note: '' },
              { name: 'deleted', required: false, type: 'boolean', note: '' },
            ]}
            responseExample={{
              success: true, created: 1, updated: 0, deleted: 0, skipped: 0, failed: 0, errors: [],
            }}
          />

          <EndpointGetCard
            name="Penjualan"
            endpoint="/api/v1/penjualan"
            baseUrl={baseUrl}
            bodyKey="penjualan"
          />
          <EndpointCard
            name="Penjualan"
            description="Sinkronisasi transaksi penjualan harian"
            endpoint="/api/v1/penjualan"
            bodyKey="penjualan"
            baseUrl={baseUrl}
            notes={[
              'WAJIB pakai externalId untuk idempotency — tanpa externalId akan selalu INSERT',
              'Format tanggal: YYYY-MM-DD',
              'Max batch: 1000 item',
            ]}
            bodyExample={{
              externalId: 'ERP-SO-2026-00001',
              tanggal: '2026-10-01',
              kodeSales: 'SLS-001',
              kodePart: 'PRT-001',
              kodeCustomer: 'CST-001',
              qty: 5,
              bonus: 0,
              hargaSatuan: 45000,
              diskon: 0,
            }}
            fields={[
              { name: 'externalId', required: true, type: 'string', note: 'Sangat disarankan untuk idempotency' },
              { name: 'tanggal', required: true, type: 'string', note: 'Format: YYYY-MM-DD' },
              { name: 'kodeSales', required: true, type: 'string', note: '' },
              { name: 'kodePart', required: true, type: 'string', note: '' },
              { name: 'kodeCustomer', required: false, type: 'string', note: '' },
              { name: 'qty', required: true, type: 'number', note: 'Harus > 0' },
              { name: 'bonus', required: false, type: 'number', note: 'Default: 0' },
              { name: 'hargaSatuan', required: true, type: 'number', note: '' },
              { name: 'diskon', required: false, type: 'number', note: 'Default: 0' },
              { name: 'deleted', required: false, type: 'boolean', note: 'Butuh externalId' },
            ]}
            responseExample={{
              success: true, created: 1, updated: 0, deleted: 0, skipped: 0, failed: 0, errors: [],
            }}
          />

          <EndpointGetCard
            name="Faktur"
            endpoint="/api/v1/faktur"
            baseUrl={baseUrl}
            bodyKey="faktur"
          />
          <EndpointCard
            name="Faktur"
            description="Sinkronisasi faktur (1 nomorFaktur = beberapa baris item)"
            endpoint="/api/v1/faktur"
            bodyKey="faktur"
            baseUrl={baseUrl}
            notes={[
              'Baris dengan nomorFaktur sama akan digabung jadi 1 faktur',
              'PPN 11% otomatis dihitung dari subtotal DPP',
              'Hutang otomatis dibuat saat faktur dibuat',
              'Kalau nomorFaktur sudah ada → dilewati (tidak di-update)',
            ]}
            bodyExample={[
              {
                externalId: 'ERP-INV-2026-0001-1',
                nomorFaktur: 'INV-2026-0101',
                tanggal: '2026-10-05',
                jatuhTempo: '2026-11-04',
                kodeSales: 'SLS-001',
                kodeCustomer: 'CST-101',
                kodePart: 'PRT-001',
                qty: 10,
                bonus: 0,
                hargaSatuan: 45000,
              },
              {
                externalId: 'ERP-INV-2026-0001-2',
                nomorFaktur: 'INV-2026-0101',
                tanggal: '2026-10-05',
                jatuhTempo: '2026-11-04',
                kodeSales: 'SLS-001',
                kodeCustomer: 'CST-101',
                kodePart: 'PRT-008',
                qty: 5,
                bonus: 1,
                hargaSatuan: 65000,
              },
            ]}
            fields={[
              { name: 'externalId', required: false, type: 'string', note: 'Unik per baris' },
              { name: 'nomorFaktur', required: true, type: 'string', note: 'Sama untuk semua item faktur' },
              { name: 'tanggal', required: true, type: 'string', note: 'Format: YYYY-MM-DD' },
              { name: 'jatuhTempo', required: true, type: 'string', note: 'Format: YYYY-MM-DD' },
              { name: 'kodeSales', required: true, type: 'string', note: '' },
              { name: 'kodeCustomer', required: false, type: 'string', note: '' },
              { name: 'kodePart', required: true, type: 'string', note: '' },
              { name: 'qty', required: true, type: 'number', note: '' },
              { name: 'bonus', required: false, type: 'number', note: '' },
              { name: 'hargaSatuan', required: true, type: 'number', note: '' },
              { name: 'deleted', required: false, type: 'boolean', note: 'Kirim dengan nomorFaktur untuk soft delete faktur' },
            ]}
            responseExample={{
              success: true, created: 1, updated: 0, deleted: 0, skipped: 0, failed: 0, errors: [],
            }}
          />
        </TabsContent>

        {/* RESPONSE */}
        <TabsContent value="response" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Response Standard</CardTitle>
              <CardDescription>Semua endpoint POST mengembalikan format yang sama</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="rounded-md bg-slate-950 text-slate-100 text-xs p-3 overflow-x-auto">
{`{
  "success": true,
  "created": 3,
  "updated": 2,
  "deleted": 0,
  "skipped": 0,
  "failed": 0,
  "errors": []
}`}
              </pre>
              <div className="mt-3 space-y-1.5 text-xs">
                <p><strong>success:</strong> true jika failed === 0</p>
                <p><strong>created:</strong> jumlah data baru</p>
                <p><strong>updated:</strong> jumlah data yang di-update</p>
                <p><strong>deleted:</strong> jumlah data yang di-soft delete</p>
                <p><strong>skipped:</strong> jumlah data yang dilewati</p>
                <p><strong>failed:</strong> jumlah data yang gagal</p>
                <p><strong>errors:</strong> array detail error per baris</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Format Error Item</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="rounded-md bg-slate-950 text-slate-100 text-xs p-3 overflow-x-auto">
{`{
  "errors": [
    {
      "index": 0,
      "kode": "CUST-001",
      "externalId": "ERP-CST-001",
      "message": "kode & nama wajib diisi"
    }
  ]
}`}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">HTTP Status Codes</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                <div className="px-4 py-2 flex items-center gap-3 text-sm">
                  <Badge className="bg-emerald-600 hover:bg-emerald-600">200</Badge>
                  <span className="flex-1">Sukses (cek field `failed` untuk detail)</span>
                </div>
                <div className="px-4 py-2 flex items-center gap-3 text-sm">
                  <Badge className="bg-amber-600 hover:bg-amber-600">400</Badge>
                  <span className="flex-1">Body invalid / lebih dari limit</span>
                </div>
                <div className="px-4 py-2 flex items-center gap-3 text-sm">
                  <Badge variant="destructive">401</Badge>
                  <span className="flex-1">API Key salah / tidak ada</span>
                </div>
                <div className="px-4 py-2 flex items-center gap-3 text-sm">
                  <Badge variant="destructive">500</Badge>
                  <span className="flex-1">Server error — lapor tim dashboard</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}