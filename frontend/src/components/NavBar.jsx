import { useState, useRef, useEffect, useCallback } from 'react'
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import api from '../api/client'

const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/identify', label: 'Identify' },
  { to: '/map', label: 'Map' },
  { to: '/species', label: 'Species' },
]

function initials(name) {
  return name.split(' ').map(p => p[0]?.toUpperCase() || '').slice(0, 2).join('')
}

function notificationMessage(n) {
  const p = n.payload || {}
  switch (n.type) {
    case 'friend_request': return `${p.from_user || 'Someone'} sent you a friend request`
    case 'friend_accepted': return `${p.from_user || 'Someone'} accepted your friend request`
    case 'badge_earned': return `You earned the "${p.badge_name || 'new'}" badge`
    case 'new_sighting': return `${p.from_user || 'A friend'} spotted ${p.species || 'something'}`
    default: return n.type.replace(/_/g, ' ')
  }
}

function BellIcon({ count }) {
  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ color: 'var(--bd-ink-mute)' }}>
        <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6 6 0 0 0-5-5.917V5a1 1 0 1 0-2 0v.083A6 6 0 0 0 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      {count > 0 && (
        <span style={{
          position: 'absolute', top: -4, right: -5,
          background: 'var(--bd-terra)', color: '#fff',
          fontSize: '0.6rem', fontWeight: 700,
          borderRadius: '999px', minWidth: 14, height: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 3px', lineHeight: 1,
        }}>
          {count > 9 ? '9+' : count}
        </span>
      )}
    </div>
  )
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isMobile
}

export default function NavBar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const isMobile = useIsMobile()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const dropdownRef = useRef(null)
  const bellRef = useRef(null)

  const loadNotifications = useCallback(async () => {
    if (!user) return
    try {
      const { data } = await api.get('/notifications/me')
      setNotifications(data)
    } catch { /* silent */ }
  }, [user])

  useEffect(() => {
    loadNotifications()
    const id = setInterval(loadNotifications, 60_000)
    return () => clearInterval(id)
  }, [loadNotifications])

  useEffect(() => {
    function onClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false)
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  const [logoutConfirm, setLogoutConfirm] = useState(false)

  const handleLogout = () => {
    if (!logoutConfirm) { setLogoutConfirm(true); return }
    setLogoutConfirm(false)
    setDropdownOpen(false)
    setMobileOpen(false)
    logout()
    navigate('/login')
  }

  // Reset confirm state if dropdown closes
  useEffect(() => { if (!dropdownOpen && !mobileOpen) setLogoutConfirm(false) }, [dropdownOpen, mobileOpen])

  const unreadCount = notifications.filter(n => !n.is_read).length

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/me/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    } catch { /* silent */ }
  }

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/me/${id}/read`)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    } catch { /* silent */ }
  }

  const timeAgo = (iso) => {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
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
      <nav style={{
        background: 'var(--bd-bg)',
        borderBottom: '1px solid var(--bd-rule)',
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
        padding: '0 1.25rem',
        height: 48,
      }}>
        {/* Wordmark */}
        <Link
          to="/"
          style={{ fontFamily: 'Georgia, serif', fontSize: '1.1rem', letterSpacing: '-0.02em', color: 'var(--bd-ink)', fontStyle: 'italic', textDecoration: 'none', marginRight: '0.5rem', flexShrink: 0 }}
        >
          Wildr
        </Link>

        {/* Desktop nav links */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1 }}>
            {NAV_LINKS.map(({ to, label, end }) => (
              <NavLink key={to} to={to} end={end} style={({ isActive }) => linkStyle(isActive)}>
                {label}
              </NavLink>
            ))}
          </div>
        )}

        {/* Desktop right: bell + user dropdown */}
        {!isMobile && user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
            {/* Notification bell */}
            <div style={{ position: 'relative' }} ref={bellRef}>
              <button
                onClick={() => { setBellOpen(o => !o); setDropdownOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 36, height: 36, borderRadius: '50%',
                  background: bellOpen ? 'var(--bd-rule-soft)' : 'transparent',
                  border: 'none', cursor: 'pointer',
                }}
                aria-label="Notifications"
              >
                <BellIcon count={unreadCount} />
              </button>

              {bellOpen && (
                <div style={{
                  position: 'absolute', right: 0, top: '100%', marginTop: 6,
                  width: 320, maxHeight: 420, overflowY: 'auto',
                  borderRadius: '1rem', boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
                  background: 'var(--bd-card)', border: '1px solid var(--bd-rule)', zIndex: 200,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px 8px', borderBottom: '1px solid var(--bd-rule)' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--bd-ink)' }}>Notifications</span>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} style={{ fontSize: '0.75rem', color: 'var(--bd-moss)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                        Mark all read
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <p style={{ padding: '2rem 1rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--bd-ink-mute)' }}>No notifications yet</p>
                  ) : (
                    <>
                      {notifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => markRead(n.id)}
                          style={{
                            padding: '10px 16px',
                            borderBottom: '1px solid var(--bd-rule-soft)',
                            cursor: 'pointer',
                            background: n.is_read ? 'transparent' : 'var(--bd-bg-soft, #f8faf8)',
                            display: 'flex', alignItems: 'flex-start', gap: 10,
                          }}
                        >
                          {!n.is_read && (
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--bd-moss)', flexShrink: 0, marginTop: 5 }} />
                          )}
                          <div style={{ flex: 1, paddingLeft: n.is_read ? 17 : 0 }}>
                            <p style={{ fontSize: '0.8rem', color: 'var(--bd-ink)', margin: 0, lineHeight: 1.4 }}>{notificationMessage(n)}</p>
                            <p style={{ fontSize: '0.7rem', color: 'var(--bd-ink-mute)', margin: '3px 0 0' }}>{timeAgo(n.created_at)}</p>
                          </div>
                        </div>
                      ))}
                      <Link to="/notifications" onClick={() => setBellOpen(false)} style={{ display: 'block', padding: '10px 16px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--bd-moss)', textDecoration: 'none', textAlign: 'center', borderTop: '1px solid var(--bd-rule)' }}>View all notifications</Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* User dropdown */}
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <button
                onClick={() => { setDropdownOpen(o => !o); setBellOpen(false) }}
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
                <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, width: 160, borderRadius: '1rem', padding: '4px 0', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', background: 'var(--bd-card)', border: '1px solid var(--bd-rule)', zIndex: 200 }}>
                  {[
                    { to: '/profile', label: 'Profile' },
                    { to: '/settings', label: 'Settings' },
                  ].map(({ to, label }) => (
                    <Link key={to} to={to} onClick={() => setDropdownOpen(false)}
                      style={{ display: 'block', padding: '8px 16px', fontSize: '0.875rem', color: 'var(--bd-ink)', textDecoration: 'none' }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >{label}</Link>
                  ))}
                  <div style={{ borderTop: '1px solid var(--bd-rule-soft)', margin: '4px 0' }} />
                  <button onClick={handleLogout} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 16px', fontSize: '0.875rem', color: logoutConfirm ? 'var(--bd-terra)' : 'var(--bd-ink-mute)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: logoutConfirm ? 600 : 400 }}>
                    {logoutConfirm ? 'Tap again to confirm' : 'Log out'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mobile: hamburger */}
        {isMobile && (
          <button
            onClick={() => setMobileOpen(o => !o)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--bd-ink)' }}
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
        )}
      </nav>

      {/* Mobile menu */}
      {isMobile && mobileOpen && (
        <div style={{ background: 'var(--bd-bg)', borderBottom: '1px solid var(--bd-rule)', padding: '0.75rem 1.25rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {NAV_LINKS.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} style={({ isActive }) => ({ ...linkStyle(isActive), border: 'none', display: 'block', padding: '0.625rem 0', borderBottom: 'none', borderTop: '1px solid var(--bd-rule-soft)' })}>
              {label}
            </NavLink>
          ))}
          {user && (
            <>
              <div style={{ borderTop: '1px solid var(--bd-rule)', margin: '0.5rem 0 0.25rem' }} />
              <Link to="/profile" style={{ fontSize: '0.875rem', color: 'var(--bd-ink-mute)', textDecoration: 'none', padding: '0.625rem 0', display: 'block' }}>Profile</Link>
              <Link to="/settings" style={{ fontSize: '0.875rem', color: 'var(--bd-ink-mute)', textDecoration: 'none', padding: '0.625rem 0', display: 'block' }}>Settings</Link>
              {unreadCount > 0 && (
                <Link to="/notifications" style={{ fontSize: '0.875rem', color: 'var(--bd-terra)', textDecoration: 'none', padding: '0.625rem 0', display: 'block' }}>
                  {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
                </Link>
              )}
              <button onClick={handleLogout} style={{ background: 'none', border: 'none', textAlign: 'left', fontSize: '0.875rem', color: logoutConfirm ? 'var(--bd-terra)' : 'var(--bd-ink-mute)', padding: '0.625rem 0', cursor: 'pointer', fontWeight: logoutConfirm ? 600 : 400 }}>
                {logoutConfirm ? 'Tap again to confirm' : 'Log out'}
              </button>
            </>
          )}
        </div>
      )}
    </header>
  )
}
