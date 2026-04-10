import { useState, useCallback } from 'react'
import { api } from '../lib/api'
import type { Task, TaskStatus } from '../lib/types'

export function useTasks(projectId: string) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = useCallback(
    async (filters?: { status?: string; assignee?: string }) => {
      setIsLoading(true)
      setError(null)
      try {
        const { data } = await api.tasks.list(projectId, filters)
        setTasks(data.tasks)
      } catch {
        setError('Failed to load tasks')
      } finally {
        setIsLoading(false)
      }
    },
    [projectId]
  )

  const createTask = useCallback(
    async (data: {
      title: string
      description?: string
      priority?: string
      assigneeId?: string | null
      dueDate?: string | null
    }) => {
      const { data: task } = await api.tasks.create(projectId, data)
      setTasks((prev) => [task, ...prev])
      return task
    },
    [projectId]
  )

  const updateTask = useCallback(
    async (
      id: string,
      updates: {
        title?: string
        description?: string | null
        status?: string
        priority?: string
        assigneeId?: string | null
        dueDate?: string | null
      }
    ) => {
      const { data } = await api.tasks.update(id, updates)
      setTasks((prev) => prev.map((t) => (t.id === id ? data : t)))
      return data
    },
    []
  )

  const updateTaskStatusOptimistic = useCallback(
    async (id: string, status: TaskStatus) => {
      const previous = tasks.find((t) => t.id === id)
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)))
      try {
        await api.tasks.update(id, { status })
      } catch {
        if (previous) {
          setTasks((prev) =>
            prev.map((t) => (t.id === id ? { ...t, status: previous.status } : t))
          )
        }
        throw new Error('Failed to update task status')
      }
    },
    [tasks]
  )

  const deleteTask = useCallback(async (id: string) => {
    await api.tasks.delete(id)
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return {
    tasks,
    isLoading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    updateTaskStatusOptimistic,
    deleteTask,
  }
}
