import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { LogOut, Menu, UserRound, X } from 'lucide-react'
import { useAuth } from '../../hooks/AuthContext'
import { useToast } from '../../hooks/ToastContext'
import { Logo } from './Logo'

const LINKS = [
  { to: '/', label: 'Discover', end: true },
  { to: '/community', label: 'Community', end: false },
  { to: '/communities', label: 'Communities', end: false },
  { to: '/my-events', label: 'My Events', end: false },
  { to: '/organizer', label: 'Organizer Dashboard', end: false },
]

export function Navbar() {
  const [open, setOpen] = useState(false)
  const { user, signOut } = useAuth()
  const { notify } = useToast()
  const navigate = useNavigate()

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-3 py-2 text-sm font-semibold transition ${
      isActive ? 'bg-brand text-[#0B0F19] shadow-cyber' : 'text-ink-muted hover:bg-secondary hover:text-white'
    }`

  const handleSignOut = async () => {
    await signOut()
    setOpen(false)
    notify('Signed out of the demo session.', 'info')
    navigate('/')
  }

  return (
    <header className="glass sticky top-0 z-40 border-b border-[#1E293B]/80">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:rounded-lg focus:bg-secondary focus:text-brand focus:px-3 focus:py-2 focus:ring-2 focus:ring-brand"
      >
        Skip to content
      </a>
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8" aria-label="Main">
        <Link to="/" aria-label="NearCircle home" onClick={() => setOpen(false)}>
          <Logo />
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <>
              <span className="flex items-center gap-2 rounded-lg bg-secondary border border-[#334155] px-3 py-2 text-sm font-medium text-white">
                <UserRound className="h-4 w-4 text-brand" aria-hidden />
                {user.name}
              </span>
              <button type="button" onClick={handleSignOut} className="btn-ghost" aria-label="Sign out">
                <LogOut className="h-4 w-4" aria-hidden />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost">
                Log in
              </Link>
              <Link to="/signup" className="btn-primary">
                Sign up
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-ink-muted hover:bg-secondary hover:text-white lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {open && (
        <div id="mobile-menu" className="border-t border-[#1E293B] bg-[#0B0F19] px-4 pb-4 pt-2 lg:hidden">
          <div className="flex flex-col gap-1">
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={linkClass} onClick={() => setOpen(false)}>
                {l.label}
              </NavLink>
            ))}
          </div>
          <div className="mt-3 flex gap-2 border-t border-[#1E293B] pt-3">
            {user ? (
              <button type="button" onClick={handleSignOut} className="btn-secondary w-full">
                <LogOut className="h-4 w-4" aria-hidden /> Sign out ({user.name})
              </button>
            ) : (
              <>
                <Link to="/login" className="btn-secondary flex-1" onClick={() => setOpen(false)}>
                  Log in
                </Link>
                <Link to="/signup" className="btn-primary flex-1" onClick={() => setOpen(false)}>
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
