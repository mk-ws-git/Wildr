import { useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/client'

function useGPS() {
  const [coords, setCoords] = useState(null)
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (p) => setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {}
    )
  }, [])
  return coords
}

function PlaceNameInput({ value, onChange, pastNames }) {
  const [open, setOpen] = useState(false)
  const filtered = pastNames.filter(
    n => n.toLowerCase().includes(value.toLowerCase()) && n !== value
  ).slice(0, 5)

  return (
    <div style={{ position: 'relative' }}>
      <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--bd-ink-mute)', marginBottom: 4 }}>Place nickname (optional)</label>
      <input
        type="text"
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="e.g. Back garden, Regent's Park…"
        style={{ width: '100%', borderRadius: '0.75rem', border: '1px solid var(--bd-rule)', padding: '0.5rem 0.75rem', fontSize: '0.875rem', background: 'var(--bd-bg)', color: 'var(--bd-ink)', boxSizing: 'border-box' }}
      />
      {open && filtered.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bd-card)', border: '1px solid var(--bd-rule)', borderRadius: '0.75rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10, marginTop: 2 }}>
          {filtered.map(s => (
            <div key={s} onMouseDown={() => { onChange(s); setOpen(false) }} style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem', cursor: 'pointer', color: 'var(--bd-ink)' }}>
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function LogSighting() {
  const navigate = useNavigate()
  const coords = useGPS()

  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [selectedSpecies, setSelectedSpecies] = useState(null)
  const [searching, setSearching] = useState(false)

  const [placeName, setPlaceName] = useState('')
  const [pastPlaceNames, setPastPlaceNames] = useState([])
  const [facilities, setFacilities] = useState([])
  const [notes, setNotes] = useState('')
  const [locationId, setLocationId] = useState(null)
  const [locations, setLocations] = useState([])

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)

  const debounceRef = useRef(null)

  useEffect(() => {
    api.get('/locations').then(({ data }) => setLocations(data)).catch(() => {})
    api.get('/sightings/me?limit=200')
      .then(({ data }) => {
        const names = [...new Set(data.map(s => s.place_name).filter(Boolean))]
        setPastPlaceNames(names)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (query.length < 2) { setSuggestions([]); return }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const { data } = await api.get(`/species?search=${encodeURIComponent(query)}&limit=8`)
        setSuggestions(data)
      } catch { setSuggestions([]) } finally { setSearching(false) }
    }, 300)
  }, [query])

  const pickSpecies = (sp) => {
    setSelectedSpecies(sp)
    setQuery(sp.common_name)
    setSuggestions([])
  }

  const toggleFacility = (key) =>
    setFacilities(prev => prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key])

  const submit = async () => {
    if (!selectedSpecies) { setError('Please select a species.'); return }
    setSaving(true)
    setError(null)
    try {
      await api.post('/sightings', {
        species_id: selectedSpecies.id,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
        location_id: locationId || null,
        place_name: placeName || null,
        notes: notes || null,
      })
      setDone(true)
    } catch (e) {
      setError(e.response?.data?.detail || 'Could not save sighting.')
    } finally {
      setSaving(false)
    }
  }

  if (done) {
    return (
      <div className="max-w-md mx-auto px-4 py-10 text-center space-y-4">
        <div style={{ fontSize: '2.5rem' }}>✓</div>
        <h2 style={{ fontWeight: 700, color: 'var(--bd-ink)', fontSize: '1.25rem' }}>Sighting logged!</h2>
        <p style={{ color: 'var(--bd-ink-mute)', fontSize: '0.875rem' }}>{selectedSpecies.common_name} added to your life list.</p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => { setDone(false); setSelectedSpecies(null); setQuery(''); setPlaceName(''); setNotes(''); setFacilities([]) }}
            style={{ padding: '0.5rem 1.25rem', borderRadius: '999px', background: 'var(--bd-moss)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}
          >
            Log another
          </button>
          <button
            onClick={() => navigate('/sightings')}
            style={{ padding: '0.5rem 1.25rem', borderRadius: '999px', border: '1px solid var(--bd-rule)', background: 'var(--bd-card)', color: 'var(--bd-ink)', cursor: 'pointer', fontSize: '0.875rem' }}
          >
            View all sightings
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-5">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Link to="/sightings" style={{ fontSize: '0.875rem', color: 'var(--bd-ink-mute)', textDecoration: 'none' }}>← Back</Link>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--bd-ink)', margin: 0 }}>Log a sighting</h1>
      </div>
      <p style={{ fontSize: '0.875rem', color: 'var(--bd-ink-mute)', marginTop: '-0.5rem' }}>
        Record a species you've spotted without using the camera or microphone.
      </p>

      {/* Species search */}
      <div>
        <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--bd-ink-mute)', marginBottom: 4 }}>Species</label>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedSpecies(null) }}
            placeholder="Search by common or scientific name…"
            style={{ width: '100%', borderRadius: '0.75rem', border: `1px solid ${selectedSpecies ? 'var(--bd-moss)' : 'var(--bd-rule)'}`, padding: '0.5rem 0.75rem', fontSize: '0.875rem', background: 'var(--bd-bg)', color: 'var(--bd-ink)', boxSizing: 'border-box' }}
          />
          {searching && (
            <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: 'var(--bd-ink-mute)' }}>…</span>
          )}
          {suggestions.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bd-card)', border: '1px solid var(--bd-rule)', borderRadius: '0.75rem', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 20, marginTop: 2, maxHeight: 240, overflowY: 'auto' }}>
              {suggestions.map(sp => (
                <div
                  key={sp.id}
                  onMouseDown={() => pickSpecies(sp)}
                  style={{ padding: '0.625rem 0.875rem', cursor: 'pointer', borderBottom: '1px solid var(--bd-rule-soft)' }}
                >
                  <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--bd-ink)', margin: 0 }}>{sp.common_name}</p>
                  <p style={{ fontSize: '0.78rem', fontStyle: 'italic', color: 'var(--bd-ink-mute)', margin: 0 }}>{sp.scientific_name}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        {selectedSpecies && (
          <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', background: 'var(--bd-bg)', borderRadius: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--bd-ink)', margin: 0 }}>{selectedSpecies.common_name}</p>
              <p style={{ fontSize: '0.75rem', fontStyle: 'italic', color: 'var(--bd-ink-mute)', margin: 0 }}>{selectedSpecies.scientific_name}</p>
            </div>
            <button onClick={() => { setSelectedSpecies(null); setQuery('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--bd-ink-mute)' }}>✕</button>
          </div>
        )}
      </div>

      {/* Place nickname */}
      <PlaceNameInput value={placeName} onChange={setPlaceName} pastNames={pastPlaceNames} />

      {/* Facilities — only shown when entering a new place nickname */}
      {placeName.trim() && (
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--bd-ink-mute)', marginBottom: 6 }}>Facilities at this spot (optional)</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {[
              { key: 'bbq', label: 'BBQ' },
              { key: 'playground', label: 'Playground' },
              { key: 'washrooms', label: 'Washrooms' },
              { key: 'sports_field', label: 'Sports field' },
              { key: 'picnic', label: 'Picnic area' },
              { key: 'car_park', label: 'Car park' },
              { key: 'cycling', label: 'Cycling' },
              { key: 'dog_friendly', label: 'Dog friendly' },
              { key: 'cafe', label: 'Cafe' },
              { key: 'fishing', label: 'Fishing' },
            ].map(({ key, label }) => {
              const active = facilities.includes(key)
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleFacility(key)}
                  style={{
                    padding: '0.3rem 0.75rem',
                    borderRadius: '999px',
                    fontSize: '0.78rem',
                    fontWeight: active ? 600 : 400,
                    border: `1px solid ${active ? 'var(--bd-moss)' : 'var(--bd-rule)'}`,
                    background: active ? 'var(--bd-moss)' : 'var(--bd-card)',
                    color: active ? '#fff' : 'var(--bd-ink-soft)',
                    cursor: 'pointer',
                    transition: 'all 0.1s',
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Named location */}
      <div>
        <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--bd-ink-mute)', marginBottom: 4 }}>Named location (optional)</label>
        <select
          value={locationId ?? ''}
          onChange={e => setLocationId(e.target.value ? Number(e.target.value) : null)}
          style={{ width: '100%', borderRadius: '0.75rem', border: '1px solid var(--bd-rule)', padding: '0.5rem 0.75rem', fontSize: '0.875rem', background: 'var(--bd-bg)', color: 'var(--bd-ink)', boxSizing: 'border-box' }}
        >
          <option value="">No location selected</option>
          {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </div>

      {/* Notes */}
      <div>
        <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--bd-ink-mute)', marginBottom: 4 }}>Notes (optional)</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Behaviour, count, conditions…"
          rows={3}
          style={{ width: '100%', borderRadius: '0.75rem', border: '1px solid var(--bd-rule)', padding: '0.5rem 0.75rem', fontSize: '0.875rem', background: 'var(--bd-bg)', color: 'var(--bd-ink)', resize: 'vertical', boxSizing: 'border-box' }}
        />
      </div>

      {/* GPS info */}
      {coords ? (
        <p style={{ fontSize: '0.75rem', color: 'var(--bd-ink-mute)' }}>GPS: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</p>
      ) : (
        <p style={{ fontSize: '0.75rem', color: 'var(--bd-ink-mute)' }}>No GPS — location won't be pinned on map.</p>
      )}

      {error && <p style={{ fontSize: '0.875rem', color: 'var(--bd-terra, #c0392b)' }}>{error}</p>}

      <button
        onClick={submit}
        disabled={saving || !selectedSpecies}
        style={{ width: '100%', padding: '0.625rem', borderRadius: '0.75rem', background: 'var(--bd-moss)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', opacity: (saving || !selectedSpecies) ? 0.5 : 1 }}
      >
        {saving ? 'Saving…' : 'Log sighting'}
      </button>
    </div>
  )
}
