import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../api/client'
import useAuthStore from '../store/authStore'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function Avatar({ user, size = 48 }) {
  if (user.avatar_url) {
    return <img src={user.avatar_url} alt={user.username} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'var(--bd-moss)', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700, fontSize: size * 0.4 }}>
      {user.username[0].toUpperCase()}
    </div>
  )
}

export default function UserProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user: me } = useAuthStore()

  const [profile, setProfile] = useState(null)
  const [sightings, setSightings] = useState([])
  const [badges, setBadges] = useState([])
  const [friendship, setFriendship] = useState(null) // null | 'accepted' | 'pending_sent' | 'pending_received'
  const [friendshipId, setFriendshipId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionBusy, setActionBusy] = useState(false)

  // Redirect to own profile page if viewing self
  useEffect(() => {
    if (me && Number(id) === me.id) { navigate('/profile', { replace: true }); return }

    Promise.all([
      api.get(`/users/${id}`).then(r => r.data),
      api.get(`/sightings/user/${id}`).then(r => r.data).catch(() => []),
      api.get(`/badges/user/${id}`).then(r => r.data).catch(() => []),
      api.get('/friendships/me').then(r => r.data).catch(() => []),
      api.get('/friendships/pending').then(r => r.data).catch(() => []),
    ]).then(([prof, sight, bdg, friends, pending]) => {
      setProfile(prof)
      setSightings(sight)
      setBadges(bdg)

      const uid = Number(id)
      const accepted = friends.find(f => (f.requester_id === uid || f.addressee_id === uid))
      if (accepted) { setFriendship('accepted'); setFriendshipId(accepted.id); return }
      const pendingReceived = pending.find(f => f.requester_id === uid)
      if (pendingReceived) { setFriendship('pending_received'); setFriendshipId(pendingReceived.id); return }
    }).catch(() => {})
      .finally(() => setLoading(false))
  }, [id, me, navigate])

  // Also check outgoing pending
  useEffect(() => {
    if (!me || !id) return
    // Check if we already sent a request to this user
    api.get('/friendships/me').then(r => {
      const uid = Number(id)
      // friendships/me returns accepted; for pending sent we query all
    }).catch(() => {})
  }, [id, me])

  const sendRequest = async () => {
    setActionBusy(true)
    try {
      const { data } = await api.post('/friendships', { addressee_id: Number(id) })
      setFriendship('pending_sent')
      setFriendshipId(data.id)
    } catch { /* already exists or blocked */ }
    finally { setActionBusy(false) }
  }

  const acceptRequest = async () => {
    setActionBusy(true)
    try {
      await api.patch(`/friendships/${friendshipId}`, { status: 'accepted' })
      setFriendship('accepted')
    } catch {}
    finally { setActionBusy(false) }
  }

  const unfriend = async () => {
    setActionBusy(true)
    try {
      await api.delete(`/friendships/${friendshipId}`)
      setFriendship(null)
      setFriendshipId(null)
    } catch {}
    finally { setActionBusy(false) }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {[80, 140, 280].map(h => (
          <div key={h} style={{ height: h, borderRadius: '1.5rem', background: 'var(--bd-rule-soft)' }} className="animate-pulse" />
        ))}
      </div>
    )
  }

  if (!profile) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '2rem 1rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--bd-ink-mute)', fontSize: '0.875rem' }}>User not found.</p>
        <Link to="/" style={{ color: 'var(--bd-moss)', fontSize: '0.875rem', textDecoration: 'none', display: 'inline-block', marginTop: '1rem' }}>Go home</Link>
      </div>
    )
  }

  const FriendButton = () => {
    if (friendship === 'accepted') return (
      <button onClick={unfriend} disabled={actionBusy} style={{ padding: '0.4rem 1.1rem', borderRadius: '999px', border: '1px solid var(--bd-rule)', background: 'var(--bd-card)', color: 'var(--bd-ink-mute)', fontSize: '0.8rem', cursor: 'pointer' }}>
        Friends
      </button>
    )
    if (friendship === 'pending_sent') return (
      <span style={{ padding: '0.4rem 1.1rem', borderRadius: '999px', border: '1px solid var(--bd-rule)', color: 'var(--bd-ink-mute)', fontSize: '0.8rem' }}>Request sent</span>
    )
    if (friendship === 'pending_received') return (
      <button onClick={acceptRequest} disabled={actionBusy} style={{ padding: '0.4rem 1.1rem', borderRadius: '999px', background: 'var(--bd-moss)', color: '#fff', border: 'none', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
        Accept request
      </button>
    )
    return (
      <button onClick={sendRequest} disabled={actionBusy} style={{ padding: '0.4rem 1.1rem', borderRadius: '999px', background: 'var(--bd-moss)', color: '#fff', border: 'none', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
        Add friend
      </button>
    )
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Back */}
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--bd-ink-mute)', fontSize: '0.875rem', padding: 0, alignSelf: 'flex-start' }}>
        ← Back
      </button>

      {/* Header */}
      <div style={{ background: 'var(--bd-card)', border: '1px solid var(--bd-rule)', borderRadius: '1.5rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Avatar user={profile} size={56} />
            <div>
              <h1 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--bd-ink)', margin: 0 }}>{profile.username}</h1>
              {profile.location_name && (
                <p style={{ fontSize: '0.8rem', color: 'var(--bd-ink-mute)', margin: '0.2rem 0 0' }}>{profile.location_name}</p>
              )}
            </div>
          </div>
          <FriendButton />
        </div>
        {profile.bio && (
          <p style={{ fontSize: '0.875rem', color: 'var(--bd-ink-mute)', marginTop: '1rem', lineHeight: 1.6 }}>{profile.bio}</p>
        )}

        {/* Stats row */}
        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--bd-rule-soft)' }}>
          {[
            { label: 'Sightings', value: sightings.length },
            { label: 'Badges', value: badges.length },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--bd-moss)' }}>{value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--bd-ink-mute)', marginTop: '0.1rem' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sightings */}
      <section>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--bd-ink)', margin: '0 0 0.75rem' }}>
          Sightings {sightings.length > 0 && <span style={{ fontWeight: 400, color: 'var(--bd-ink-mute)', fontSize: '0.875rem' }}>({sightings.length})</span>}
        </h2>
        {sightings.length === 0 ? (
          <p style={{ fontSize: '0.875rem', color: 'var(--bd-ink-mute)' }}>No public sightings yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {sightings.slice(0, 10).map(s => (
              <Link
                key={s.id}
                to={`/species/${s.species_id}`}
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bd-card)', border: '1px solid var(--bd-rule-soft)', borderRadius: '1rem', overflow: 'hidden', textDecoration: 'none' }}
              >
                <div style={{ width: 52, height: 52, flexShrink: 0, background: 'var(--bd-bg-soft)' }}>
                  {s.photo_url && <img src={s.photo_url} alt={s.common_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0, padding: '0.5rem 0' }}>
                  <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--bd-ink)', margin: 0 }}>{s.common_name}</p>
                  <p style={{ fontSize: '0.75rem', fontStyle: 'italic', color: 'var(--bd-ink-mute)', margin: '0.1rem 0 0' }}>{s.scientific_name}</p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--bd-ink-soft)', margin: '0.1rem 0 0' }}>{formatDate(s.identified_at)}{s.place_name ? ` · ${s.place_name}` : ''}</p>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--bd-ink-mute)', marginRight: '0.75rem', flexShrink: 0 }}>
                  <path d="M9 5l7 7-7 7"/>
                </svg>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Badges */}
      {badges.length > 0 && (
        <section>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--bd-ink)', margin: '0 0 0.75rem' }}>Badges</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem' }}>
            {badges.map(item => (
              <div
                key={item.badge.id}
                title={item.badge.description || item.badge.name}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.875rem', borderRadius: '999px', background: 'var(--bd-card)', border: '1px solid var(--bd-rule)', fontSize: '0.8rem', color: 'var(--bd-ink)' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="var(--bd-moss)" style={{ flexShrink: 0 }}>
                  <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
                </svg>
                {item.badge.name}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
