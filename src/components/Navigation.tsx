import { Link, useLocation } from 'react-router-dom'
import { Home, PlusCircle, Calendar, BarChart3, LogOut } from 'lucide-react'
import { createClient } from '@blinkdotnew/sdk'
import { ThemeToggle } from './ThemeToggle'

const blink = createClient({
  projectId: 'daily-mood-tracker-ie6zuoc6',
  authRequired: true
})

interface NavigationProps {
  user: any
}

export default function Navigation({ user }: NavigationProps) {
  const location = useLocation()

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/entry', icon: PlusCircle, label: 'Daily Entry' },
    { path: '/history', icon: Calendar, label: 'History' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  ]

  return (
    <nav className="bg-card border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl">😊</span>
              <span className="font-bold text-xl">Mood Tracker</span>
            </Link>
            
            <div className="hidden md:flex space-x-6">
              {navItems.map(({ path, icon: Icon, label }) => (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ease-in-out ${
                    location.pathname === path
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              Hello, {user.email?.split('@')[0]}
            </span>
            <ThemeToggle />
            <button
              onClick={() => blink.auth.logout()}
              className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-border">
          <div className="flex justify-around py-2">
            {navItems.map(({ path, icon: Icon, label }) => (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-md text-xs transition-all duration-200 ease-in-out ${
                  location.pathname === path
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}