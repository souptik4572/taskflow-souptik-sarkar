import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProjectsPage from './pages/ProjectsPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import TaskDetailPage from './pages/TaskDetailPage'

function ThemedToaster() {
  const { theme } = useTheme()
  return (
    <Toaster
      position="top-right"
      theme={theme}
      closeButton
      duration={4000}
    />
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
      <AuthProvider>
        {/* macOS-style ambient background orbs — sit behind all content */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute -top-[20%] -right-[10%] w-[55vw] h-[55vw] rounded-full bg-violet-500/10 dark:bg-violet-500/15 blur-[120px]" />
          <div className="absolute -bottom-[15%] -left-[5%] w-[45vw] h-[45vw] rounded-full bg-blue-500/10 dark:bg-blue-500/12 blur-[100px]" />
          <div className="absolute top-[40%] left-[30%] w-[30vw] h-[30vw] rounded-full bg-pink-400/6 dark:bg-indigo-500/08 blur-[80px]" />
        </div>
        <ThemedToaster />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <ProjectsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:id"
            element={
              <ProtectedRoute>
                <ProjectDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:projectId/tasks/:taskId"
            element={
              <ProtectedRoute>
                <TaskDetailPage />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/projects" replace />} />
          <Route path="*" element={<Navigate to="/projects" replace />} />
        </Routes>
      </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
