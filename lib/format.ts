export function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}

export function formatCompact(n: number) {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} M`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} Jt`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} Rb`
  return n.toString()
}

export function formatNumber(n: number) {
  return new Intl.NumberFormat('id-ID').format(n)
}