import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/client'

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
      className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm hover:bg-gray-50 transition-colors"
    >
      {sighting.photo_url ? (
        <img src={sighting.photo_url} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
      ) : (
        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--bd-rule-soft)' }}>
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 64 64" style={{ color: 'var(--bd-ink-mute)' }}>
            <path d="M52 20c-1.1 0-2 .9-2 2v2c0 3.3-2.7 6-6 6H28l-5-10H10C7.8 20 6 21.8 6 24s1.8 4 4 4h3l3 6H10c-1.1 0-2 .9-2 2s.9 2 2 2h8l3 6h18c4.4 0 8-3.6 8-8v-2h3c4.4 0 8-3.6 8-8v-2c0-1.1-.9-2-2-2z" />
          </svg>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--bd-ink)' }}>Species #{sighting.species_id}</p>
        <p className="text-xs" style={{ color: 'var(--bd-ink-mute)' }}>{formatDate(sighting.identified_at)}</p>
      </div>
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color: 'var(--bd-ink-mute)' }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  )
}

export default function LocationDetail() {
  const { id } = useParams()
  const [location, setLocation] = useState(null)
  const [sightings, setSightings] = useState([])
  const [saved, setSaved] = useState(false)
  const [savingState, setSavingState] = useState('idle') // idle | saving | done
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get(`/locations/${id}`).then((r) => r.data),
      api.get(`/locations/${id}/sightings`).then((r) => r.data).catch(() => []),
      api.get('/locations/saved').then((r) => r.data).catch(() => []),
    ]).then(([loc, sight, savedList]) => {
      setLocation(loc)
      setSightings(sight)
      setSaved(savedList.some((s) => s.id === Number(id)))
    }).finally(() => setLoading(false))
  }, [id])

  const toggleSave = async () => {
    setSavingState('saving')
    try {
      if (saved) {
        await api.delete(`/locations/${id}/save`)
        setSaved(false)
      } else {
        await api.post(`/locations/${id}/save`)
        setSaved(true)
      }
    } finally {
      setSavingState('idle')
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="h-8 w-48 rounded-2xl animate-pulse" style={{ backgroundColor: 'var(--bd-rule-soft)' }} />
        <div className="h-32 rounded-3xl animate-pulse" style={{ backgroundColor: 'var(--bd-rule-soft)' }} />
        <div className="h-64 rounded-3xl animate-pulse" style={{ backgroundColor: 'var(--bd-rule-soft)' }} />
      </div>
    )
  }

  if (!location) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <p className="text-sm" style={{ color: 'var(--bd-ink-soft)' }}>Location not found.</p>
        <Link to="/" className="text-sm font-medium mt-2 block" style={{ color: 'var(--bd-moss)' }}>Back to home</Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--bd-ink)' }}>{location.name}</h1>
          {location.type && (
            <span className="mt-1 inline-block text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--bd-rule-soft)', color: 'var(--bd-ink-soft)' }}>
              {TYPE_LABEL[location.type] ?? location.type}
            </span>
          )}
        </div>
        <button
          onClick={toggleSave}
          disabled={savingState === 'saving'}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-colors disabled:opacity-50"
          style={saved
            ? { borderColor: 'var(--bd-moss)', color: 'var(--bd-moss)', backgroundColor: 'var(--bd-rule-soft)' }
            : { borderColor: 'var(--bd-rule)', color: 'var(--bd-ink-soft)', backgroundColor: 'white' }
          }
        >
          <svg className="w-4 h-4" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" d="M5 4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v17l-7-3.5L5 21V4z" />
          </svg>
          {saved ? 'Saved' : 'Save'}
        </button>
      </div>

      {/* stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-3xl border border-gray-200 bg-white shadow-sm p-4">
          <p className="text-xs" style={{ color: 'var(--bd-ink-mute)' }}>Sightings here</p>
          <p className="mt-2 text-3xl font-semibold" style={{ color: 'var(--bd-ink)' }}>{sightings.length}</p>
        </div>
        {location.lat && location.lng && (
          <div className="rounded-3xl border border-gray-200 bg-white shadow-sm p-4">
            <p className="text-xs" style={{ color: 'var(--bd-ink-mute)' }}>Coordinates</p>
            <p className="mt-2 text-sm font-mono" style={{ color: 'var(--bd-ink)' }}>
              {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
            </p>
          </div>
        )}
      </div>

      {/* identify CTA */}
      <Link
        to={`/identify?location_id=${id}`}
        className="flex items-center justify-between rounded-3xl border border-gray-200 bg-white shadow-sm px-5 py-4 hover:bg-gray-50 transition-colors"
      >
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--bd-ink)' }}>Identify something here</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--bd-ink-mute)' }}>Photo or audio — sighting logged to this place</p>
        </div>
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color: 'var(--bd-moss)' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </Link>

      {/* sightings list */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold" style={{ color: 'var(--bd-ink)' }}>
          Recent sightings {sightings.length > 0 && <span className="text-sm font-normal" style={{ color: 'var(--bd-ink-mute)' }}>({sightings.length})</span>}
        </h2>
        {sightings.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--bd-ink-soft)' }}>No sightings logged here yet. Be the first!</p>
        ) : (
          sightings.map((s) => <SightingRow key={s.id} sighting={s} />)
        )}
      </section>
    </div>
  )
}
