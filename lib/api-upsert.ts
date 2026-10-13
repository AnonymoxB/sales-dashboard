export type UpsertError = {
  index: number
  kode?: string
  externalId?: string
  nomorFaktur?: string
  message: string
}

export type UpsertResult = {
  created: number
  updated: number
  deleted: number
  skipped: number
  failed: number
  errors: UpsertError[]
}

export function emptyResult(): UpsertResult {
  return { created: 0, updated: 0, deleted: 0, skipped: 0, failed: 0, errors: [] }
}

export function extractArray<T>(body: unknown, key: string): T[] {
  if (Array.isArray(body)) return body as T[]
  if (body && typeof body === 'object') {
    const obj = body as Record<string, unknown>
    if (Array.isArray(obj[key])) return obj[key] as T[]
    if ('kode' in obj || 'externalId' in obj || 'nomorFaktur' in obj) return [body as T]
  }
  return []
}

export function normalizeBool(v: unknown, defaultVal = true): boolean {
  if (v === undefined || v === null) return defaultVal
  if (typeof v === 'boolean') return v
  const s = String(v).toLowerCase().trim()
  return s === 'true' || s === '1' || s === 'ya' || s === 'yes'
}

export function str(v: unknown): string {
  return String(v ?? '').trim()
}

export function num(v: unknown): number {
  const n = Number(v ?? 0)
  return isNaN(n) ? 0 : n
}