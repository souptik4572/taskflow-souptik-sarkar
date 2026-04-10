import axios from 'axios'
import type { AuthResponse, Project, Task } from './types'

const BASE_URL = import.meta.env['VITE_API_URL'] ?? 'http://localhost:8000/api/v1'

export const axiosInstance = axios.create({ baseURL: BASE_URL })

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

export interface ProjectStats {
  byStatus: { todo: number; in_progress: number; done: number }
  byAssignee: { userId: string; name: string; count: number }[]
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      axiosInstance.post<AuthResponse>('/auth/login', { email, password }),
    register: (name: string, email: string, password: string) =>
      axiosInstance.post<AuthResponse>('/auth/register', { name, email, password }),
  },
  projects: {
    list: (params?: { page?: number; limit?: number }) =>
      axiosInstance.get<PaginatedResponse<Project>>('/projects', { params }),
    getById: (id: string) => axiosInstance.get<Project>(`/projects/${id}`),
    create: (data: { name: string; description?: string }) =>
      axiosInstance.post<Project>('/projects', data),
    update: (id: string, data: { name?: string; description?: string }) =>
      axiosInstance.patch<Project>(`/projects/${id}`, data),
    delete: (id: string) => axiosInstance.delete(`/projects/${id}`),
    getStats: (id: string) =>
      axiosInstance.get<ProjectStats>(`/projects/${id}/stats`),
  },
  tasks: {
    list: (projectId: string, params?: { status?: string; assignee?: string; page?: number; limit?: number }) =>
      axiosInstance.get<PaginatedResponse<Task>>(`/projects/${projectId}/tasks`, { params }),
    getById: (id: string) => axiosInstance.get<Task>(`/tasks/${id}`),
    create: (
      projectId: string,
      data: {
        title: string
        description?: string
        priority?: string
        assigneeId?: string | null
        dueDate?: string | null
      }
    ) => axiosInstance.post<Task>(`/projects/${projectId}/tasks`, data),
    update: (
      id: string,
      data: {
        title?: string
        description?: string | null
        status?: string
        priority?: string
        assigneeId?: string | null
        dueDate?: string | null
      }
    ) => axiosInstance.patch<Task>(`/tasks/${id}`, data),
    delete: (id: string) => axiosInstance.delete(`/tasks/${id}`),
  },
}
