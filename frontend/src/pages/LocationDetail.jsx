import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/client'
import { useToast } from '../components/Toast'

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

const TYPE_LABEL = {
  park: 'Park', nature_reserve: 'Nature Reserve', garden: 'Garden',
  woodland: 'Woodland', grassland: 'Grassland', wetland: 'Wetland',
  river: 'River', lake: 'Lake', pond: 'Pond', canal: 'Canal',
  reservoir: 'Reservoir', stream: 'Stream', user: 'Custom',
}

function SightingRow({ sighting }) {
  return (
    <Link
      to={`/species/${sighting.species_id}`}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        borderRadius: '1rem', border: '1px solid var(--bd-rule)',
        background: 'var(--bd-card)', padding: '0.75rem 1rem',
        textDecoration: 'none', transition: 'opacity 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    >
      {sighting.photo_url ? (
        <img src={sighting.photo_url} alt="" style={{ width: 48, height: 48, borderRadius: '0.625rem', objectFit: 'cover', flexShrink: 0 }} />
      ) : (
        <div style={{ width: 48, height: 48, borderRadius: '0.625rem', display: 'grid', placeItems: 'center', flexShrink: 0, background: 'var(--bd-bg)' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--bd-ink-mute)' }}>
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--bd-ink)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {sighting.common_name || `Species #${sighting.species_id}`}
        </p>
        {sighting.scientific_name && (
          <p style={{ fontSize: '0.72rem', fontStyle: 'italic', color: 'var(--bd-ink-mute)', margin: '0.1rem 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sighting.scientific_name}</p>
        )}
        <p style={{ fontSize: '0.75rem', color: 'var(--bd-ink-mute)', margin: '0.1rem 0 0' }}>{formatDate(sighting.identified_at)}</p>
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--bd-ink-mute)', flexShrink: 0 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
      </svg>
    </Link>
  )
}

export default function LocationDetail() {
  const { id } = useParams()
  const showToast = useToast()
  const [location, setLocation] = useState(null)
  const [sightings, setSightings] = useState([])
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get(`/locations/${id}`).then(r => r.data),
      api.get(`/locations/${id}/sightings`).then(r => r.data).catch(() => []),
      api.get('/locations/saved').then(r => r.data).catch(() => []),
    ]).then(([loc, sight, savedList]) => {
      setLocation(loc)
      setSightings(sight)
      setSaved(savedList.some(s => s.id === Number(id)))
    }).finally(() => setLoading(false))
  }, [id])

  const toggleSave = async () => {
    setSaving(true)
    try {
      if (saved) {
        await api.delete(`/locations/${id}/save`)
        setSaved(false)
        showToast('Removed from saved places')
      } else {
        await api.post(`/locations/${id}/save`)
        setSaved(true)
        showToast('Saved to your places')
      }
    } catch {
      showToast('Something went wrong', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {[80, 128, 256].map(h => (
          <div key={h} style={{ height: h, borderRadius: '1.5rem', background: 'var(--bd-rule-soft)' }} className="animate-pulse" />
        ))}
      </div>
    )
  }

  if (!location) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '2rem 1rem' }}>
        <p style={{ fontSize: '0.875rem', color: 'var(--bd-ink-mute)' }}>Location not found.</p>
        <Link to="/" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--bd-moss)', marginTop: '0.5rem', display: 'block', textDecoration: 'none' }}>Back to home</Link>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--bd-ink)', margin: 0 }}>{location.name}</h1>
          {location.type && (
            <span style={{ marginTop: '0.25rem', display: 'inline-block', fontSize: '0.75rem', fontWeight: 500, padding: '2px 10px', borderRadius: '999px', background: 'var(--bd-bg)', color: 'var(--bd-ink-mute)', border: '1px solid var(--bd-rule)' }}>
              {TYPE_LABEL[location.type] ?? location.type}
            </span>
          )}
        </div>
        <button
          onClick={toggleSave}
          disabled={saving}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: '999px',
            border: `1px solid ${saved ? 'var(--bd-moss)' : 'var(--bd-rule)'}`,
            background: saved ? 'var(--bd-rule-soft)' : 'var(--bd-card)',
            color: saved ? 'var(--bd-moss)' : 'var(--bd-ink-mute)',
            fontSize: '0.875rem', fontWeight: 500, cursor: saving ? 'default' : 'pointer',
            opacity: saving ? 0.5 : 1, transition: 'opacity 0.15s',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" d="M5 4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v17l-7-3.5L5 21V4z"/>
          </svg>
          {saved ? 'Saved' : 'Save'}
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div style={{ background: 'var(--bd-card)', border: '1px solid var(--bd-rule)', borderRadius: '1.5rem', padding: '1rem 1.25rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--bd-ink-mute)', margin: 0 }}>Sightings here</p>
          <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--bd-moss)', marginTop: '0.4rem', lineHeight: 1 }}>{sightings.length}</p>
        </div>
        {location.lat && location.lng && (
          <div style={{ background: 'var(--bd-card)', border: '1px solid var(--bd-rule)', borderRadius: '1.5rem', padding: '1rem 1.25rem' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--bd-ink-mute)', margin: 0 }}>Coordinates</p>
            <p style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--bd-ink)', marginTop: '0.4rem' }}>
              {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
            </p>
          </div>
        )}
      </div>

      {/* Identify CTA */}
      <Link
        to={`/identify?location_id=${id}`}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--bd-card)', border: '1px solid var(--bd-rule)',
          borderRadius: '1.5rem', padding: '1rem 1.25rem',
          textDecoration: 'none', transition: 'opacity 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
      >
        <div>
          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--bd-ink)', margin: 0 }}>Identify something here</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--bd-ink-mute)', marginTop: '0.2rem' }}>Photo or audio — sighting logged to this place</p>
        </div>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--bd-moss)', flexShrink: 0 }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
        </svg>
      </Link>

      {/* Sightings */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--bd-ink)', margin: 0 }}>
          Recent sightings{sightings.length > 0 && <span style={{ fontWeight: 400, color: 'var(--bd-ink-mute)', marginLeft: '0.4rem', fontSize: '0.875rem' }}>({sightings.length})</span>}
        </h2>
        {sightings.length === 0 ? (
          <p style={{ fontSize: '0.875rem', color: 'var(--bd-ink-mute)' }}>No sightings logged here yet. Be the first!</p>
        ) : (
          sightings.map(s => <SightingRow key={s.id} sighting={s} />)
        )}
      </section>
    </div>
  )
}
