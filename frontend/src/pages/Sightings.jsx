import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'

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
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
)

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

// ── Edit modal ────────────────────────────────────────────────────────────

function EditModal({ sighting, pastPlaceNames, onSave, onClose }) {
  const [placeName, setPlaceName] = useState(sighting.place_name || '')
  const [notes, setNotes] = useState(sighting.notes || '')
  const [saving, setSaving] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const inputRef = useRef(null)

  const filtered = pastPlaceNames.filter(
    p => p.toLowerCase().includes(placeName.toLowerCase()) && p !== placeName
  ).slice(0, 5)

  const submit = async () => {
    setSaving(true)
    try {
      const { data } = await api.patch(`/sightings/me/${sighting.id}`, {
        place_name: placeName || null,
        notes: notes || null,
      })
      onSave(data)
    } catch { /* silent */ } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'var(--bd-card)', borderRadius: '1.5rem', padding: '1.5rem', width: '100%', maxWidth: 400, boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
        <h3 style={{ margin: '0 0 1rem', fontWeight: 700, fontSize: '1rem', color: 'var(--bd-ink)' }}>
          Edit sighting — {sighting.common_name}
        </h3>

        <div style={{ marginBottom: '0.875rem', position: 'relative' }}>
          <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--bd-ink-mute)', marginBottom: 4 }}>Place nickname</label>
          <input
            ref={inputRef}
            type="text"
            value={placeName}
            onChange={e => { setPlaceName(e.target.value); setSuggestions(filtered) }}
            onFocus={() => setSuggestions(filtered)}
            onBlur={() => setTimeout(() => setSuggestions([]), 150)}
            placeholder="e.g. Back garden, Local canal…"
            style={{ width: '100%', borderRadius: '0.75rem', border: '1px solid var(--bd-rule)', padding: '0.5rem 0.75rem', fontSize: '0.875rem', background: 'var(--bd-bg)', color: 'var(--bd-ink)', boxSizing: 'border-box' }}
          />
          {suggestions.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bd-card)', border: '1px solid var(--bd-rule)', borderRadius: '0.75rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10, marginTop: 2 }}>
              {suggestions.map(s => (
                <div key={s} onMouseDown={() => { setPlaceName(s); setSuggestions([]) }} style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem', cursor: 'pointer', color: 'var(--bd-ink)' }}>
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--bd-ink-mute)', marginBottom: 4 }}>Notes</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Any observations…"
            rows={3}
            style={{ width: '100%', borderRadius: '0.75rem', border: '1px solid var(--bd-rule)', padding: '0.5rem 0.75rem', fontSize: '0.875rem', background: 'var(--bd-bg)', color: 'var(--bd-ink)', resize: 'vertical', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={submit}
            disabled={saving}
            style={{ flex: 1, padding: '0.5rem', borderRadius: '0.75rem', background: 'var(--bd-moss)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', opacity: saving ? 0.6 : 1 }}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: '0.5rem', borderRadius: '0.75rem', border: '1px solid var(--bd-rule)', background: 'var(--bd-card)', color: 'var(--bd-ink)', cursor: 'pointer', fontSize: '0.875rem' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function Sightings() {
  const [sightings, setSightings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState(null)
  const [editTarget, setEditTarget] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    api.get('/sightings/me?limit=200')
      .then(r => { setSightings(r.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const pastPlaceNames = [...new Set(sightings.map(s => s.place_name).filter(Boolean))]

  const visible = filter
    ? sightings.filter(s => {
        if (filter === 'other') return !['bird', 'plant', 'fungi'].includes(s.kingdom)
        return s.kingdom === filter
      })
    : sightings

  const handleSaved = (updated) => {
    setSightings(prev => prev.map(s => s.id === updated.id ? { ...s, ...updated } : s))
    setEditTarget(null)
  }

  const handleDelete = async (id) => {
    setDeleting(true)
    try {
      await api.delete(`/sightings/me/${id}`)
      setSightings(prev => prev.filter(s => s.id !== id))
      setConfirmDelete(null)
    } catch { /* silent */ } finally {
      setDeleting(false)
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--bd-ink)', margin: 0 }}>My Sightings</h1>
        <Link
          to="/log-sighting"
          style={{ padding: '0.4rem 1rem', borderRadius: '999px', background: 'var(--bd-moss)', color: '#fff', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}
        >
          + Log sighting
        </Link>
      </div>

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
              padding: '0.375rem 0.875rem', borderRadius: '999px',
              border: '1px solid var(--bd-rule)',
              background: filter === f.value ? 'var(--bd-moss)' : 'var(--bd-card)',
              color: filter === f.value ? '#fff' : 'var(--bd-ink)',
              fontSize: '0.875rem', cursor: 'pointer',
              fontWeight: filter === f.value ? 600 : 400,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[0,1,2,3].map(i => <div key={i} style={{ height: 80, borderRadius: '1rem', background: 'var(--bd-rule-soft)' }} className="animate-pulse" />)}
        </div>
      )}

      {!loading && visible.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--bd-ink-mute)' }}>
          <p style={{ marginBottom: '1rem' }}>No sightings yet — head to Identify to log your first.</p>
          <Link to="/identify" style={{ padding: '0.5rem 1.25rem', borderRadius: '999px', background: 'var(--bd-moss)', color: '#fff', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}>
            Go to Identify
          </Link>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {visible.map(s => (
          <div
            key={s.id}
            style={{ display: 'flex', gap: '1rem', background: 'var(--bd-card)', borderRadius: '1rem', border: '1px solid var(--bd-rule-soft)', overflow: 'hidden', alignItems: 'stretch' }}
          >
            {/* Thumbnail */}
            <div style={{ width: 88, minWidth: 88, background: 'var(--bd-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bd-rule)' }}>
              {s.photo_url
                ? <img src={s.photo_url} alt={s.common_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <CameraIcon />}
            </div>

            {/* Content */}
            <div style={{ padding: '0.875rem 0.5rem 0.875rem 0', flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontWeight: 700, color: 'var(--bd-ink)', margin: 0, lineHeight: 1.3 }}>{s.common_name}</p>
                  <p style={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--bd-ink-mute)', margin: '0.1rem 0 0' }}>{s.scientific_name}</p>
                </div>
                {RARITY_LABELS[s.rarity_tier] && (
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: '999px', background: 'var(--bd-bg)', border: '1px solid var(--bd-rule)', color: 'var(--bd-ink-mute)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {RARITY_LABELS[s.rarity_tier]}
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--bd-ink-mute)', margin: '0.4rem 0 0' }}>
                {formatDate(s.identified_at)}
                {s.place_name && <span> · {s.place_name}</span>}
              </p>
              {s.weather_description && (
                <p style={{ fontSize: '0.75rem', color: 'var(--bd-ink-mute)', margin: '0.2rem 0 0' }}>
                  {s.weather_temp_c != null ? `${Math.round(s.weather_temp_c)}°C · ` : ''}{s.weather_description}
                </p>
              )}
              {s.notes && (
                <p style={{ fontSize: '0.78rem', color: 'var(--bd-ink-soft)', margin: '0.2rem 0 0', fontStyle: 'italic' }}>{s.notes}</p>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.25rem', padding: '0.75rem 0.75rem 0.75rem 0', flexShrink: 0 }}>
              <button
                onClick={() => setEditTarget(s)}
                style={{ padding: '0.3rem 0.6rem', borderRadius: '0.5rem', border: '1px solid var(--bd-rule)', background: 'var(--bd-card)', color: 'var(--bd-ink-mute)', fontSize: '0.75rem', cursor: 'pointer' }}
              >
                Edit
              </button>
              <button
                onClick={() => setConfirmDelete(s.id)}
                style={{ padding: '0.3rem 0.6rem', borderRadius: '0.5rem', border: '1px solid transparent', background: 'transparent', color: 'var(--bd-terra, #c0392b)', fontSize: '0.75rem', cursor: 'pointer' }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit modal */}
      {editTarget && (
        <EditModal
          sighting={editTarget}
          pastPlaceNames={pastPlaceNames}
          onSave={handleSaved}
          onClose={() => setEditTarget(null)}
        />
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'var(--bd-card)', borderRadius: '1.5rem', padding: '1.5rem', width: '100%', maxWidth: 360, boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
            <h3 style={{ margin: '0 0 0.5rem', fontWeight: 700, color: 'var(--bd-ink)' }}>Delete sighting?</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--bd-ink-mute)', margin: '0 0 1.25rem' }}>This cannot be undone.</p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={deleting}
                style={{ flex: 1, padding: '0.5rem', borderRadius: '0.75rem', background: 'var(--bd-terra, #c0392b)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', opacity: deleting ? 0.6 : 1 }}
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{ flex: 1, padding: '0.5rem', borderRadius: '0.75rem', border: '1px solid var(--bd-rule)', background: 'var(--bd-card)', color: 'var(--bd-ink)', cursor: 'pointer', fontSize: '0.875rem' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
