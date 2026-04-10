import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogOut, CheckSquare, Menu, X } from 'lucide-react'

export function Navbar() {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="bg-white border-b border-border sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/projects" className="flex items-center gap-2 font-bold text-lg">
          <CheckSquare className="w-5 h-5 text-primary" />
          TaskFlow
        </Link>

        {/* Desktop */}
        <div className="hidden sm:flex items-center gap-4">
          {user && (
            <>
              <span className="text-sm text-muted-foreground">{user.name}</span>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </>
          )}
        </div>

        {/* Mobile */}
        <button
          className="sm:hidden p-1"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {menuOpen && (
        <div className="sm:hidden border-t border-border px-4 py-3 flex flex-col gap-3">
          {user && (
            <>
              <span className="text-sm text-muted-foreground">{user.name}</span>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
