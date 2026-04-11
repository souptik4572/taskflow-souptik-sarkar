import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { api } from '../lib/api'
import { apiError } from '../lib/toast-utils'
import type { Project } from '../lib/types'

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const fetchProjects = useCallback(async (page = 1, limit = 20) => {
    setIsLoading(true)
    try {
      const { data } = await api.projects.list({ page, limit })
      setProjects(data.data)
      setTotal(data.total)
    } catch (err: unknown) {
      toast.error(apiError(err, 'Failed to load projects'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createProject = useCallback(async (name: string, description?: string) => {
    try {
      const { data } = await api.projects.create({ name, description })
      setProjects((prev) => [data, ...prev])
      setTotal((t) => t + 1)
      toast.success('Project created successfully')
      return data
    } catch (err: unknown) {
      toast.error(apiError(err, 'Failed to create project'))
      throw err
    }
  }, [])

  const updateProject = useCallback(
    async (id: string, updates: { name?: string; description?: string }) => {
      try {
        const { data } = await api.projects.update(id, updates)
        setProjects((prev) => prev.map((p) => (p.id === id ? data : p)))
        toast.success('Project updated successfully')
        return data
      } catch (err: unknown) {
        toast.error(apiError(err, 'Failed to update project'))
        throw err
      }
    },
    []
  )

  const deleteProject = useCallback(async (id: string) => {
    try {
      await api.projects.delete(id)
      setProjects((prev) => prev.filter((p) => p.id !== id))
      setTotal((t) => t - 1)
      toast.success('Project deleted successfully')
    } catch (err: unknown) {
      toast.error(apiError(err, 'Failed to delete project'))
      throw err
    }
  }, [])

  return { projects, total, isLoading, fetchProjects, createProject, updateProject, deleteProject }
}
