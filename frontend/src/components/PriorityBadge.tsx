import { cn } from '../lib/utils'
import type { TaskPriority } from '../lib/types'

const priorityConfig: Record<TaskPriority, { label: string; className: string }> = {
  low: { label: 'Low', className: 'bg-gray-100 text-gray-600' },
  medium: { label: 'Medium', className: 'bg-yellow-100 text-yellow-700' },
  high: { label: 'High', className: 'bg-red-100 text-red-700' },
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const { label, className } = priorityConfig[priority]
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', className)}>
      {label}
    </span>
  )
}
