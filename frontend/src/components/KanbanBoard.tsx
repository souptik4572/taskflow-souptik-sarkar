import React, { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
} from '@dnd-kit/core'
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { format } from 'date-fns'
import { Calendar, User, Pencil } from 'lucide-react'
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
  onEdit?: () => void
  isDragging?: boolean
}

function KanbanCard({ task, onClick, onEdit, isDragging = false }: KanbanCardProps) {
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
      className={`glass rounded-2xl p-3 cursor-grab active:cursor-grabbing hover:shadow-xl transition-all duration-200 select-none ${isDragging ? 'shadow-2xl rotate-1 scale-105' : ''}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-sm font-medium leading-snug line-clamp-2">{task.title}</span>
        <div className="flex items-center gap-1 shrink-0">
          {onEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit() }}
              onPointerDown={(e) => e.stopPropagation()}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/20 dark:hover:bg-white/10 transition-colors"
              aria-label={`Edit ${task.title}`}
            >
              <Pencil className="w-3 h-3" />
            </button>
          )}
          <PriorityBadge priority={task.priority} />
        </div>
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

function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col gap-2 min-h-[120px] p-2 rounded-2xl border border-dashed transition-all duration-200 ${
        isOver
          ? 'bg-primary/10 dark:bg-primary/15 border-primary/40 backdrop-blur-sm'
          : 'bg-white/25 dark:bg-white/[0.03] border-white/40 dark:border-white/10 backdrop-blur-sm'
      }`}
    >
      {children}
    </div>
  )
}

function DragOverlayCard({ task }: { task: Task }) {
  return (
    <div className="glass-heavy rounded-2xl p-3 shadow-2xl rotate-2 select-none w-64 ring-1 ring-primary/30">
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
  onTaskEdit?: (task: Task) => void
  onStatusChange: (taskId: string, status: TaskStatus) => Promise<void>
}

export function KanbanBoard({ tasks, onTaskClick, onTaskEdit, onStatusChange }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const sensors = useSensors(
    // Mouse / trackpad — activates after 8px movement
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    // Touch — requires a 250 ms hold to differentiate drag from scroll
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    })
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
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* On mobile: full-bleed horizontal scroll so all 3 columns stay side-by-side */}
      <div className="overflow-x-auto -mx-4 px-4 pb-2 sm:mx-0 sm:px-0 sm:pb-0">
      <div className="grid grid-cols-3 gap-3 min-w-[600px] sm:min-w-0 sm:gap-4">
        {COLUMNS.map((col) => {
          const colTasks = tasksByColumn(col.id)
          return (
            <div
              key={col.id}
              className="flex flex-col gap-2"
            >
              <div className="flex items-center justify-between px-1 mb-1">
                <StatusBadge status={col.id} />
                <span className="text-xs text-muted-foreground">{colTasks.length}</span>
              </div>

              <DroppableColumn id={col.id}>
                <SortableContext
                  items={colTasks.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {colTasks.map((task) => (
                    <KanbanCard
                      key={task.id}
                      task={task}
                      onClick={() => onTaskClick(task)}
                      onEdit={onTaskEdit ? () => onTaskEdit(task) : undefined}
                    />
                  ))}
                </SortableContext>

                {colTasks.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Drop tasks here
                  </p>
                )}
              </DroppableColumn>
            </div>
          )
        })}
      </div>
      </div>{/* end scroll wrapper */}

      <DragOverlay>
        {activeTask ? <DragOverlayCard task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
