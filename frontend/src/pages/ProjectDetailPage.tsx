import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Pencil, Trash2, LayoutList, Columns } from 'lucide-react'
import { api } from '../lib/api'
import { useTasks } from '../hooks/useTasks'
import { useAuth } from '../context/AuthContext'
import { Navbar } from '../components/Navbar'
import { TaskCard } from '../components/TaskCard'
import { KanbanBoard } from '../components/KanbanBoard'
import { TaskModal } from '../components/TaskModal'
import { ProjectModal } from '../components/ProjectModal'
import { EmptyState } from '../components/EmptyState'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { Button } from '../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import type { Project, Task, TaskStatus, User } from '../lib/types'
import axios from 'axios'

type ViewMode = 'list' | 'board'

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [project, setProject] = useState<Project | null>(null)
  const [projectMembers, setProjectMembers] = useState<User[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  const [pageError, setPageError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  const [statusFilter, setStatusFilter] = useState('')
  const [assigneeFilter, setAssigneeFilter] = useState('')

  const [addTaskOpen, setAddTaskOpen] = useState(false)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [editProjectOpen, setEditProjectOpen] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const {
    tasks,
    isLoading: tasksLoading,
    fetchTasks,
    createTask,
    updateTask,
    updateTaskStatusOptimistic,
    deleteTask,
  } = useTasks(id!)

  const loadProject = useCallback(async () => {
    if (!id) return
    setPageLoading(true)
    setPageError(null)
    try {
      const { data } = await api.projects.getById(id)
      setProject(data)
      const members = new Map<string, User>()
      if (data.owner) members.set(data.owner.id, data.owner)
      for (const task of data.tasks ?? []) {
        if (task.assignee) members.set(task.assignee.id, task.assignee)
      }
      setProjectMembers(Array.from(members.values()))
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 404) {
          setPageError('Project not found')
        } else if (!err.response) {
          setPageError('Cannot reach the server — is the backend running?')
        } else {
          setPageError(`Error ${err.response.status}: ${err.response.data?.error ?? 'Failed to load project'}`)
        }
      } else {
        setPageError('An unexpected error occurred')
      }
    } finally {
      setPageLoading(false)
    }
  }, [id])

  useEffect(() => {
    void loadProject()
  }, [loadProject])

  useEffect(() => {
    if (id) {
      void fetchTasks({
        status: statusFilter || undefined,
        assignee: assigneeFilter || undefined,
      })
    }
  }, [id, statusFilter, assigneeFilter, fetchTasks])

  async function handleDeleteProject() {
    if (!project) return
    if (!window.confirm('Delete this project and all its tasks?')) return
    try {
      await api.projects.delete(project.id)
      navigate('/projects')
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setDeleteError(err.response?.data?.error ?? 'Failed to delete project')
      }
    }
  }

  if (pageLoading) return <LoadingSpinner />

  if (pageError || !project) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-6xl mx-auto px-4 py-8">
          <EmptyState
            message={pageError ?? 'Project not found'}
            action={<Button onClick={() => navigate('/projects')}>Back to Projects</Button>}
          />
        </main>
      </div>
    )
  }

  const isOwner = user?.id === project.ownerId

  const filteredTasks = tasks.filter((t) => {
    if (statusFilter && t.status !== statusFilter) return false
    if (assigneeFilter && t.assigneeId !== assigneeFilter) return false
    return true
  })

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Back link */}
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          All Projects
        </button>

        {/* Project header */}
        <div className="flex items-start justify-between gap-4 mb-2">
          <div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            {project.description && (
              <p className="text-muted-foreground mt-1">{project.description}</p>
            )}
          </div>
          {isOwner && (
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={() => setEditProjectOpen(true)}>
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDeleteProject}>
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </Button>
            </div>
          )}
        </div>

        {deleteError && (
          <div className="bg-destructive/10 text-destructive text-sm rounded-md px-4 py-2 mb-4">
            {deleteError}
          </div>
        )}

        {/* Toolbar: filters + view toggle + add button */}
        <div className="flex flex-wrap items-center gap-3 mt-6 mb-4">
          {/* Status filter — hidden in board mode (board shows all columns) */}
          {viewMode === 'list' && (
            <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
          )}

          {projectMembers.length > 0 && (
            <Select value={assigneeFilter || 'all'} onValueChange={(v) => setAssigneeFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All assignees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All assignees</SelectItem>
                {projectMembers.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* View toggle */}
          <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-sm transition-colors ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              aria-label="List view"
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={`p-1.5 rounded-sm transition-colors ${viewMode === 'board' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              aria-label="Board view"
            >
              <Columns className="w-4 h-4" />
            </button>
          </div>

          <Button className="ml-auto" onClick={() => setAddTaskOpen(true)}>
            <Plus className="w-4 h-4" />
            Add Task
          </Button>
        </div>

        {/* Content */}
        {tasksLoading ? (
          <LoadingSpinner />
        ) : viewMode === 'board' ? (
          <KanbanBoard
            tasks={filteredTasks}
            onTaskClick={(task) => setEditTask(task)}
            onStatusChange={async (taskId, status: TaskStatus) => {
              await updateTaskStatusOptimistic(taskId, status)
            }}
          />
        ) : filteredTasks.length === 0 ? (
          <EmptyState
            message={
              statusFilter || assigneeFilter
                ? 'No tasks match your filters'
                : 'No tasks yet. Add a task to get started.'
            }
            action={
              !statusFilter && !assigneeFilter ? (
                <Button onClick={() => setAddTaskOpen(true)}>Add Task</Button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredTasks.map((task) => (
              <TaskCard key={task.id} task={task} onClick={() => setEditTask(task)} />
            ))}
          </div>
        )}
      </main>

      <TaskModal
        open={addTaskOpen}
        onClose={() => setAddTaskOpen(false)}
        onSubmit={async (data) => {
          await createTask({
            title: data.title,
            description: data.description ?? undefined,
            priority: data.priority,
            assigneeId: data.assigneeId,
            dueDate: data.dueDate,
          })
        }}
        projectMembers={projectMembers}
      />

      {editTask && (
        <TaskModal
          open={!!editTask}
          onClose={() => setEditTask(null)}
          task={editTask}
          isEdit
          projectMembers={projectMembers}
          onSubmit={async (data) => {
            await updateTask(editTask.id, data)
          }}
          onDelete={async () => {
            await deleteTask(editTask.id)
          }}
        />
      )}

      <ProjectModal
        open={editProjectOpen}
        onClose={() => setEditProjectOpen(false)}
        project={project}
        onSubmit={async (data) => {
          const { data: updated } = await api.projects.update(project.id, data)
          setProject(updated)
        }}
      />
    </div>
  )
}
