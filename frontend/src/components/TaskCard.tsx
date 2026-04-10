import { format } from 'date-fns'
import { Calendar, User } from 'lucide-react'
import { StatusBadge } from './StatusBadge'
import { PriorityBadge } from './PriorityBadge'
import type { Task } from '../lib/types'

interface TaskCardProps {
  task: Task
  onClick: () => void
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white border border-border rounded-lg p-4 cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-medium text-sm leading-snug">{task.title}</h4>
        <div className="flex items-center gap-1.5 shrink-0">
          <PriorityBadge priority={task.priority} />
        </div>
      </div>

      {task.description && (
        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center gap-3 mt-3 flex-wrap">
        <StatusBadge status={task.status} />

        {task.assignee && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <User className="w-3 h-3" />
            {task.assignee.name}
          </span>
        )}

        {task.dueDate && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            {format(new Date(task.dueDate), 'MMM d')}
          </span>
        )}
      </div>
    </div>
  )
}
