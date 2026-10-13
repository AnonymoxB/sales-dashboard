import * as XLSX from 'xlsx'
import type { ColumnDef } from './config'

// Generate template Excel — sheet Data hanya header, contoh & petunjuk di sheet terpisah
export function generateTemplate(entity: string, columns: ColumnDef[], note?: string): Buffer {
  const wb = XLSX.utils.book_new()

  // ============================================
  // Sheet 1: Data — hanya header
  // ============================================
  const headers = columns.map((c) => c.label)
  const dataSheet = XLSX.utils.aoa_to_sheet([headers])

  dataSheet['!cols'] = columns.map((c) => ({
    wch: Math.max(c.label.length + 4, 20),
  }))

  XLSX.utils.book_append_sheet(wb, dataSheet, 'Data')

  // ============================================
  // Sheet 2: Petunjuk — lengkap dengan contoh
  // ============================================
  const petunjuk: (string | number)[][] = [
    ['PETUNJUK PENGISIAN'],
    [''],
    ['1. Isi data di sheet "Data" mulai dari baris ke-2 (baris ke-1 = header)'],
    ['2. JANGAN ubah nama kolom di baris pertama'],
    ['3. Hapus baris yang tidak dipakai (jangan sisakan baris kosong di tengah data)'],
    ['4. Lihat "CONTOH PENGISIAN" di bawah untuk format yang benar'],
    [''],
    ['KETERANGAN KOLOM:'],
    ['Kolom', 'Wajib', 'Tipe', 'Keterangan'],
    ...columns.map((c) => [
      c.label,
      c.required ? 'Ya' : 'Tidak',
      c.type ?? 'string',
      c.note ?? '',
    ]),
    [''],
    ['CONTOH PENGISIAN:'],
    headers,
    columns.map((c) => c.example ?? ''),
  ]

  if (note) {
    petunjuk.push([''], ['CATATAN TAMBAHAN:'], [note])
  }

  const petunjukSheet = XLSX.utils.aoa_to_sheet(petunjuk)
  petunjukSheet['!cols'] = [{ wch: 25 }, { wch: 10 }, { wch: 10 }, { wch: 50 }]
  XLSX.utils.book_append_sheet(wb, petunjukSheet, 'Petunjuk')

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
}

// Generate export Excel dari data
export function generateExport(
  entity: string,
  columns: ColumnDef[],
  rows: Record<string, unknown>[]
): Buffer {
  const wb = XLSX.utils.book_new()

  const headers = columns.map((c) => c.label)
  const data = [headers, ...rows.map((r) => columns.map((c) => r[c.key] ?? ''))]

  const ws = XLSX.utils.aoa_to_sheet(data)
  ws['!cols'] = columns.map((c) => ({ wch: Math.max(c.label.length + 4, 18) }))
  ws['!freeze'] = { xSplit: 0, ySplit: 1 }

  XLSX.utils.book_append_sheet(wb, ws, 'Data')

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
}

// Parse Excel yang diupload — baris 1 = header, baris 2+ = data
export function parseExcel(buffer: Buffer): Record<string, unknown>[] {
  const wb = XLSX.read(buffer, { type: 'buffer' })
  const ws = wb.Sheets['Data']
  if (!ws) throw new Error('Sheet "Data" tidak ditemukan di file')

  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
    defval: '',
    raw: false,
  })

  // Filter baris yang semua kolomnya kosong
  return raw.filter((row) =>
    Object.values(row).some((v) => String(v ?? '').trim() !== '')
  )
}