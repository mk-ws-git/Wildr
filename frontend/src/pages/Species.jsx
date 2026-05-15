import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'

const KINGDOMS = [
  { value: '', label: 'All kingdoms' },
  { value: 'bird', label: 'Birds' },
  { value: 'plant', label: 'Plants' },
  { value: 'fungi', label: 'Fungi' },
  { value: 'insect', label: 'Insects' },
  { value: 'mammal', label: 'Mammals' },
  { value: 'reptile', label: 'Reptiles' },
  { value: 'amphibian', label: 'Amphibians' },
  { value: 'fish', label: 'Fish' },
]

const RARITIES = [
  { value: '', label: 'Any rarity' },
  { value: 'common', label: 'Common' },
  { value: 'uncommon', label: 'Uncommon' },
  { value: 'rare', label: 'Rare' },
  { value: 'very_rare', label: 'Very rare' },
]

const CONSERVATION_FILTERS = [
  { value: '', label: 'Any status' },
  { value: 'least_concern', label: 'Least concern' },
  { value: 'near_threatened', label: 'Near threatened' },
  { value: 'vulnerable', label: 'Vulnerable' },
  { value: 'endangered', label: 'Endangered' },
  { value: 'critically_endangered', label: 'Critically endangered' },
]

const RARITY_STYLE = {
  common:    { background: '#e8f5e2', color: '#2d6a14' },
  uncommon:  { background: '#d4ebe4', color: '#1a5c45' },
  rare:      { background: '#dce8f8', color: '#1a3d7a' },
  very_rare: { background: '#ede0f8', color: '#5a1d8a' },
}

const CONSERVATION_LABEL = {
  near_threatened:       'NT',
  vulnerable:            'VU',
  endangered:            'EN',
  critically_endangered: 'CR',
}

const CONSERVATION_STYLE = {
  near_threatened:       { background: '#fef9c3', color: '#854d0e' },
  vulnerable:            { background: '#ffedd5', color: '#9a3412' },
  endangered:            { background: '#fee2e2', color: '#991b1b' },
  critically_endangered: { background: '#fecaca', color: '#7f1d1d' },
}

const filterInput = {
  border: '1px solid var(--bd-rule)',
  borderRadius: '0.5rem',
  padding: '0.375rem 0.75rem',
  fontSize: '0.875rem',
  background: 'var(--bd-bg)',
  color: 'var(--bd-ink)',
  outline: 'none',
}

function IconBird() {
  return (
    <svg viewBox="0 0 64 64" width="40" height="40" fill="currentColor" style={{ color: 'var(--bd-rule)' }}>
      <path d="M52 20c-1.1 0-2 .9-2 2v2c0 3.3-2.7 6-6 6H28l-5-10H10C7.8 20 6 21.8 6 24s1.8 4 4 4h3l3 6H10c-1.1 0-2 .9-2 2s.9 2 2 2h8l3 6h18c4.4 0 8-3.6 8-8v-2h3c4.4 0 8-3.6 8-8v-2c0-1.1-.9-2-2-2z" />
    </svg>
  )
}

function SpeciesCard({ species, onToggleSave }) {
  const [imgFailed, setImgFailed] = useState(false)
  const photo = species.photos?.[0]
  const rarityStyle = RARITY_STYLE[species.rarity_tier]
  const conservationStyle = species.conservation_status && CONSERVATION_STYLE[species.conservation_status]
  const conservationLabel = CONSERVATION_LABEL[species.conservation_status]

  return (
    <Link
      to={`/species/${species.id}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bd-card)',
        border: '1px solid var(--bd-rule)',
        borderRadius: '1rem',
        overflow: 'hidden',
        textDecoration: 'none',
        color: 'inherit',
        position: 'relative',
      }}
    >
      <div style={{ height: 176, background: 'var(--bd-bg-soft, #f4f4f0)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {photo && !imgFailed ? (
          <img src={photo} alt={species.common_name} onError={() => setImgFailed(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : <IconBird />}

        {species.seen && (
          <span style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(255,255,255,0.92)', color: '#2d6a14', fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: 999, display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
            Seen
          </span>
        )}

        <button
          onClick={e => { e.preventDefault(); onToggleSave(species) }}
          style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(255,255,255,0.92)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: species.saved ? 'var(--bd-moss)' : 'var(--bd-ink-mute)' }}
          aria-label={species.saved ? 'Remove from watchlist' : 'Add to watchlist'}
        >
          {species.saved ? (
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M5 4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v17l-7-3.5L5 21V4z"/></svg>
          ) : (
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M5 4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v17l-7-3.5L5 21V4z"/></svg>
          )}
        </button>
      </div>

      <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: 6, flexGrow: 1 }}>
        <div>
          <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--bd-ink)', margin: 0, lineHeight: 1.3 }}>{species.common_name}</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--bd-ink-mute)', fontStyle: 'italic', margin: '2px 0 0' }}>{species.scientific_name}</p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 'auto' }}>
          {rarityStyle && (
            <span style={{ ...rarityStyle, fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: 999 }}>
              {RARITIES.find(r => r.value === species.rarity_tier)?.label ?? species.rarity_tier}
            </span>
          )}
          {conservationStyle && conservationLabel && (
            <span style={{ ...conservationStyle, fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: 999 }}>
              {conservationLabel}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

function SkeletonCard() {
  return (
    <div style={{ borderRadius: '1rem', border: '1px solid var(--bd-rule)', overflow: 'hidden' }}>
      <div style={{ height: 176, background: 'var(--bd-bg-soft, #f4f4f0)' }} />
      <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ height: 14, background: 'var(--bd-bg-soft, #f4f4f0)', borderRadius: 6, width: '75%' }} />
        <div style={{ height: 12, background: 'var(--bd-bg-soft, #f4f4f0)', borderRadius: 6, width: '50%' }} />
        <div style={{ height: 20, background: 'var(--bd-bg-soft, #f4f4f0)', borderRadius: 999, width: 60, marginTop: 4 }} />
      </div>
    </div>
  )
}

export default function Species() {
  const [species, setSpecies] = useState([])
  const [loading, setLoading] = useState(true)
  const [kingdom, setKingdom] = useState('')
  const [rarity, setRarity] = useState('')
  const [conservation, setConservation] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    setLoading(true)
    const params = {}
    if (kingdom) params.kingdom = kingdom
    if (rarity) params.rarity = rarity
    if (conservation) params.conservation_status = conservation
    if (search) params.search = search
    api.get('/species', { params })
      .then(({ data }) => setSpecies(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [kingdom, rarity, conservation, search])

  const toggleSave = async (s) => {
    const prev = s.saved
    setSpecies(list => list.map(x => x.id === s.id ? { ...x, saved: !prev } : x))
    try {
      if (prev) await api.delete(`/species/${s.id}/save`)
      else await api.post(`/species/${s.id}/save`)
    } catch {
      setSpecies(list => list.map(x => x.id === s.id ? { ...x, saved: prev } : x))
    }
  }

  const hasFilter = !!(kingdom || rarity || conservation || search)

  return (
    <div style={{ maxWidth: 1152, margin: '0 auto', padding: '1.5rem 1rem' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--bd-ink)', margin: 0 }}>Species</h1>
        {!loading && (
          <p style={{ fontSize: '0.875rem', color: 'var(--bd-ink-mute)', margin: '0.25rem 0 0' }}>
            {species.length} species{hasFilter ? ' matching filters' : ''}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <input
          type="search"
          placeholder="Search by name…"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          style={{ ...filterInput, width: 208 }}
        />
        <select value={kingdom} onChange={e => setKingdom(e.target.value)} style={filterInput}>
          {KINGDOMS.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
        </select>
        <select value={rarity} onChange={e => setRarity(e.target.value)} style={filterInput}>
          {RARITIES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        <select value={conservation} onChange={e => setConservation(e.target.value)} style={filterInput}>
          {CONSERVATION_FILTERS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        {hasFilter && (
          <button
            onClick={() => { setKingdom(''); setRarity(''); setConservation(''); setSearchInput(''); setSearch('') }}
            style={{ ...filterInput, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--bd-ink-mute)' }}
          >
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : species.length === 0 ? (
        <p style={{ fontSize: '0.875rem', color: 'var(--bd-ink-mute)', textAlign: 'center', padding: '3rem 0' }}>No species found.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
          {species.map(s => (
            <SpeciesCard key={s.id} species={s} onToggleSave={toggleSave} />
          ))}
        </div>
      )}
    </div>
  )
}
