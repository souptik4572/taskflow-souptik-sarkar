export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface User {
  id: string
  name: string
  email: string
}

export interface Project {
  id: string
  name: string
  description?: string | null
  ownerId: string
  createdAt: string
  tasks?: Task[]
  owner?: User
  _count?: { tasks: number }
}

export interface Task {
  id: string
  title: string
  description?: string | null
  status: TaskStatus
  priority: TaskPriority
  projectId: string
  assigneeId?: string | null
  creatorId: string
  dueDate?: string | null
  createdAt: string
  updatedAt: string
  assignee?: User | null
}

export interface AuthResponse {
  token: string
  user: User
}
