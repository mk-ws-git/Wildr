import { useEffect, useState } from 'react'
import api from '../api/client'

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function BadgeCard({ item }) {
  return (
    <div style={{ background: 'var(--bd-card)', border: '1px solid var(--bd-rule)', borderRadius: '1.5rem', padding: '1.25rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
      <div
        style={{ width: 48, height: 48, borderRadius: '0.75rem', background: 'var(--bd-moss)', display: 'grid', placeItems: 'center', flexShrink: 0, color: '#fff', fontSize: '1.1rem', fontWeight: 700 }}
      >
        {item.badge.icon_url ? (
          <img src={item.badge.icon_url} alt="" style={{ width: 32, height: 32, objectFit: 'contain' }} />
        ) : (
          item.badge.name[0].toUpperCase()
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--bd-ink)', margin: 0 }}>{item.badge.name}</p>
        {item.badge.description && (
          <p style={{ fontSize: '0.75rem', marginTop: '0.2rem', color: 'var(--bd-ink-mute)' }}>{item.badge.description}</p>
        )}
        <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: 'var(--bd-ink-mute)' }}>Earned {formatDate(item.earned_at)}</p>
      </div>
    </div>
  )
}

export default function Badges() {
  const [badges, setBadges] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/badges/me')
      .then(({ data }) => setBadges(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--bd-ink)', margin: 0 }}>Badges</h1>
        <p style={{ fontSize: '0.875rem', marginTop: '0.25rem', color: 'var(--bd-ink-mute)' }}>Achievements earned through your sightings and exploration.</p>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ height: 80, borderRadius: '1.5rem', background: 'var(--bd-rule-soft)' }} className="animate-pulse" />
          ))}
        </div>
      ) : badges.length === 0 ? (
        <div style={{ background: 'var(--bd-card)', border: '1px solid var(--bd-rule)', borderRadius: '1.5rem', padding: '3rem 1.5rem', textAlign: 'center' }}>
          <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--bd-ink)' }}>No badges yet</p>
          <p style={{ fontSize: '0.875rem', marginTop: '0.25rem', color: 'var(--bd-ink-mute)' }}>Log your first sighting to start earning.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}>
          {badges.map((item) => <BadgeCard key={item.badge.id} item={item} />)}
        </div>
      )}
    </div>
  )
}
