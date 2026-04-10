import { useState, useCallback } from 'react'
import { api } from '../lib/api'
import type { Project } from '../lib/types'

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { data } = await api.projects.list()
      setProjects(data.projects)
    } catch {
      setError('Failed to load projects')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createProject = useCallback(async (name: string, description?: string) => {
    const { data } = await api.projects.create({ name, description })
    setProjects((prev) => [data, ...prev])
    return data
  }, [])

  const updateProject = useCallback(
    async (id: string, updates: { name?: string; description?: string }) => {
      const { data } = await api.projects.update(id, updates)
      setProjects((prev) => prev.map((p) => (p.id === id ? data : p)))
      return data
    },
    []
  )

  const deleteProject = useCallback(async (id: string) => {
    await api.projects.delete(id)
    setProjects((prev) => prev.filter((p) => p.id !== id))
  }, [])

  return { projects, isLoading, error, fetchProjects, createProject, updateProject, deleteProject }
}
