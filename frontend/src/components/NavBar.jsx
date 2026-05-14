import { useState, useRef, useEffect } from 'react'
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'

const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/identify', label: 'Identify' },
  { to: '/map', label: 'Map' },
  { to: '/species', label: 'Species' },
]

function initials(name) {
  return name.split(' ').map(p => p[0]?.toUpperCase() || '').slice(0, 2).join('')
}

export default function NavBar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    function onClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  const handleLogout = () => {
    setDropdownOpen(false)
    setMobileOpen(false)
    logout()
    navigate('/login')
  }

  const linkStyle = (isActive) => ({
    fontSize: '0.875rem',
    fontWeight: 500,
    padding: '2px 4px',
    borderBottom: `2px solid ${isActive ? 'var(--bd-moss)' : 'transparent'}`,
    color: isActive ? 'var(--bd-moss)' : 'var(--bd-ink-mute)',
    textDecoration: 'none',
    transition: 'color 0.15s, border-color 0.15s',
  })

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 100 }}>
      <nav
        style={{
          background: 'var(--bd-bg)',
          borderBottom: '1px solid var(--bd-rule)',
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem',
          padding: '0 1.25rem',
          height: 48,
        }}
      >
        {/* Wordmark */}
        <Link
          to="/"
          style={{ fontFamily: 'Georgia, serif', fontSize: '1.1rem', letterSpacing: '-0.02em', color: 'var(--bd-ink)', fontStyle: 'italic', textDecoration: 'none', marginRight: '0.5rem', flexShrink: 0 }}
        >
          Wildr
        </Link>

        {/* Desktop nav links */}
        <div className="hidden sm:flex items-center gap-6" style={{ flex: 1 }}>
          {NAV_LINKS.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} style={({ isActive }) => linkStyle(isActive)}>
              {label}
            </NavLink>
          ))}
        </div>

        {/* Desktop user dropdown */}
        {user && (
          <div className="hidden sm:block ml-auto relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(o => !o)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                borderRadius: '999px', padding: '4px 8px',
                background: dropdownOpen ? 'var(--bd-rule-soft)' : 'transparent',
                border: 'none', cursor: 'pointer',
              }}
            >
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bd-rule)', color: 'var(--bd-ink)', display: 'grid', placeItems: 'center', fontSize: '0.7rem', fontWeight: 600, flexShrink: 0, overflow: 'hidden' }}>
                {user.avatar_url
                  ? <img src={user.avatar_url} alt={user.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : initials(user.username)}
              </div>
              <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--bd-ink)' }}>{user.username}</span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ color: 'var(--bd-ink-mute)', transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
                <path d="M2 4l4 4 4-4"/>
              </svg>
            </button>

            {dropdownOpen && (
              <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, width: 176, borderRadius: '1rem', padding: '4px 0', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', background: 'var(--bd-card)', border: '1px solid var(--bd-rule)', zIndex: 200 }}>
                {[{ to: '/profile', label: 'Profile' }, { to: '/sightings', label: 'My Sightings' }, { to: '/badges', label: 'Badges' }].map(({ to, label }) => (
                  <Link key={to} to={to} onClick={() => setDropdownOpen(false)} style={{ display: 'block', padding: '8px 16px', fontSize: '0.875rem', color: 'var(--bd-ink)', textDecoration: 'none' }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >{label}</Link>
                ))}
                <div style={{ borderTop: '1px solid var(--bd-rule-soft)', margin: '4px 0' }} />
                <button onClick={handleLogout} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 16px', fontSize: '0.875rem', color: 'var(--bd-ink-mute)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  Log out
                </button>
              </div>
            )}
          </div>
        )}

        {/* Mobile: hamburger */}
        <button
          className="sm:hidden ml-auto"
          onClick={() => setMobileOpen(o => !o)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--bd-ink)' }}
          aria-label="Menu"
        >
          {mobileOpen ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 4l12 12M16 4L4 16"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M3 5h14M3 10h14M3 15h14"/>
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{ background: 'var(--bd-bg)', borderBottom: '1px solid var(--bd-rule)', padding: '0.75rem 1.25rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {NAV_LINKS.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} style={({ isActive }) => ({ ...linkStyle(isActive), border: 'none', display: 'block', padding: '0.625rem 0', borderBottom: 'none', borderTop: '1px solid var(--bd-rule-soft)' })}>
              {label}
            </NavLink>
          ))}
          {user && (
            <>
              <div style={{ borderTop: '1px solid var(--bd-rule)', margin: '0.5rem 0 0.25rem' }} />
              {[{ to: '/profile', label: 'Profile' }, { to: '/sightings', label: 'My Sightings' }, { to: '/badges', label: 'Badges' }].map(({ to, label }) => (
                <Link key={to} to={to} style={{ fontSize: '0.875rem', color: 'var(--bd-ink-mute)', textDecoration: 'none', padding: '0.625rem 0', display: 'block' }}>{label}</Link>
              ))}
              <button onClick={handleLogout} style={{ background: 'none', border: 'none', textAlign: 'left', fontSize: '0.875rem', color: 'var(--bd-ink-mute)', padding: '0.625rem 0', cursor: 'pointer' }}>
                Log out
              </button>
            </>
          )}
        </div>
      )}
    </header>
  )
}
