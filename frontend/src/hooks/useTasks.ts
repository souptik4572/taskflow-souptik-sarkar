import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { api } from '../lib/api'
import { apiError } from '../lib/toast-utils'
import type { Task, TaskStatus } from '../lib/types'

export function useTasks(projectId: string) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const fetchTasks = useCallback(
    async (filters?: { status?: string; assignee?: string; page?: number; limit?: number }) => {
      setIsLoading(true)
      try {
        const { data } = await api.tasks.list(projectId, { limit: 100, ...filters })
        setTasks(data.data)
        setTotal(data.total)
      } catch (err: unknown) {
        toast.error(apiError(err, 'Failed to load tasks'))
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
      try {
        const { data: task } = await api.tasks.create(projectId, data)
        setTasks((prev) => [task, ...prev])
        setTotal((t) => t + 1)
        toast.success('Task created successfully')
        return task
      } catch (err: unknown) {
        toast.error(apiError(err, 'Failed to create task'))
        throw err
      }
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
      try {
        const { data } = await api.tasks.update(id, updates)
        setTasks((prev) => prev.map((t) => (t.id === id ? data : t)))
        toast.success('Task updated successfully')
        return data
      } catch (err: unknown) {
        toast.error(apiError(err, 'Failed to update task'))
        throw err
      }
    },
    []
  )

  const updateTaskStatusOptimistic = useCallback(
    async (id: string, status: TaskStatus) => {
      const previous = tasks.find((t) => t.id === id)
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)))
      try {
        await api.tasks.update(id, { status })
      } catch (err: unknown) {
        if (previous) {
          setTasks((prev) =>
            prev.map((t) => (t.id === id ? { ...t, status: previous.status } : t))
          )
        }
        toast.error(apiError(err, 'Failed to update task status'))
      }
    },
    [tasks]
  )

  const deleteTask = useCallback(async (id: string) => {
    try {
      await api.tasks.delete(id)
      setTasks((prev) => prev.filter((t) => t.id !== id))
      setTotal((t) => t - 1)
      toast.success('Task deleted successfully')
    } catch (err: unknown) {
      toast.error(apiError(err, 'Failed to delete task'))
      throw err
    }
  }, [])

  return {
    tasks,
    total,
    isLoading,
    fetchTasks,
    createTask,
    updateTask,
    updateTaskStatusOptimistic,
    deleteTask,
  }
}
