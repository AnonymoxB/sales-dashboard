'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { X, SlidersHorizontal, Lock } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { SearchableSelect } from '@/components/ui/searchable-select'

type Option = { id: number; kode: string; nama: string }

type FilterBarProps = {
  tahun: number
  bulan?: number
  idSales?: number
  idCustomer?: number
  idBahan?: number
  idJenis?: number
  idPart?: number
  idCabang?: number
  lockedCabangId?: number
  listSales: Option[]
  listCustomer: Option[]
  listBahan: Option[]
  listJenis: Option[]
  listPart: Option[]
  listCabang: Option[]
}

const BULAN = [
  { value: '1', label: 'Januari' },
  { value: '2', label: 'Februari' },
  { value: '3', label: 'Maret' },
  { value: '4', label: 'April' },
  { value: '5', label: 'Mei' },
  { value: '6', label: 'Juni' },
  { value: '7', label: 'Juli' },
  { value: '8', label: 'Agustus' },
  { value: '9', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' },
]

export function FilterBar(props: FilterBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentYear = new Date().getFullYear()
  const tahunOptions = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map(
    (y) => ({ value: String(y), label: String(y) })
  )

  const isCabangLocked = !!props.lockedCabangId

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (!value || value === 'all') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleReset = () => {
    router.push(pathname)
  }

  // Kalau cabang locked, jangan hitung filter cabang di "hasFilter" count
  const filteredParams = new URLSearchParams(searchParams.toString())
  if (isCabangLocked) filteredParams.delete('cabang')
  const hasFilter = filteredParams.toString().length > 0

  const salesOptions = props.listSales.map((s) => ({ value: String(s.id), label: s.nama }))
  const customerOptions = props.listCustomer.map((c) => ({ value: String(c.id), label: c.nama }))
  const bahanOptions = props.listBahan.map((b) => ({ value: String(b.id), label: b.nama }))
  const jenisOptions = props.listJenis.map((j) => ({ value: String(j.id), label: j.nama }))
  const partOptions = props.listPart.map((p) => ({ value: String(p.id), label: `${p.kode} — ${p.nama}` }))
  const cabangOptions = props.listCabang.map((c) => ({ value: String(c.id), label: c.nama }))

  return (
    <div className="rounded-lg border bg-card p-4">
      {/* Header filter */}
      <div className="mb-3 flex items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-semibold">Filter Data</span>
        {isCabangLocked && (
          <span className="flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-950/50 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
            <Lock className="h-3 w-3" />
            Terkunci ke cabang Anda
          </span>
        )}
        {hasFilter && (
          <button
            onClick={handleReset}
            className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
            Reset filter
          </button>
        )}
      </div>

      {/* Grid filter dengan label */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {/* TAHUN */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Tahun</Label>
          <SearchableSelect
            value={String(props.tahun)}
            onValueChange={(v) => updateFilter('tahun', v)}
            options={tahunOptions}
            placeholder="Pilih Tahun"
          />
        </div>

        {/* BULAN */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Bulan</Label>
          <SearchableSelect
            value={props.bulan ? String(props.bulan) : 'all'}
            onValueChange={(v) => updateFilter('bulan', v)}
            options={BULAN}
            placeholder="Semua Bulan"
            allLabel="Semua Bulan"
          />
        </div>

        {/* CABANG — locked untuk non-ADMIN */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            Cabang
            {isCabangLocked && <Lock className="h-3 w-3 text-amber-600" />}
          </Label>
          <SearchableSelect
            value={props.idCabang ? String(props.idCabang) : 'all'}
            onValueChange={(v) => updateFilter('cabang', v)}
            options={cabangOptions}
            placeholder="Semua Cabang"
            allLabel="Semua Cabang"
            searchPlaceholder="Cari cabang..."
            disabled={isCabangLocked}
          />
        </div>

        {/* SALES */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Nama Sales</Label>
          <SearchableSelect
            value={props.idSales ? String(props.idSales) : 'all'}
            onValueChange={(v) => updateFilter('idSales', v)}
            options={salesOptions}
            placeholder="Semua Sales"
            allLabel="Semua Sales"
            searchPlaceholder="Cari sales..."
          />
        </div>

        {/* CUSTOMER */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Customer</Label>
          <SearchableSelect
            value={props.idCustomer ? String(props.idCustomer) : 'all'}
            onValueChange={(v) => updateFilter('idCustomer', v)}
            options={customerOptions}
            placeholder="Semua Customer"
            allLabel="Semua Customer"
            searchPlaceholder="Cari customer..."
          />
        </div>

        {/* BAHAN */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Bahan</Label>
          <SearchableSelect
            value={props.idBahan ? String(props.idBahan) : 'all'}
            onValueChange={(v) => updateFilter('idBahan', v)}
            options={bahanOptions}
            placeholder="Semua Bahan"
            allLabel="Semua Bahan"
            searchPlaceholder="Cari bahan..."
          />
        </div>

        {/* JENIS */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Jenis</Label>
          <SearchableSelect
            value={props.idJenis ? String(props.idJenis) : 'all'}
            onValueChange={(v) => updateFilter('idJenis', v)}
            options={jenisOptions}
            placeholder="Semua Jenis"
            allLabel="Semua Jenis"
            searchPlaceholder="Cari jenis..."
          />
        </div>

        {/* PART */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Part</Label>
          <SearchableSelect
            value={props.idPart ? String(props.idPart) : 'all'}
            onValueChange={(v) => updateFilter('idPart', v)}
            options={partOptions}
            placeholder="Semua Part"
            allLabel="Semua Part"
            searchPlaceholder="Cari part..."
          />
        </div>
      </div>
    </div>
  )
}