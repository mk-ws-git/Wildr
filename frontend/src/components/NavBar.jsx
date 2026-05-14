import { useState, useRef, useEffect } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

const linkClass = ({ isActive }) =>
  `text-sm font-medium px-1 py-0.5 border-b-2 transition-colors ${
    isActive
      ? 'border-[var(--bd-moss)] text-[var(--bd-moss)]'
      : 'border-transparent hover:text-[var(--bd-ink)]'
  }`

function initials(name) {
  return name.split(' ').map(p => p[0]?.toUpperCase() || '').slice(0, 2).join('')
}

export default function NavBar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const handleLogout = () => {
    setOpen(false)
    logout()
    navigate('/login')
  }

  return (
    <nav
      style={{
        background: 'var(--bd-bg)',
        borderBottom: '1px solid var(--bd-rule)',
        color: 'var(--bd-ink-mute)',
      }}
      className="flex items-center gap-6 px-5 h-12"
    >
      <Link
        to="/"
        style={{ fontFamily: 'Georgia, serif', fontSize: '1.1rem', letterSpacing: '-0.02em', color: 'var(--bd-ink)', fontStyle: 'italic' }}
        className="mr-2 shrink-0"
      >
        Wildr
      </Link>

      <NavLink to="/" end className={linkClass}>Home</NavLink>
      <NavLink to="/identify" className={linkClass}>Identify</NavLink>
      <NavLink to="/map" className={linkClass}>Map</NavLink>
      <NavLink to="/species" className={linkClass}>Species</NavLink>

      {user && (
        <div className="ml-auto relative" ref={ref}>
          <button
            onClick={() => setOpen(o => !o)}
            className="flex items-center gap-2 rounded-full px-2 py-1 transition"
            style={{ background: open ? 'var(--bd-rule-soft)' : 'transparent' }}
          >
            <div
              className="h-8 w-8 rounded-full overflow-hidden grid place-items-center text-xs font-semibold shrink-0"
              style={{ background: 'var(--bd-rule)', color: 'var(--bd-ink)' }}
            >
              {user.avatar_url
                ? <img src={user.avatar_url} alt={user.username} className="h-full w-full object-cover" />
                : initials(user.username)}
            </div>
            <span className="text-sm font-medium" style={{ color: 'var(--bd-ink)' }}>{user.username}</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ color: 'var(--bd-ink-mute)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
              <path d="M2 4l4 4 4-4"/>
            </svg>
          </button>

          {open && (
            <div
              className="absolute right-0 top-full mt-1 w-44 rounded-2xl py-1 shadow-lg z-50"
              style={{ background: 'var(--bd-card)', border: '1px solid var(--bd-rule)' }}
            >
              <Link
                to="/profile"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm transition hover:opacity-70"
                style={{ color: 'var(--bd-ink)' }}
              >
                Profile
              </Link>
              <Link
                to="/sightings"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm transition hover:opacity-70"
                style={{ color: 'var(--bd-ink)' }}
              >
                My Sightings
              </Link>
              <Link
                to="/badges"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm transition hover:opacity-70"
                style={{ color: 'var(--bd-ink)' }}
              >
                Badges
              </Link>
              <div style={{ borderTop: '1px solid var(--bd-rule-soft)', margin: '4px 0' }} />
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-sm transition hover:opacity-70"
                style={{ color: 'var(--bd-ink-mute)' }}
              >
                Log out
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}
