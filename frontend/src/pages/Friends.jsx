import { useState, useEffect, useCallback } from 'react'
import api from '../api/client'
import useAuthStore from '../store/authStore'
import PineTrees from '../components/PineTrees'

function Avatar({ user, size = 36 }) {
  function initials(name) {
    return name.split(' ').map(p => p[0]?.toUpperCase() || '').slice(0, 2).join('')
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'var(--bd-rule)', color: 'var(--bd-ink)',
      display: 'grid', placeItems: 'center',
      fontSize: size * 0.3, fontWeight: 600, flexShrink: 0, overflow: 'hidden',
    }}>
      {user.avatar_url
        ? <img src={user.avatar_url} alt={user.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : initials(user.username)}
    </div>
  )
}

function UserRow({ user, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0', borderBottom: '1px solid var(--bd-rule-soft)' }}>
      <Avatar user={user} />
      <span style={{ flex: 1, fontWeight: 500, fontSize: '0.9rem', color: 'var(--bd-ink)' }}>{user.username}</span>
      {action}
    </div>
  )
}

function Btn({ onClick, children, variant = 'primary', disabled }) {
  const styles = {
    primary: { background: 'var(--bd-moss)', color: '#fff', border: 'none' },
    ghost: { background: 'transparent', color: 'var(--bd-ink-mute)', border: '1px solid var(--bd-rule)' },
    danger: { background: 'transparent', color: '#b91c1c', border: '1px solid #fca5a5' },
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...styles[variant],
        borderRadius: '0.5rem', padding: '5px 12px',
        fontSize: '0.8rem', fontWeight: 500, cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1, transition: 'opacity 0.15s',
      }}
    >
      {children}
    </button>
  )
}

function InvitePanel() {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)
  const [invites, setInvites] = useState(null)
  const [showList, setShowList] = useState(false)

  const loadInvites = async () => {
    try {
      const { data } = await api.get('/invitations/me')
      setInvites(data)
    } catch { /* silent */ }
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!email.trim()) return
    setSending(true); setError(null); setSent(false)
    try {
      await api.post('/invitations', { email: email.trim() })
      setSent(true)
      setEmail('')
      loadInvites()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send invite.')
    } finally {
      setSending(false)
    }
  }

  const toggleList = () => {
    if (!showList && invites === null) loadInvites()
    setShowList(v => !v)
  }

  const pendingCount = invites?.filter(i => i.status === 'pending').length ?? 0
  const acceptedCount = invites?.filter(i => i.status === 'accepted').length ?? 0

  return (
    <div style={{
      background: 'var(--bd-card)',
      border: '1px solid var(--bd-rule)',
      borderRadius: '1rem',
      padding: '1.25rem',
    }}>
      {/* Form */}
      <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="email"
          value={email}
          onChange={e => { setEmail(e.target.value); setSent(false); setError(null) }}
          placeholder="friend@example.com"
          required
          style={{
            flex: 1,
            border: '1px solid var(--bd-rule)',
            borderRadius: '0.625rem',
            padding: '0.55rem 0.875rem',
            fontSize: '0.875rem',
            background: 'var(--bd-bg)',
            color: 'var(--bd-ink)',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={sending}
          style={{
            padding: '0.55rem 1.1rem',
            borderRadius: '0.625rem',
            background: 'var(--bd-moss)',
            color: '#fff',
            border: 'none',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: sending ? 'default' : 'pointer',
            opacity: sending ? 0.6 : 1,
            whiteSpace: 'nowrap',
          }}
        >
          {sending ? '…' : 'Send invite'}
        </button>
      </form>

      {/* Feedback */}
      {sent && (
        <p style={{ fontSize: '0.82rem', color: 'var(--bd-moss)', marginTop: '0.6rem', fontWeight: 500 }}>
          ✓ Invite sent! They'll receive an email with a link to join.
        </p>
      )}
      {error && (
        <p style={{ fontSize: '0.82rem', color: '#b91c1c', marginTop: '0.6rem' }}>{error}</p>
      )}

      {/* Toggle invite history */}
      <button
        onClick={toggleList}
        style={{
          marginTop: '0.875rem',
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          fontSize: '0.78rem',
          fontWeight: 600,
          color: 'var(--bd-ink-mute)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.3rem',
        }}
      >
        {showList ? '▲' : '▼'} Your invites
        {invites !== null && (
          <span style={{ marginLeft: '0.25rem', color: 'var(--bd-ink-soft)' }}>
            · {acceptedCount} joined, {pendingCount} pending
          </span>
        )}
      </button>

      {showList && invites !== null && (
        <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {invites.length === 0 && (
            <p style={{ fontSize: '0.82rem', color: 'var(--bd-ink-mute)' }}>No invites sent yet.</p>
          )}
          {invites.map(inv => (
            <div
              key={inv.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.45rem 0',
                borderTop: '1px solid var(--bd-rule-soft)',
                gap: '0.5rem',
              }}
            >
              <span style={{ fontSize: '0.85rem', color: 'var(--bd-ink)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {inv.email}
              </span>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '999px',
                flexShrink: 0,
                background: inv.status === 'accepted' ? 'rgba(44,110,90,0.12)' : 'var(--bd-bg-soft)',
                color: inv.status === 'accepted' ? 'var(--bd-moss)' : 'var(--bd-ink-mute)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                {inv.status === 'accepted' ? '✓ Joined' : 'Pending'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Friends() {
  const { user: me } = useAuthStore()
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [friends, setFriends] = useState([])
  const [pending, setPending] = useState([])
  const [sentIds, setSentIds] = useState(new Set())
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const [friendsRes, pendingRes] = await Promise.all([
      api.get('/friendships/me'),
      api.get('/friendships/pending'),
    ])
    setFriends(friendsRes.data)
    setPending(pendingRes.data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!query.trim()) { setSearchResults([]); return }
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get('/users/search', { params: { q: query } })
        setSearchResults(data)
      } catch {
        setSearchResults([])
      }
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  const friendUserIds = new Set([
    ...friends.map(f => f.requester_id === me?.id ? f.addressee_id : f.requester_id),
    ...pending.map(p => p.requester_id),
  ])

  async function sendRequest(userId) {
    await api.post('/friendships', { addressee_id: userId })
    setSentIds(s => new Set([...s, userId]))
  }

  async function accept(friendship) {
    await api.patch(`/friendships/${friendship.id}`, { action: 'accept' })
    load()
  }

  async function reject(friendship) {
    await api.patch(`/friendships/${friendship.id}`, { action: 'reject' })
    load()
  }

  async function removeFriend(friendship) {
    await api.delete(`/friendships/${friendship.id}`)
    load()
  }

  function friendFor(friendship) {
    const otherId = friendship.requester_id === me?.id ? friendship.addressee_id : friendship.requester_id
    return { id: otherId, username: `User ${otherId}`, avatar_url: null, _friendship: friendship }
  }

  const section = (title, content) => (
    <div style={{ marginBottom: '2rem' }}>
      <h2 style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--bd-ink-mute)', marginBottom: '0.5rem' }}>{title}</h2>
      {content}
    </div>
  )

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
      <PineTrees size="md" label="Loading friends…" />
    </div>
  )

  return (
    <div style={{ maxWidth: 520, margin: '2rem auto', padding: '0 1.25rem' }}>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.75rem', color: 'var(--bd-ink)' }}>Friends</h1>

      {/* Invite by email */}
      {section('Invite someone', <InvitePanel />)}

      {/* Search */}
      {section('Find people', (
        <>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by username…"
            style={{
              width: '100%', boxSizing: 'border-box',
              border: '1px solid var(--bd-rule)', borderRadius: '0.625rem',
              padding: '0.5rem 0.875rem', fontSize: '0.9rem',
              background: 'var(--bd-card)', color: 'var(--bd-ink)',
              outline: 'none', marginBottom: '0.5rem',
            }}
          />
          {searchResults.map(u => (
            <UserRow key={u.id} user={u} action={
              friendUserIds.has(u.id) ? (
                <span style={{ fontSize: '0.8rem', color: 'var(--bd-ink-mute)' }}>
                  {pending.some(p => p.requester_id === u.id) ? 'Pending' : 'Friends'}
                </span>
              ) : sentIds.has(u.id) ? (
                <span style={{ fontSize: '0.8rem', color: 'var(--bd-ink-mute)' }}>Sent</span>
              ) : (
                <Btn onClick={() => sendRequest(u.id)}>Add</Btn>
              )
            } />
          ))}
          {query.trim() && searchResults.length === 0 && (
            <p style={{ fontSize: '0.875rem', color: 'var(--bd-ink-mute)' }}>No users found.</p>
          )}
        </>
      ))}

      {/* Pending requests */}
      {pending.length > 0 && section(`Requests · ${pending.length}`, (
        pending.map(f => (
          <FriendRequestRow key={f.id} friendship={f} onAccept={() => accept(f)} onReject={() => reject(f)} />
        ))
      ))}

      {/* Friends list */}
      {section(`Friends · ${friends.length}`, (
        friends.length === 0
          ? <p style={{ fontSize: '0.875rem', color: 'var(--bd-ink-mute)' }}>No friends yet — search for people above.</p>
          : friends.map(f => {
              const otherId = f.requester_id === me?.id ? f.addressee_id : f.requester_id
              return (
                <FriendRow key={f.id} friendship={f} otherId={otherId} onRemove={() => removeFriend(f)} />
              )
            })
      ))}
    </div>
  )
}

function FriendRequestRow({ friendship, onAccept, onReject }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    api.get(`/users/${friendship.requester_id}`).then(({ data }) => setUser(data)).catch(() => {})
  }, [friendship.requester_id])

  if (!user) return null

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0', borderBottom: '1px solid var(--bd-rule-soft)' }}>
      <Avatar user={user} />
      <span style={{ flex: 1, fontWeight: 500, fontSize: '0.9rem', color: 'var(--bd-ink)' }}>{user.username}</span>
      <div style={{ display: 'flex', gap: '0.375rem' }}>
        <Btn onClick={onAccept}>Accept</Btn>
        <Btn onClick={onReject} variant="ghost">Decline</Btn>
      </div>
    </div>
  )
}

function FriendRow({ friendship, otherId, onRemove }) {
  const [user, setUser] = useState(null)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    api.get(`/users/${otherId}`).then(({ data }) => setUser(data)).catch(() => {})
  }, [otherId])

  if (!user) return null

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0', borderBottom: '1px solid var(--bd-rule-soft)' }}>
      <Avatar user={user} />
      <span style={{ flex: 1, fontWeight: 500, fontSize: '0.9rem', color: 'var(--bd-ink)' }}>{user.username}</span>
      {confirming ? (
        <div style={{ display: 'flex', gap: '0.375rem' }}>
          <Btn onClick={onRemove} variant="danger">Remove</Btn>
          <Btn onClick={() => setConfirming(false)} variant="ghost">Cancel</Btn>
        </div>
      ) : (
        <Btn onClick={() => setConfirming(true)} variant="ghost">Unfriend</Btn>
      )}
    </div>
  )
}
