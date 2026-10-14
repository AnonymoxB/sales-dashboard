type RateLimitEntry = {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Config
const LIMIT = 60            // 60 request
const WINDOW_MS = 60_000    // per 1 menit

// Cleanup setiap 5 menit
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) store.delete(key)
  }
}, 5 * 60_000)

export type RateLimitResult = {
  ok: boolean
  remaining: number
  resetAt: number
  limit: number
}

export function checkRateLimit(identifier: string): RateLimitResult {
  const now = Date.now()
  const entry = store.get(identifier)

  // Window baru
  if (!entry || entry.resetAt < now) {
    const resetAt = now + WINDOW_MS
    store.set(identifier, { count: 1, resetAt })
    return { ok: true, remaining: LIMIT - 1, resetAt, limit: LIMIT }
  }

  // Limit tercapai
  if (entry.count >= LIMIT) {
    return { ok: false, remaining: 0, resetAt: entry.resetAt, limit: LIMIT }
  }

  // Increment
  entry.count++
  return {
    ok: true,
    remaining: LIMIT - entry.count,
    resetAt: entry.resetAt,
    limit: LIMIT,
  }
}

export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.floor(result.resetAt / 1000)),
  }
}