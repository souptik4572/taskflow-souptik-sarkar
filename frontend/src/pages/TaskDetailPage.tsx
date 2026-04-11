import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronRight, Trash2, Save, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import axios from 'axios'
import { api } from '../lib/api'
import { Navbar } from '../components/Navbar'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { StatusBadge } from '../components/StatusBadge'
import { PriorityBadge } from '../components/PriorityBadge'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog'
import type { Task, TaskStatus, TaskPriority, Project, User } from '../lib/types'

export default function TaskDetailPage() {
  const { projectId, taskId } = useParams<{ projectId: string; taskId: string }>()
  const navigate = useNavigate()

  // Remote data
  const [task, setTask] = useState<Task | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [projectMembers, setProjectMembers] = useState<User[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  const [pageError, setPageError] = useState<string | null>(null)

  // Editable form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TaskStatus>('todo')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [assigneeId, setAssigneeId] = useState('unassigned')
  const [dueDate, setDueDate] = useState('')

  // UI state
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const initForm = useCallback((t: Task) => {
    setTitle(t.title)
    setDescription(t.description ?? '')
    setStatus(t.status)
    setPriority(t.priority)
    setAssigneeId(t.assigneeId ?? 'unassigned')
    setDueDate(t.dueDate ? t.dueDate.split('T')[0] : '')
  }, [])

  useEffect(() => {
    if (!taskId || !projectId) return
    async function load() {
      setPageLoading(true)
      setPageError(null)
      try {
        const [taskRes, projectRes, usersRes] = await Promise.all([
          api.tasks.getById(taskId!),
          api.projects.getById(projectId!),
          api.users.list(),
        ])
        const t = taskRes.data
        const p = projectRes.data
        setTask(t)
        setProject(p)
        setProjectMembers(usersRes.data.data)
        initForm(t)
      } catch (err: unknown) {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          setPageError('Task not found')
        } else {
          setPageError('Failed to load task')
        }
      } finally {
        setPageLoading(false)
      }
    }
    void load()
  }, [taskId, projectId, initForm])

  // Dirty check — true when any field differs from the last saved state
  const isDirty = task !== null && (
    title.trim() !== task.title ||
    description.trim() !== (task.description ?? '') ||
    status !== task.status ||
    priority !== task.priority ||
    assigneeId !== (task.assigneeId ?? 'unassigned') ||
    dueDate !== (task.dueDate ? task.dueDate.split('T')[0] : '')
  )

  async function handleSave() {
    if (!task || !isDirty) return
    if (!title.trim()) { setSaveError('Title cannot be empty'); return }
    setIsSaving(true)
    setSaveError(null)
    try {
      const { data: updated } = await api.tasks.update(task.id, {
        title: title.trim(),
        description: description.trim() || null,
        status,
        priority,
        assigneeId: assigneeId === 'unassigned' ? null : assigneeId,
        dueDate: dueDate || null,
      })
      setTask(updated)
      initForm(updated)
    } catch {
      setSaveError('Failed to save changes. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!task) return
    setIsDeleting(true)
    setDeleteError(null)
    try {
      await api.tasks.delete(task.id)
      navigate(`/projects/${projectId}`)
    } catch {
      setDeleteError('Failed to delete task. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  if (pageLoading) return <LoadingSpinner />

  if (pageError || !task) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="max-w-6xl mx-auto px-4 py-8">
          <p className="text-muted-foreground mb-4">{pageError ?? 'Task not found'}</p>
          <Button variant="outline" onClick={() => navigate(`/projects/${projectId}`)}>
            <ArrowLeft className="w-4 h-4" />
            Back to Project
          </Button>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-6 pb-12">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6 flex-wrap">
          <button
            onClick={() => navigate('/projects')}
            className="hover:text-foreground transition-colors"
          >
            Projects
          </button>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          <button
            onClick={() => navigate(`/projects/${projectId}`)}
            className="hover:text-foreground transition-colors truncate max-w-[140px] sm:max-w-[240px]"
          >
            {project?.name ?? '…'}
          </button>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          <span className="text-foreground truncate max-w-[140px] sm:max-w-[240px]">
            {task.title}
          </span>
        </nav>

        {/* Title + action buttons */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-3 mb-6">
          <div className="flex-1 min-w-0">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              className="w-full bg-transparent border-b-2 border-transparent focus:border-primary/60 focus:outline-none text-2xl sm:text-3xl font-bold font-heading py-1 transition-colors placeholder:text-muted-foreground/50"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
            {isDirty && (
              <span className="text-xs text-muted-foreground italic w-full sm:w-auto text-right sm:text-left">
                Unsaved changes
              </span>
            )}
            <Button
              onClick={handleSave}
              disabled={!isDirty || isSaving}
              className="flex-1 sm:flex-none"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving…' : 'Save Changes'}
            </Button>
            <Button
              variant="destructive"
              onClick={() => setDeleteOpen(true)}
              className="flex-1 sm:flex-none"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </div>
        </div>

        {saveError && (
          <p className="text-sm text-destructive mb-4">{saveError}</p>
        )}

        {/* Two-column layout: main content + metadata sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">

          {/* ── Left: description + dates ── */}
          <div className="glass rounded-2xl p-5 sm:p-6 space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Description
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description for this task…"
                rows={7}
                className="resize-none"
              />
            </div>

            {/* Current badge state — quick visual read */}
            <div className="flex items-center gap-2 pt-1">
              <StatusBadge status={status} />
              <PriorityBadge priority={priority} />
              {task.assignee && (
                <span className="text-xs text-muted-foreground">
                  Assigned to{' '}
                  <span className="font-medium text-foreground">{task.assignee.name}</span>
                </span>
              )}
            </div>

            {/* Created / updated */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20 dark:border-white/10 text-xs">
              <div>
                <p className="text-muted-foreground uppercase tracking-widest font-semibold mb-1">
                  Created
                </p>
                <p className="text-foreground/80">
                  {format(new Date(task.createdAt), 'MMM d, yyyy · HH:mm')}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground uppercase tracking-widest font-semibold mb-1">
                  Last updated
                </p>
                <p className="text-foreground/80">
                  {format(new Date(task.updatedAt), 'MMM d, yyyy · HH:mm')}
                </p>
              </div>
            </div>
          </div>

          {/* ── Right: metadata sidebar ── */}
          <div className="glass rounded-2xl p-5 space-y-5 h-fit">

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Status
              </label>
              <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Priority
              </label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {projectMembers.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Assignee
                </label>
                <Select value={assigneeId} onValueChange={setAssigneeId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {projectMembers.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Due Date
              </label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full"
              />
              {dueDate && (
                <button
                  type="button"
                  onClick={() => setDueDate('')}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  Clear date
                </button>
              )}
            </div>

          </div>
        </div>
      </main>

      {/* ── Delete confirmation dialog ── */}
      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => { if (!isDeleting) setDeleteOpen(open) }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
          </DialogHeader>

          <div className="text-sm text-muted-foreground space-y-2 py-1">
            <p>
              Are you sure you want to delete{' '}
              <span className="font-semibold text-foreground">{task.title}</span>?
            </p>
            <p className="font-medium text-destructive">
              This action cannot be undone.
            </p>
          </div>

          {deleteError && (
            <p className="text-sm text-destructive">{deleteError}</p>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting…' : 'Yes, Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
