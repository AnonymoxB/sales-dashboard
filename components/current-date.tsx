'use client'

import { useEffect, useState } from 'react'

export function CurrentDate({ format = 'month-year' }: { format?: 'month-year' | 'full' }) {
  const [text, setText] = useState('')

  useEffect(() => {
    const now = new Date()
    if (format === 'month-year') {
      setText(
        now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
      )
    } else {
      setText(now.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }))
    }
  }, [format])

  return <span suppressHydrationWarning>{text || '...'}</span>
}