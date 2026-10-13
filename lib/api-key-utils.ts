import { createHash, randomBytes } from 'crypto'

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

export function generateApiKey(): { plaintext: string; hash: string; prefix: string } {
  const bytes = randomBytes(24)
  const hex = bytes.toString('hex')
  const plaintext = `sk_live_${hex}`
  return {
    plaintext,
    hash: hashApiKey(plaintext),
    prefix: plaintext.slice(0, 16),
  }
}