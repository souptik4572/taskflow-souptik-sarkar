import { cn } from '../lib/utils'
import type { TaskStatus } from '../lib/types'

const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
  todo: { label: 'To Do', className: 'bg-muted text-muted-foreground' },
  in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  done: { label: 'Done', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  const { label, className } = statusConfig[status]
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', className)}>
      {label}
    </span>
  )
}
