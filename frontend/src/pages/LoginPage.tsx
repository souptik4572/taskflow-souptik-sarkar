import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { CheckSquare } from 'lucide-react'
import { apiError } from '../lib/toast-utils'

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Email and password are required')
      return
    }
    setIsLoading(true)
    try {
      await login(email, password)
      toast.success('Welcome back!')
    } catch (err: unknown) {
      toast.error(apiError(err, 'Login failed'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2 font-bold text-2xl">
            <CheckSquare className="w-7 h-7 text-primary" />
            TaskFlow
          </div>
        </div>

        <div className="glass-heavy rounded-2xl p-6 sm:p-8">
          <h1 className="text-xl font-semibold mb-4">Sign in</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <p className="text-sm text-center text-muted-foreground mt-4">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-primary hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
