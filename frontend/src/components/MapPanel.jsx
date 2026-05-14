const IconLeaf = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
  </svg>
)

const IconDroplet = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
  </svg>
)

const IconWaves = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
    <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
    <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
  </svg>
)

const IconCamera = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
    <circle cx="12" cy="13" r="3"/>
  </svg>
)

const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.5 12.75l6 6 9-13.5"/>
  </svg>
)

const IconBookmark = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v17l-7-3.5L5 21V4z"/>
  </svg>
)

export default function MapPanel({ selected, summary, loading, onClose, onSave, onVisit, saved, visited, saveLoading, visitLoading }) {
  if (!selected) return null

  const isWater = selected.kind === 'water'

  const TypeIcon = isWater
    ? selected.is_swimming_spot ? IconWaves : IconDroplet
    : IconLeaf

  const typeLabel = isWater
    ? selected.is_swimming_spot ? 'Swimming spot' : (selected.water_subtype || selected.type || 'Water')
    : selected.type || 'Greenspace'

  return (
    <div
      className="absolute top-0 right-0 h-full w-80 z-10 flex flex-col overflow-hidden"
      style={{ backgroundColor: 'var(--bd-bg)', borderLeft: '1px solid var(--bd-rule)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-5 pb-4" style={{ borderBottom: '1px solid var(--bd-rule)' }}>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-base leading-tight truncate" style={{ color: 'var(--bd-ink)' }}>
            {selected.name || 'Unnamed'}
          </h2>
          <span
            className="inline-flex items-center gap-1 mt-1.5 text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ backgroundColor: 'var(--bd-rule-soft)', color: 'var(--bd-ink-soft)' }}
          >
            <TypeIcon />
            {typeLabel}
          </span>
        </div>
        <button
          onClick={onClose}
          className="ml-3 flex-shrink-0 rounded-full p-1.5 transition-colors"
          style={{ color: 'var(--bd-ink-mute)' }}
        >
          <IconClose />
        </button>
      </div>

      {/* Action buttons */}
      <div className="px-4 py-4 space-y-2" style={{ borderBottom: '1px solid var(--bd-rule)' }}>
        {/* Mark as Visited */}
        <button
          type="button"
          onClick={onVisit}
          disabled={visitLoading || visited}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-semibold transition-colors disabled:opacity-60"
          style={visited
            ? { backgroundColor: 'rgba(90,110,74,0.12)', color: 'var(--bd-moss-deep)' }
            : { backgroundColor: 'var(--bd-moss)', color: '#fff' }
          }
        >
          <IconCheck />
          {visitLoading ? 'Saving…' : visited ? 'Visited' : 'Mark as Visited'}
        </button>

        {/* Want to Visit */}
        <button
          type="button"
          onClick={onSave}
          disabled={saveLoading || saved}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-semibold transition-colors disabled:opacity-60"
          style={saved
            ? { backgroundColor: 'var(--bd-rule-soft)', color: 'var(--bd-ink-soft)', border: '1px solid var(--bd-rule)' }
            : { backgroundColor: 'white', color: 'var(--bd-ink)', border: '1px solid var(--bd-rule)' }
          }
        >
          <IconBookmark />
          {saveLoading ? 'Saving…' : saved ? (visited ? 'Saved' : 'Want to Visit') : 'Want to Visit'}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-3 rounded-full w-full" style={{ backgroundColor: 'var(--bd-rule-soft)' }} />
            <div className="h-3 rounded-full w-5/6" style={{ backgroundColor: 'var(--bd-rule-soft)' }} />
            <div className="h-3 rounded-full w-4/6" style={{ backgroundColor: 'var(--bd-rule-soft)' }} />
          </div>
        ) : summary ? (
          <>
            {summary.summary && (
              <div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--bd-ink)' }}>{summary.summary}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--bd-ink-mute)' }}>
                  via {summary.summary_source === 'wikipedia' ? 'Wikipedia' : 'AI summary'}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-2xl p-3 text-center" style={{ backgroundColor: 'var(--bd-card)', border: '1px solid var(--bd-rule)' }}>
                <div className="text-xl font-bold" style={{ color: 'var(--bd-ink)' }}>{summary.species_count}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--bd-ink-mute)' }}>species spotted</div>
              </div>
              {summary.area_sqm && (
                <div className="rounded-2xl p-3 text-center" style={{ backgroundColor: 'var(--bd-card)', border: '1px solid var(--bd-rule)' }}>
                  <div className="text-xl font-bold" style={{ color: 'var(--bd-ink)' }}>
                    {summary.area_sqm >= 10000
                      ? `${(summary.area_sqm / 10000).toFixed(1)} ha`
                      : `${Math.round(summary.area_sqm)} m²`}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--bd-ink-mute)' }}>area</div>
                </div>
              )}
            </div>

            {summary.recent_sightings?.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--bd-ink-mute)' }}>
                  Recent sightings
                </h3>
                <ul className="space-y-2">
                  {summary.recent_sightings.map((s) => (
                    <li key={s.id} className="flex items-center gap-3 rounded-2xl p-2.5" style={{ backgroundColor: 'var(--bd-card)', border: '1px solid var(--bd-rule)' }}>
                      {s.photo_url ? (
                        <img src={s.photo_url} alt={s.common_name} className="w-9 h-9 rounded-xl object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--bd-rule-soft)', color: 'var(--bd-ink-mute)' }}>
                          <IconCamera />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--bd-ink)' }}>{s.common_name}</p>
                        <p className="text-xs" style={{ color: 'var(--bd-ink-mute)' }}>
                          {new Date(s.identified_at).toLocaleDateString()}
                        </p>
                      </div>
                      {s.rarity_tier && s.rarity_tier !== 'common' && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 bg-amber-100 text-amber-700">
                          {s.rarity_tier.replace('_', ' ')}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {summary.recent_sightings?.length === 0 && (
              <p className="text-sm italic" style={{ color: 'var(--bd-ink-mute)' }}>No sightings recorded here yet.</p>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}
