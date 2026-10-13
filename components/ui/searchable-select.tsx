'use client'

import { useMemo, useState } from 'react'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

type Option = {
  value: string
  label: string
}

type SearchableSelectProps = {
  value?: string
  onValueChange: (value: string) => void
  options: Option[]
  placeholder?: string
  searchPlaceholder?: string
  allLabel?: string
  className?: string
  disabled?: boolean
}

export function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder = 'Pilih...',
  searchPlaceholder = 'Cari...',
  allLabel,
  className,
  disabled,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  // Gabung "Semua" option di depan kalau ada
  const allOptions: Option[] = useMemo(() => {
    if (allLabel) return [{ value: 'all', label: allLabel }, ...options]
    return options
  }, [options, allLabel])

  const filtered = useMemo(() => {
    if (!query) return allOptions
    const q = query.toLowerCase()
    return allOptions.filter((o) => o.label.toLowerCase().includes(q))
  }, [allOptions, query])

  const selected = allOptions.find((o) => o.value === value)
  const displayLabel = selected?.label ?? placeholder

  const handleSelect = (val: string) => {
    onValueChange(val)
    setOpen(false)
    setQuery('')
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (allLabel) {
      onValueChange('all')
    } else {
      onValueChange('')
    }
    setQuery('')
  }

  const showClear = value && value !== 'all' && !disabled

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              'h-9 w-full justify-between font-normal px-3',
              !selected && 'text-muted-foreground',
              className
            )}
          />
        }
      >
        <span className="truncate text-sm">{displayLabel}</span>
        <div className="flex items-center gap-1 shrink-0 ml-1">
          {showClear && (
            <span
              onClick={handleClear}
              className="rounded hover:bg-muted p-0.5 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </div>
      </PopoverTrigger>

      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
        sideOffset={4}
        style={{ minWidth: 240, maxWidth: 400 }}
      >
        {/* Search */}
        <div className="flex items-center gap-2 border-b px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            placeholder={searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-7 border-0 p-0 focus-visible:ring-0 text-sm shadow-none"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-muted-foreground hover:text-foreground"
              type="button"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* List */}
        <div className="max-h-[280px] overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              Tidak ada hasil untuk &ldquo;{query}&rdquo;
            </div>
          ) : (
            filtered.map((opt) => {
              const isSelected = opt.value === value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-sm text-left transition-colors',
                    'hover:bg-accent hover:text-accent-foreground',
                    isSelected && 'bg-accent/50'
                  )}
                >
                  <Check
                    className={cn(
                      'h-3.5 w-3.5 shrink-0',
                      isSelected ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <span className="truncate">{opt.label}</span>
                </button>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}