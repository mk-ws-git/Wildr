import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import useAuthStore from '../store/authStore'

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

function initials(name) {
  return name.split(' ').map(p => p[0]?.toUpperCase() || '').slice(0, 2).join('')
}

export default function Profile() {
  const user = useAuthStore((state) => state.user)
  const [recentSightings, setRecentSightings] = useState([])
  const [badges, setBadges] = useState([])
  const [friendships, setFriendships] = useState([])
  const [savedLocations, setSavedLocations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    Promise.all([
      api.get('/sightings/me?limit=3').then(r => r.data).catch(() => []),
      api.get('/badges/me').then(r => r.data).catch(() => []),
      api.get('/friendships/me').then(r => r.data).catch(() => []),
      api.get('/locations/saved').then(r => r.data).catch(() => []),
    ])
      .then(([sightingsData, badgesData, friendshipData, savedData]) => {
        setRecentSightings(sightingsData)
        setBadges(badgesData)
        setFriendships(friendshipData)
        setSavedLocations(savedData)
      })
      .finally(() => setLoading(false))
  }, [user])

  if (!user) return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1rem', color: 'var(--bd-ink-mute)' }}>
      Loading profile…
    </div>
  )

  const acceptedFriends = friendships.filter(f => f.status === 'accepted')
  const pendingRequests = friendships.filter(f => f.status === 'pending' && f.addressee_id === user.id)
  const outgoingRequests = friendships.filter(f => f.status === 'pending' && f.requester_id === user.id)

  const card = {
    background: 'var(--bd-card)',
    border: '1px solid var(--bd-rule)',
    borderRadius: '1.5rem',
  }

  const muted = { color: 'var(--bd-ink-mute)', fontSize: '0.8rem' }
  const ink = { color: 'var(--bd-ink)' }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Header */}
      <div style={{ ...card, padding: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'var(--bd-rule)', color: 'var(--bd-ink)',
              display: 'grid', placeItems: 'center',
              fontSize: '1.25rem', fontWeight: 600, flexShrink: 0, overflow: 'hidden',
            }}>
              {user.avatar_url
                ? <img src={user.avatar_url} alt={user.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : initials(user.username)}
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, ...ink, margin: 0 }}>{user.username}</h1>
              <p style={{ ...muted, marginTop: '0.25rem' }}>{user.bio || 'A curious nature lover building their Wildr profile.'}</p>
            </div>
          </div>
          <div style={{ background: 'var(--bd-bg)', borderRadius: '1rem', padding: '0.75rem 1.25rem', fontSize: '0.8rem' }}>
            <p style={{ ...muted, marginBottom: '0.2rem' }}>Member since</p>
            <p style={{ ...ink, fontWeight: 600 }}>{formatDate(user.created_at)}</p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
        {[
          { label: 'Sightings', count: recentSightings.length },
          { label: 'Badges', count: badges.length },
          { label: 'Friends', count: acceptedFriends.length },
          { label: 'Saved places', count: savedLocations.length },
        ].map(({ label, count }) => (
          <div key={label} style={{ ...card, padding: '1rem 1.25rem' }}>
            <p style={muted}>{label}</p>
            <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--bd-moss)', marginTop: '0.4rem', lineHeight: 1 }}>
              {loading ? '—' : count}
            </p>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) minmax(0,1fr)', gap: '1.25rem', alignItems: 'start' }}>

        {/* Left — details + sightings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ ...card, padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, ...ink, marginBottom: '1rem' }}>Profile details</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ background: 'var(--bd-bg)', borderRadius: '1rem', padding: '0.875rem 1rem' }}>
                <p style={muted}>Bio</p>
                <p style={{ ...ink, fontSize: '0.85rem', marginTop: '0.35rem' }}>{user.bio || 'No bio yet.'}</p>
              </div>
              <div style={{ background: 'var(--bd-bg)', borderRadius: '1rem', padding: '0.875rem 1rem' }}>
                <p style={muted}>Email</p>
                <p style={{ ...ink, fontSize: '0.85rem', marginTop: '0.35rem', wordBreak: 'break-all' }}>{user.email}</p>
              </div>
            </div>
          </div>

          <div style={{ ...card, padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, ...ink, margin: 0 }}>Recent sightings</h2>
              <Link to="/sightings" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--bd-moss)', textDecoration: 'none' }}>
                View all
              </Link>
            </div>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[0,1,2].map(i => <div key={i} style={{ height: 48, borderRadius: '0.75rem', background: 'var(--bd-bg)' }} />)}
              </div>
            ) : recentSightings.length === 0 ? (
              <p style={muted}>
                No sightings yet.{' '}
                <Link to="/identify" style={{ color: 'var(--bd-moss)', textDecoration: 'none' }}>Head to Identify</Link> to log your first.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {recentSightings.map(s => (
                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0.875rem', background: 'var(--bd-bg)', borderRadius: '0.75rem' }}>
                    <div>
                      <p style={{ fontSize: '0.875rem', fontWeight: 600, ...ink, margin: 0 }}>{s.common_name}</p>
                      <p style={{ fontSize: '0.75rem', fontStyle: 'italic', ...muted, margin: 0 }}>{s.scientific_name}</p>
                    </div>
                    <p style={{ ...muted, flexShrink: 0 }}>{formatDate(s.identified_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right — badges + community */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ ...card, padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, ...ink, margin: 0 }}>Badges</h2>
              <Link to="/badges" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--bd-moss)', textDecoration: 'none' }}>View all</Link>
            </div>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[0,1,2].map(i => <div key={i} style={{ height: 44, borderRadius: '0.75rem', background: 'var(--bd-bg)' }} />)}
              </div>
            ) : badges.length === 0 ? (
              <p style={muted}>No badges yet. Log a sighting to start earning.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {badges.slice(0, 5).map(item => (
                  <div key={item.badge.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', background: 'var(--bd-bg)', borderRadius: '0.75rem' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '0.5rem', background: 'var(--bd-moss)', display: 'grid', placeItems: 'center', color: '#fff', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                      {item.badge.name[0].toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: '0.8rem', fontWeight: 600, ...ink, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.badge.name}</p>
                      <p style={{ ...muted, margin: 0 }}>{formatDate(item.earned_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ ...card, padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, ...ink, marginBottom: '1rem' }}>Community</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { label: 'Friends', count: acceptedFriends.length },
                { label: 'Incoming requests', count: pendingRequests.length },
                { label: 'Outgoing requests', count: outgoingRequests.length },
              ].map(({ label, count }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0.875rem', background: 'var(--bd-bg)', borderRadius: '0.75rem' }}>
                  <p style={{ ...muted, margin: 0 }}>{label}</p>
                  <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--bd-moss)', margin: 0 }}>{loading ? '—' : count}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
