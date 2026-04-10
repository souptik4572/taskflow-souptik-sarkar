import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { format } from 'date-fns'
import { Calendar, User } from 'lucide-react'
import { StatusBadge } from './StatusBadge'
import { PriorityBadge } from './PriorityBadge'
import type { Task, TaskStatus } from '../lib/types'

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: 'todo', label: 'To Do' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'done', label: 'Done' },
]

interface KanbanCardProps {
  task: Task
  onClick: () => void
  isDragging?: boolean
}

function KanbanCard({ task, onClick, isDragging = false }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging } =
    useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`bg-card border border-border rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-primary/50 hover:shadow-sm transition-all select-none ${isDragging ? 'shadow-lg rotate-1' : ''}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-sm font-medium leading-snug line-clamp-2">{task.title}</span>
        <PriorityBadge priority={task.priority} />
      </div>

      {task.description && (
        <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{task.description}</p>
      )}

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {task.assignee && (
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {task.assignee.name}
          </span>
        )}
        {task.dueDate && (
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {format(new Date(task.dueDate), 'MMM d')}
          </span>
        )}
      </div>
    </div>
  )
}

function DragOverlayCard({ task }: { task: Task }) {
  return (
    <div className="bg-card border border-primary rounded-lg p-3 shadow-xl rotate-2 select-none w-64">
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-sm font-medium leading-snug line-clamp-2">{task.title}</span>
        <PriorityBadge priority={task.priority} />
      </div>
      <StatusBadge status={task.status} />
    </div>
  )
}

interface KanbanBoardProps {
  tasks: Task[]
  onTaskClick: (task: Task) => void
  onStatusChange: (taskId: string, status: TaskStatus) => Promise<void>
}

export function KanbanBoard({ tasks, onTaskClick, onStatusChange }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const tasksByColumn = (colId: TaskStatus) => tasks.filter((t) => t.status === colId)

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id)
    setActiveTask(task ?? null)
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null)
    const { active, over } = event
    if (!over) return

    const draggedTask = tasks.find((t) => t.id === active.id)
    if (!draggedTask) return

    // Determine target column: `over.id` is either a task id or a column id
    let targetStatus: TaskStatus | null = null

    // Check if dropped on a column container
    if (COLUMNS.some((c) => c.id === over.id)) {
      targetStatus = over.id as TaskStatus
    } else {
      // Dropped on a task — find which column that task belongs to
      const overTask = tasks.find((t) => t.id === over.id)
      if (overTask) targetStatus = overTask.status
    }

    if (targetStatus && targetStatus !== draggedTask.status) {
      await onStatusChange(draggedTask.id, targetStatus)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map((col) => {
          const colTasks = tasksByColumn(col.id)
          return (
            <div
              key={col.id}
              id={col.id}
              className="flex flex-col gap-2"
            >
              <div className="flex items-center justify-between px-1 mb-1">
                <StatusBadge status={col.id} />
                <span className="text-xs text-muted-foreground">{colTasks.length}</span>
              </div>

              <div
                data-column={col.id}
                className="flex flex-col gap-2 min-h-[120px] p-2 rounded-lg bg-muted/30 border border-dashed border-border"
              >
                <SortableContext
                  items={colTasks.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {colTasks.map((task) => (
                    <KanbanCard
                      key={task.id}
                      task={task}
                      onClick={() => onTaskClick(task)}
                    />
                  ))}
                </SortableContext>

                {colTasks.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Drop tasks here
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <DragOverlay>
        {activeTask ? <DragOverlayCard task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
