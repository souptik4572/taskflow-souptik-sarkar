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

export const api = {
  auth: {
    login: (email: string, password: string) =>
      axiosInstance.post<AuthResponse>('/auth/login', { email, password }),
    register: (name: string, email: string, password: string) =>
      axiosInstance.post<AuthResponse>('/auth/register', { name, email, password }),
  },
  projects: {
    list: () => axiosInstance.get<{ projects: Project[] }>('/projects'),
    getById: (id: string) => axiosInstance.get<Project>(`/projects/${id}`),
    create: (data: { name: string; description?: string }) =>
      axiosInstance.post<Project>('/projects', data),
    update: (id: string, data: { name?: string; description?: string }) =>
      axiosInstance.patch<Project>(`/projects/${id}`, data),
    delete: (id: string) => axiosInstance.delete(`/projects/${id}`),
  },
  tasks: {
    list: (projectId: string, params?: { status?: string; assignee?: string }) =>
      axiosInstance.get<{ tasks: Task[] }>(`/projects/${projectId}/tasks`, { params }),
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
