import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/client'
import FlagButton from '../components/FlagButton'

const RARITY_CLS = {
  common: 'bg-gray-100 text-gray-600',
  uncommon: 'bg-emerald-100 text-emerald-700',
  rare: 'bg-blue-100 text-blue-700',
  very_rare: 'bg-violet-100 text-violet-700',
}

const RARITY_LABEL = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  very_rare: 'Very rare',
}

const CONSERVATION_CLS = {
  least_concern: 'bg-gray-100 text-gray-600',
  near_threatened: 'bg-yellow-100 text-yellow-700',
  vulnerable: 'bg-orange-100 text-orange-700',
  endangered: 'bg-red-100 text-red-700',
  critically_endangered: 'bg-red-200 text-red-800',
}

const CONSERVATION_LABEL = {
  least_concern: 'Least Concern',
  near_threatened: 'Near Threatened',
  vulnerable: 'Vulnerable',
  endangered: 'Endangered',
  critically_endangered: 'Critically Endangered',
  extinct_in_wild: 'Extinct in Wild',
  extinct: 'Extinct',
}

function IconBookmark({ filled }) {
  return filled ? (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <path d="M5 4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v17l-7-3.5L5 21V4z" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" d="M5 4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v17l-7-3.5L5 21V4z" />
    </svg>
  )
}

function IconChevron({ dir }) {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d={dir === 'left' ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'} />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  )
}

function IconPlay() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

function IconBird() {
  return (
    <svg viewBox="0 0 64 64" className="w-16 h-16 text-gray-300" fill="currentColor">
      <path d="M52 20c-1.1 0-2 .9-2 2v2c0 3.3-2.7 6-6 6H28l-5-10H10C7.8 20 6 21.8 6 24s1.8 4 4 4h3l3 6H10c-1.1 0-2 .9-2 2s.9 2 2 2h8l3 6h18c4.4 0 8-3.6 8-8v-2h3c4.4 0 8-3.6 8-8v-2c0-1.1-.9-2-2-2z" />
    </svg>
  )
}

function PhotoGallery({ photos, commonName }) {
  const [idx, setIdx] = useState(0)
  const [failed, setFailed] = useState({})

  const visiblePhotos = photos.filter((_, i) => !failed[i])

  if (visiblePhotos.length === 0) {
    return (
      <div className="w-full h-72 rounded-xl flex items-center justify-center" style={{ background: 'var(--bd-bg-soft)' }}>
        <IconBird />
      </div>
    )
  }

  const current = visiblePhotos[idx] ?? visiblePhotos[0]
  const safeIdx = Math.min(idx, visiblePhotos.length - 1)

  return (
    <div className="relative rounded-xl overflow-hidden" style={{ background: 'var(--bd-bg-soft)' }}>
      <img
        src={current}
        alt={commonName}
        className="w-full h-72 object-cover"
        onError={() => {
          const origIdx = photos.indexOf(current)
          setFailed(f => ({ ...f, [origIdx]: true }))
          if (safeIdx > 0) setIdx(safeIdx - 1)
        }}
      />
      {visiblePhotos.length > 1 && (
        <>
          <button
            onClick={() => setIdx(i => (i - 1 + visiblePhotos.length) % visiblePhotos.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/80 rounded-full shadow hover:bg-white transition-colors"
          >
            <IconChevron dir="left" />
          </button>
          <button
            onClick={() => setIdx(i => (i + 1) % visiblePhotos.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/80 rounded-full shadow hover:bg-white transition-colors"
          >
            <IconChevron dir="right" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {visiblePhotos.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === safeIdx ? 'bg-white' : 'bg-white/50'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function AudioPlayer({ urls }) {
  const [playing, setPlaying] = useState(null)

  if (!urls?.length) return null

  const toggle = (url) => {
    if (playing === url) {
      document.getElementById(`audio-${btoa(url).slice(0, 8)}`)?.pause()
      setPlaying(null)
    } else {
      if (playing) {
        const prev = document.getElementById(`audio-${btoa(playing).slice(0, 8)}`)
        if (prev) { prev.pause(); prev.currentTime = 0 }
      }
      document.getElementById(`audio-${btoa(url).slice(0, 8)}`)?.play()
      setPlaying(url)
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Audio recordings</p>
      <div className="flex flex-wrap gap-2">
        {urls.map((url, i) => {
          const id = `audio-${btoa(url).slice(0, 8)}`
          const isPlaying = playing === url
          return (
            <div key={url} className="flex items-center gap-2">
              <audio
                id={id}
                src={url}
                onEnded={() => setPlaying(null)}
                preload="none"
              />
              <button
                onClick={() => toggle(url)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  isPlaying
                    ? 'bg-green-700 text-white border-green-700'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                }`}
              >
                <IconPlay />
                Recording {i + 1}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function InfoRow({ label, value }) {
  if (!value) return null
  return (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm text-gray-700 leading-relaxed">{value}</p>
    </div>
  )
}

function SightingItem({ sighting }) {
  const date = new Date(sighting.identified_at).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-100 last:border-0">
      {sighting.photo_url ? (
        <img src={sighting.photo_url} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0 bg-gray-100" />
      ) : (
        <div className="w-12 h-12 rounded-lg bg-gray-100 shrink-0" />
      )}
      <div className="min-w-0">
        <p className="text-sm text-gray-700 line-clamp-2">{sighting.notes || 'No notes'}</p>
        <p className="text-xs text-gray-400 mt-0.5">{date}</p>
      </div>
    </div>
  )
}

export default function SpeciesDetail() {
  const { id } = useParams()
  const [species, setSpecies] = useState(null)
  const [sightings, setSightings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get(`/species/${id}`),
      api.get(`/species/${id}/sightings`),
    ])
      .then(([{ data: s }, { data: sg }]) => {
        setSpecies(s)
        setSightings(sg)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  const toggleSave = async () => {
    if (!species) return
    const prev = species.saved
    setSpecies(s => ({ ...s, saved: !prev }))
    try {
      if (prev) await api.delete(`/species/${id}/save`)
      else await api.post(`/species/${id}/save`)
    } catch {
      setSpecies(s => ({ ...s, saved: prev }))
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4 animate-pulse">
        <div className="h-72 bg-gray-100 rounded-xl" />
        <div className="h-6 bg-gray-100 rounded w-1/2" />
        <div className="h-4 bg-gray-100 rounded w-1/3" />
      </div>
    )
  }

  if (!species) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">Species not found.</p>
        <Link to="/species" className="text-sm text-green-700 mt-2 inline-block">Back to species</Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Back */}
      <Link to="/species" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Species
      </Link>

      {/* Photo gallery */}
      <PhotoGallery photos={species.photos} commonName={species.common_name} />

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{species.common_name}</h1>
          <p className="text-sm text-gray-400 italic mt-0.5">{species.scientific_name}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {species.rarity_tier && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${RARITY_CLS[species.rarity_tier] ?? 'bg-gray-100 text-gray-600'}`}>
                {RARITY_LABEL[species.rarity_tier] ?? species.rarity_tier}
              </span>
            )}
            {species.conservation_status && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CONSERVATION_CLS[species.conservation_status] ?? 'bg-gray-100 text-gray-600'}`}>
                {CONSERVATION_LABEL[species.conservation_status] ?? species.conservation_status}
              </span>
            )}
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">
              {species.kingdom}
            </span>
          </div>
        </div>
        <button
          onClick={toggleSave}
          className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
            species.saved
              ? 'bg-green-700 text-white border-green-700'
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
          }`}
        >
          <IconBookmark filled={species.saved} />
          {species.saved ? 'Saved' : 'Save'}
        </button>
      </div>

      {/* "You found this" banner */}
      {species.seen && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-green-800 text-sm font-medium">
          <IconCheck />
          You've found this species
        </div>
      )}

      {/* Audio */}
      {species.audio_urls?.length > 0 && (
        <AudioPlayer urls={species.audio_urls} />
      )}

      {/* Info */}
      <div className="bg-white rounded-xl border border-gray-200 px-4 divide-y divide-gray-100">
        <InfoRow label="Fun fact" value={species.fun_fact} />
        <InfoRow label="Habitat" value={species.habitat} />
        <InfoRow label="Behaviour" value={species.behaviour} />
        <InfoRow label="Seasonal note" value={species.seasonal_note} />
      </div>

      {/* Recent sightings */}
      {sightings.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Recent sightings ({sightings.length})
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 px-4">
            {sightings.map(s => <SightingItem key={s.id} sighting={s} />)}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '0.5rem' }}>
        <FlagButton contentType="species" contentId={Number(id)} />
      </div>
    </div>
  )
}
