import { cn } from '../lib/utils'
import type { TaskStatus } from '../lib/types'

const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
  todo: { label: 'To Do', className: 'bg-slate-100 text-slate-700' },
  in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-700' },
  done: { label: 'Done', className: 'bg-green-100 text-green-700' },
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  const { label, className } = statusConfig[status]
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', className)}>
      {label}
    </span>
  )
}
