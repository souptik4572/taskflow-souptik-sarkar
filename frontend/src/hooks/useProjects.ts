import { useState, useCallback } from 'react'
import axios from 'axios'
import { api } from '../lib/api'
import type { Project } from '../lib/types'

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = useCallback(async (page = 1, limit = 20) => {
    setIsLoading(true)
    setError(null)
    try {
      const { data } = await api.projects.list({ page, limit })
      setProjects(data.data)
      setTotal(data.total)
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && !err.response) {
        setError('Cannot reach the server — is the backend running on port 8000?')
      } else {
        setError('Failed to load projects')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createProject = useCallback(async (name: string, description?: string) => {
    const { data } = await api.projects.create({ name, description })
    setProjects((prev) => [data, ...prev])
    setTotal((t) => t + 1)
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
    setTotal((t) => t - 1)
  }, [])

  return { projects, total, isLoading, error, fetchProjects, createProject, updateProject, deleteProject }
}
