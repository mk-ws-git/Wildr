import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const FILTERS = [
  { label: 'All', value: null },
  { label: 'Birds', value: 'bird' },
  { label: 'Plants', value: 'plant' },
  { label: 'Fungi', value: 'fungi' },
  { label: 'Other', value: 'other' },
]

const RARITY_LABELS = {
  uncommon: 'Uncommon',
  rare: 'Rare',
  very_rare: 'Very Rare',
}

const CameraIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
)

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export default function Sightings() {
  const [sightings, setSightings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch('/api/sightings/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => { setSightings(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const visible = filter
    ? sightings.filter(s => {
        if (filter === 'other') return !['bird', 'plant', 'fungi'].includes(s.kingdom)
        return s.kingdom === filter
      })
    : sightings

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--bd-ink)', marginBottom: '1.5rem' }}>
        My Sightings
      </h1>

      {!loading && (
        <p style={{ fontSize: '0.8rem', color: 'var(--bd-ink-mute)', marginBottom: '0.75rem' }}>
          {visible.length} {visible.length === 1 ? 'sighting' : 'sightings'}
          {filter ? ` · ${FILTERS.find(f => f.value === filter)?.label}` : ''}
        </p>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button
            key={f.label}
            onClick={() => setFilter(f.value)}
            style={{
              padding: '0.375rem 0.875rem',
              borderRadius: '999px',
              border: '1px solid var(--bd-rule)',
              background: filter === f.value ? 'var(--bd-moss)' : 'var(--bd-card)',
              color: filter === f.value ? '#fff' : 'var(--bd-ink)',
              fontSize: '0.875rem',
              cursor: 'pointer',
              fontWeight: filter === f.value ? 600 : 400,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{ height: 80, borderRadius: '1rem', background: 'var(--bd-rule-soft)' }} className="animate-pulse" />
          ))}
        </div>
      )}

      {!loading && visible.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--bd-ink-mute)' }}>
          <p style={{ marginBottom: '1rem' }}>No sightings yet — head to Identify to log your first.</p>
          <Link
            to="/identify"
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '999px',
              background: 'var(--bd-moss)',
              color: '#fff',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          >
            Go to Identify
          </Link>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {visible.map(s => (
          <div
            key={s.id}
            style={{
              display: 'flex',
              gap: '1rem',
              background: 'var(--bd-card)',
              borderRadius: '1rem',
              border: '1px solid var(--bd-rule-soft)',
              overflow: 'hidden',
              alignItems: 'stretch',
            }}
          >
            <div style={{
              width: 88,
              minWidth: 88,
              background: 'var(--bd-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--bd-rule)',
            }}>
              {s.photo_url
                ? <img src={s.photo_url} alt={s.common_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <CameraIcon />
              }
            </div>

            <div style={{ padding: '0.875rem 0.75rem 0.875rem 0', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                <div>
                  <p style={{ fontWeight: 700, color: 'var(--bd-ink)', margin: 0, lineHeight: 1.3 }}>{s.common_name}</p>
                  <p style={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--bd-ink-mute)', margin: '0.1rem 0 0' }}>{s.scientific_name}</p>
                </div>
                {RARITY_LABELS[s.rarity_tier] && (
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    padding: '0.2rem 0.5rem',
                    borderRadius: '999px',
                    background: 'var(--bd-bg)',
                    border: '1px solid var(--bd-rule)',
                    color: 'var(--bd-ink-mute)',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}>
                    {RARITY_LABELS[s.rarity_tier]}
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--bd-ink-mute)', margin: '0.4rem 0 0' }}>
                {formatDate(s.identified_at)}
              </p>
              {s.weather_description && (
                <p style={{ fontSize: '0.75rem', color: 'var(--bd-ink-mute)', margin: '0.2rem 0 0' }}>
                  {s.weather_temp_c != null ? `${Math.round(s.weather_temp_c)}°C · ` : ''}{s.weather_description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
