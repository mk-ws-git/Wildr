import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import PineTrees from '../components/PineTrees'

const TABS = ['species', 'people']

function Avatar({ user, size = 36 }) {
  const initials = user.username.split(' ').map(p => p[0]?.toUpperCase() || '').slice(0, 2).join('')
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'var(--bd-rule)', color: 'var(--bd-ink)',
      display: 'grid', placeItems: 'center',
      fontSize: size * 0.35, fontWeight: 600, flexShrink: 0, overflow: 'hidden',
    }}>
      {user.avatar_url
        ? <img src={user.avatar_url} alt={user.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : initials}
    </div>
  )
}

const RARITY_COLOR = {
  common:    { bg: 'rgba(44,110,90,0.08)', text: 'var(--bd-moss)' },
  uncommon:  { bg: 'rgba(100,120,50,0.1)', text: '#5a7830' },
  rare:      { bg: 'rgba(180,100,20,0.1)', text: '#b46414' },
  very_rare: { bg: 'rgba(180,30,30,0.1)', text: '#b01c1c' },
}

function RarityChip({ rarity }) {
  if (!rarity) return null
  const c = RARITY_COLOR[rarity] || {}
  const label = rarity.replace('_', ' ')
  return (
    <span style={{
      fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
      padding: '2px 7px', borderRadius: '999px',
      background: c.bg || 'var(--bd-bg-soft)', color: c.text || 'var(--bd-ink-mute)',
    }}>{label}</span>
  )
}

function SpeciesRow({ species }) {
  const thumb = Array.isArray(species.photos) ? species.photos[0] : null
  return (
    <Link
      to={`/species/${species.id}`}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '0.625rem 0',
        borderBottom: '1px solid var(--bd-rule-soft)',
        textDecoration: 'none',
      }}
    >
      <div style={{ width: 44, height: 44, borderRadius: '0.75rem', background: 'var(--bd-bg-soft)', flexShrink: 0, overflow: 'hidden' }}>
        {thumb && <img src={thumb} alt={species.common_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--bd-ink)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {species.common_name}
        </p>
        <p style={{ fontSize: '0.75rem', fontStyle: 'italic', color: 'var(--bd-ink-mute)', margin: '0.1rem 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {species.scientific_name}
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem', flexShrink: 0 }}>
        <RarityChip rarity={species.rarity_tier} />
        <span style={{ fontSize: '0.7rem', color: 'var(--bd-ink-soft)', textTransform: 'capitalize' }}>{species.kingdom}</span>
      </div>
    </Link>
  )
}

function PeopleRow({ user }) {
  return (
    <Link
      to={`/users/${user.id}`}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '0.625rem 0',
        borderBottom: '1px solid var(--bd-rule-soft)',
        textDecoration: 'none',
      }}
    >
      <Avatar user={user} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--bd-ink)', margin: 0 }}>{user.username}</p>
        {user.location_name && (
          <p style={{ fontSize: '0.75rem', color: 'var(--bd-ink-mute)', margin: '0.1rem 0 0' }}>{user.location_name}</p>
        )}
      </div>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--bd-ink-mute)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <path d="M9 5l7 7-7 7"/>
      </svg>
    </Link>
  )
}

function EmptyState({ query, tab }) {
  return (
    <div style={{ padding: '2.5rem 0', textAlign: 'center' }}>
      <p style={{ fontSize: '0.875rem', color: 'var(--bd-ink-mute)' }}>
        No {tab === 'species' ? 'species' : 'people'} matching <strong>&ldquo;{query}&rdquo;</strong>
      </p>
    </div>
  )
}

export default function Search() {
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState('species')
  const [speciesResults, setSpeciesResults] = useState([])
  const [peopleResults, setPeopleResults] = useState([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)

  const search = useCallback(async (q) => {
    if (!q.trim()) {
      setSpeciesResults([])
      setPeopleResults([])
      return
    }
    setLoading(true)
    try {
      const [specRes, peopleRes] = await Promise.allSettled([
        api.get('/species', { params: { search: q, limit: 20 } }),
        api.get('/users/search', { params: { q } }),
      ])
      setSpeciesResults(specRes.status === 'fulfilled' ? specRes.value.data : [])
      setPeopleResults(peopleRes.status === 'fulfilled' ? peopleRes.value.data : [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => search(query), 280)
    return () => clearTimeout(t)
  }, [query, search])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const hasQuery = query.trim().length > 0
  const results = tab === 'species' ? speciesResults : peopleResults

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '2rem 1.25rem' }}>
      {/* Search input */}
      <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
        <div style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--bd-ink-mute)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
        </div>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search species or people…"
          style={{
            width: '100%', boxSizing: 'border-box',
            paddingLeft: '2.5rem', paddingRight: query ? '2.5rem' : '1rem',
            paddingTop: '0.7rem', paddingBottom: '0.7rem',
            borderRadius: '0.875rem',
            border: '1px solid var(--bd-rule)',
            background: 'var(--bd-card)',
            color: 'var(--bd-ink)',
            fontSize: '0.9rem',
            outline: 'none',
          }}
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--bd-ink-mute)', padding: 0, display: 'grid', placeItems: 'center' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.25rem', background: 'var(--bd-bg-soft)', borderRadius: '0.75rem', padding: '0.25rem' }}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              padding: '0.45rem 0',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.82rem',
              transition: 'all 0.15s',
              background: tab === t ? 'var(--bd-card)' : 'transparent',
              color: tab === t ? 'var(--bd-ink)' : 'var(--bd-ink-mute)',
              boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            {t === 'species' ? 'Species' : 'People'}
            {hasQuery && !loading && (
              <span style={{ marginLeft: '0.35rem', fontSize: '0.7rem', color: tab === t ? 'var(--bd-ink-mute)' : 'var(--bd-ink-soft)' }}>
                ({t === 'species' ? speciesResults.length : peopleResults.length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Results */}
      {!hasQuery ? (
        <div style={{ padding: '3rem 0', textAlign: 'center' }}>
          <div style={{ color: 'var(--bd-rule)', marginBottom: '1rem' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--bd-ink-mute)', fontWeight: 500 }}>Search for wildlife species or other naturalists</p>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem', flexWrap: 'wrap' }}>
            {['Robin', 'Oak', 'Badger', 'Hedgehog', 'Bluebell'].map(s => (
              <button
                key={s}
                onClick={() => setQuery(s)}
                style={{ padding: '0.35rem 0.875rem', borderRadius: '999px', border: '1px solid var(--bd-rule)', background: 'var(--bd-card)', color: 'var(--bd-ink-mute)', fontSize: '0.8rem', cursor: 'pointer' }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
          <PineTrees size="sm" label="Searching…" />
        </div>
      ) : results.length === 0 ? (
        <EmptyState query={query} tab={tab} />
      ) : (
        <div>
          {tab === 'species'
            ? speciesResults.map(s => <SpeciesRow key={s.id} species={s} />)
            : peopleResults.map(u => <PeopleRow key={u.id} user={u} />)
          }
        </div>
      )}
    </div>
  )
}
