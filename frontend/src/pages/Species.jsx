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

const RARITY_CLS = {
  common: 'bg-gray-100 text-gray-600',
  uncommon: 'bg-emerald-100 text-emerald-700',
  rare: 'bg-blue-100 text-blue-700',
  very_rare: 'bg-violet-100 text-violet-700',
}

const CONSERVATION_CLS = {
  near_threatened: 'bg-yellow-100 text-yellow-700',
  vulnerable: 'bg-orange-100 text-orange-700',
  endangered: 'bg-red-100 text-red-700',
  critically_endangered: 'bg-red-200 text-red-800',
}

const CONSERVATION_LABEL = {
  near_threatened: 'NT',
  vulnerable: 'VU',
  endangered: 'EN',
  critically_endangered: 'CR',
}

function IconBookmark({ filled }) {
  return filled ? (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
      <path d="M5 4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v17l-7-3.5L5 21V4z" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" d="M5 4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v17l-7-3.5L5 21V4z" />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  )
}

function IconBird() {
  return (
    <svg viewBox="0 0 64 64" className="w-10 h-10 text-gray-300" fill="currentColor">
      <path d="M52 20c-1.1 0-2 .9-2 2v2c0 3.3-2.7 6-6 6H28l-5-10H10C7.8 20 6 21.8 6 24s1.8 4 4 4h3l3 6H10c-1.1 0-2 .9-2 2s.9 2 2 2h8l3 6h18c4.4 0 8-3.6 8-8v-2h3c4.4 0 8-3.6 8-8v-2c0-1.1-.9-2-2-2z" />
    </svg>
  )
}

function SpeciesCard({ species, onToggleSave }) {
  const [imgFailed, setImgFailed] = useState(false)
  const photo = species.photos?.[0]
  const conservationCls = species.conservation_status && CONSERVATION_CLS[species.conservation_status]

  return (
    <Link
      to={`/species/${species.id}`}
      className="group relative flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200"
    >
      {/* Photo */}
      <div className="relative h-44 bg-gray-100 flex items-center justify-center shrink-0">
        {photo && !imgFailed ? (
          <img
            src={photo}
            alt={species.common_name}
            className="w-full h-full object-cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <IconBird />
        )}

        {/* Seen badge */}
        {species.seen && (
          <span className="absolute top-2 left-2 flex items-center gap-1 bg-white/90 backdrop-blur-sm text-green-700 text-xs font-medium px-2 py-0.5 rounded-full shadow-sm">
            <IconCheck /> Seen
          </span>
        )}

        {/* Watchlist button */}
        <button
          onClick={e => { e.preventDefault(); onToggleSave(species) }}
          className={`absolute top-2 right-2 p-1.5 rounded-full bg-white/90 backdrop-blur-sm shadow-sm transition-colors ${
            species.saved ? 'text-green-700' : 'text-gray-400 hover:text-gray-700'
          }`}
          aria-label={species.saved ? 'Remove from watchlist' : 'Add to watchlist'}
        >
          <IconBookmark filled={species.saved} />
        </button>
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-1.5 grow">
        <div>
          <p className="font-semibold text-gray-900 text-sm leading-snug">{species.common_name}</p>
          <p className="text-xs text-gray-400 italic">{species.scientific_name}</p>
        </div>
        <div className="flex flex-wrap gap-1 mt-auto">
          {species.rarity_tier && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${RARITY_CLS[species.rarity_tier] ?? 'bg-gray-100 text-gray-600'}`}>
              {RARITIES.find(r => r.value === species.rarity_tier)?.label ?? species.rarity_tier}
            </span>
          )}
          {conservationCls && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${conservationCls}`}>
              {CONSERVATION_LABEL[species.conservation_status]}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="h-44 bg-gray-100" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-gray-100 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-5 bg-gray-100 rounded-full w-16 mt-2" />
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

  // Debounce search
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

  const filtered = kingdom === 'watchlist'
    ? species.filter(s => s.saved)
    : species

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Species</h1>
        {!loading && (
          <p className="text-sm text-gray-500 mt-0.5">
            {filtered.length} species
            {(search || kingdom || rarity || conservation) ? ' matching filters' : ''}
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <input
          type="search"
          placeholder="Search by name..."
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-52 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
        />
        <select
          value={kingdom}
          onChange={e => setKingdom(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
        >
          {KINGDOMS.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
        </select>
        <select
          value={rarity}
          onChange={e => setRarity(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
        >
          {RARITIES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        <select
          value={conservation}
          onChange={e => setConservation(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
        >
          {CONSERVATION_FILTERS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        {(kingdom || rarity || conservation || search) && (
          <button
            onClick={() => { setKingdom(''); setRarity(''); setConservation(''); setSearchInput(''); setSearch('') }}
            className="text-sm text-gray-500 hover:text-gray-800 px-2"
          >
            Clear
          </button>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-500 py-12 text-center">No species found.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(s => (
            <SpeciesCard key={s.id} species={s} onToggleSave={toggleSave} />
          ))}
        </div>
      )}
    </div>
  )
}
