import { useEffect, useState } from 'react'
import api from '../api/client'

const card = { background: 'var(--bd-card)', border: '1px solid var(--bd-rule)', borderRadius: '1.5rem' }
const muted = { color: 'var(--bd-ink-mute)', fontSize: '0.8rem' }
const ink = { color: 'var(--bd-ink)' }

function formatDate(iso) {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now - d
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

function typeIcon(type) {
  if (type?.includes('badge')) return (
    <svg viewBox="0 0 24 24" style={{ width: 18, height: 18 }} fill="currentColor">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
  )
  if (type?.includes('friend')) return (
    <svg viewBox="0 0 24 24" style={{ width: 18, height: 18 }} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
  return (
    <svg viewBox="0 0 24 24" style={{ width: 18, height: 18 }} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

function NotificationRow({ n, onRead }) {
  return (
    <div
      onClick={() => !n.is_read && onRead(n.id)}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: '0.875rem',
        padding: '0.875rem 1.25rem',
        background: n.is_read ? 'transparent' : 'var(--bd-bg)',
        borderBottom: '1px solid var(--bd-rule)',
        cursor: n.is_read ? 'default' : 'pointer',
        transition: 'background 0.15s',
      }}
    >
      <div style={{
        width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
        background: n.is_read ? 'var(--bd-rule)' : 'var(--bd-moss)',
        color: n.is_read ? 'var(--bd-ink-mute)' : '#fff',
        display: 'grid', placeItems: 'center',
      }}>
        {typeIcon(n.type)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '0.875rem', ...ink, margin: '0 0 0.2rem', lineHeight: 1.4 }}>
          {n.payload?.message ?? n.type?.replace(/_/g, ' ')}
        </p>
        <p style={muted}>{formatDate(n.created_at)}</p>
      </div>
      {!n.is_read && (
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--bd-moss)', flexShrink: 0, marginTop: 6 }} />
      )}
    </div>
  )
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/notifications/me')
      .then(({ data }) => setNotifications(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const markRead = async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    await api.patch(`/notifications/me/${id}/read`).catch(() => {})
  }

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    await api.patch('/notifications/me/read-all').catch(() => {})
  }

  const unread = notifications.filter(n => !n.is_read).length

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, ...ink, margin: 0 }}>Notifications</h1>
          {!loading && unread > 0 && (
            <p style={{ ...muted, marginTop: 4 }}>{unread} unread</p>
          )}
        </div>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            style={{ padding: '0.4rem 1rem', borderRadius: '999px', border: '1px solid var(--bd-rule)', background: 'var(--bd-card)', color: 'var(--bd-ink)', fontSize: '0.875rem', cursor: 'pointer' }}
          >
            Mark all read
          </button>
        )}
      </div>

      <div style={{ ...card, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', ...muted }}>Loading…</div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <p style={{ ...ink, fontWeight: 600, marginBottom: 8 }}>No notifications yet</p>
            <p style={muted}>Badge awards, friend requests, and alerts will appear here.</p>
          </div>
        ) : (
          notifications.map(n => (
            <NotificationRow key={n.id} n={n} onRead={markRead} />
          ))
        )}
      </div>
    </div>
  )
}
