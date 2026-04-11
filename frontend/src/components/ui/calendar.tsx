import { DayPicker } from 'react-day-picker'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../lib/utils'

export type CalendarProps = React.ComponentProps<typeof DayPicker>

export function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col space-y-4',
        month: 'space-y-3',
        month_caption: 'flex justify-center pt-1 relative items-center',
        caption_label: 'text-sm font-semibold',
        nav: 'flex items-center gap-1',
        button_previous: cn(
          'absolute left-1 h-7 w-7 rounded-lg flex items-center justify-center',
          'text-muted-foreground hover:text-foreground',
          'hover:bg-white/30 dark:hover:bg-white/10 transition-colors'
        ),
        button_next: cn(
          'absolute right-1 h-7 w-7 rounded-lg flex items-center justify-center',
          'text-muted-foreground hover:text-foreground',
          'hover:bg-white/30 dark:hover:bg-white/10 transition-colors'
        ),
        month_grid: 'w-full border-collapse space-y-1',
        weekdays: 'flex',
        weekday: 'text-muted-foreground rounded-md w-8 font-normal text-[0.75rem] text-center',
        week: 'flex w-full mt-1',
        day: cn(
          'relative p-0 text-center text-sm focus-within:relative focus-within:z-20',
          '[&:has([aria-selected])]:bg-primary/10 [&:has([aria-selected])]:rounded-lg'
        ),
        day_button: cn(
          'h-8 w-8 rounded-lg text-sm font-normal transition-all duration-150',
          'hover:bg-white/40 dark:hover:bg-white/15 hover:text-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'aria-selected:bg-primary aria-selected:text-primary-foreground aria-selected:hover:bg-primary aria-selected:font-semibold aria-selected:shadow-sm'
        ),
        range_start: '[&>button]:rounded-l-lg',
        range_end: '[&>button]:rounded-r-lg',
        selected: '[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:font-semibold',
        today: '[&>button]:ring-1 [&>button]:ring-primary/40 [&>button]:font-semibold',
        outside: '[&>button]:text-muted-foreground/40 [&>button]:aria-selected:bg-accent/50 [&>button]:aria-selected:text-muted-foreground',
        disabled: '[&>button]:text-muted-foreground/30 [&>button]:pointer-events-none',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === 'left'
            ? <ChevronLeft className="h-4 w-4" />
            : <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  )
}
