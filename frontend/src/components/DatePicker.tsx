import { useState } from 'react'
import { format, startOfDay } from 'date-fns'
import { CalendarIcon, X } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Calendar } from './ui/calendar'
import { cn } from '../lib/utils'

interface DatePickerProps {
  value: string        // ISO date string "YYYY-MM-DD", or empty string
  onChange: (value: string) => void
  placeholder?: string
  id?: string
}

export function DatePicker({ value, onChange, placeholder = 'Pick a date', id }: DatePickerProps) {
  const [open, setOpen] = useState(false)

  const selected = value ? new Date(`${value}T00:00:00`) : undefined
  const today = startOfDay(new Date())

  function handleSelect(date: Date | undefined) {
    onChange(date ? format(date, 'yyyy-MM-dd') : '')
    setOpen(false)
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation()
    onChange('')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          className={cn(
            'flex h-9 w-full items-center justify-between rounded-xl px-3 py-2 text-sm',
            'glass border-0 transition-all duration-200',
            'hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            !value && 'text-muted-foreground'
          )}
        >
          <span className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 shrink-0 opacity-60" />
            {value ? format(new Date(`${value}T00:00:00`), 'MMM d, yyyy') : placeholder}
          </span>

          {value && (
            <span
              role="button"
              aria-label="Clear date"
              onClick={handleClear}
              className="ml-1 rounded-md p-0.5 text-muted-foreground hover:text-foreground hover:bg-white/30 dark:hover:bg-white/10 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align="start">
        <div className="px-3 pt-3 pb-1 border-b border-white/10">
          <p className="text-xs font-medium text-muted-foreground">Select due date</p>
          <p className="text-[11px] text-muted-foreground/60 mt-0.5">Today or future dates only</p>
        </div>

        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          disabled={{ before: today }}
          defaultMonth={selected ?? today}
          initialFocus
        />

        {/* Quick-select shortcuts */}
        <div className="flex gap-1.5 px-3 pb-3 pt-1 border-t border-white/10">
          {[
            { label: 'Today', days: 0 },
            { label: 'Tomorrow', days: 1 },
            { label: '+7 days', days: 7 },
          ].map(({ label, days }) => {
            const d = new Date(today)
            d.setDate(d.getDate() + days)
            const iso = format(d, 'yyyy-MM-dd')
            return (
              <button
                key={label}
                type="button"
                onClick={() => { onChange(iso); setOpen(false) }}
                className={cn(
                  'flex-1 rounded-lg px-2 py-1 text-xs font-medium transition-all duration-150',
                  value === iso
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/30 dark:hover:bg-white/10'
                )}
              >
                {label}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
