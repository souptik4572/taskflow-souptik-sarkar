import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LoadingSpinner } from './LoadingSpinner'
import type { ReactNode } from 'react'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) return <LoadingSpinner />
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}
