import { useEffect, useState } from 'react'
import api from '../api/client'

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

const CATEGORY_META = {
  explorer:     { label: 'Explorer',              description: 'Awarded for logging sightings' },
  life_list:    { label: 'Life List',             description: 'Unique species identified' },
  kingdom:      { label: 'Kingdom Expert',        description: 'Master individual kingdoms' },
  rarity:       { label: 'Rarity Hunter',         description: 'Spot uncommon and rare species' },
  conservation: { label: 'Conservation Champion', description: 'Identify at-risk species' },
}

const CATEGORY_ORDER = ['explorer', 'life_list', 'kingdom', 'rarity', 'conservation']

// Inline SVG icons for each category (monochrome)
function CategoryIcon({ category, size = 18, color = 'currentColor' }) {
  const icons = {
    explorer: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
      </svg>
    ),
    life_list: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
    kingdom: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
      </svg>
    ),
    rarity: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
      </svg>
    ),
    conservation: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
        <polyline points="9 12 11 14 15 10"/>
      </svg>
    ),
  }
  return icons[category] || null
}

function BadgeCard({ item }) {
  const earned = item.earned

  return (
    <div style={{
      background: 'var(--bd-card)',
      border: `1px solid ${earned ? 'var(--bd-rule)' : 'var(--bd-rule-soft)'}`,
      borderRadius: '1.25rem',
      padding: '1rem 1.1rem',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.875rem',
      opacity: earned ? 1 : 0.55,
      transition: 'opacity 0.2s',
    }}>
      {/* Icon tile */}
      <div style={{
        width: 44,
        height: 44,
        borderRadius: '0.75rem',
        background: earned ? 'var(--bd-moss)' : 'var(--bd-bg-soft)',
        border: earned ? 'none' : '1px solid var(--bd-rule)',
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
        color: earned ? '#fff' : 'var(--bd-ink-mute)',
      }}>
        {item.badge.icon_url ? (
          <img src={item.badge.icon_url} alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} />
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill={earned ? '#fff' : 'var(--bd-ink-mute)'}>
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
          </svg>
        )}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--bd-ink)', margin: 0 }}>
            {item.badge.name}
          </p>
          {earned && (
            <span style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              padding: '1px 7px',
              borderRadius: '999px',
              background: 'rgba(44,110,90,0.12)',
              color: 'var(--bd-moss)',
            }}>Earned</span>
          )}
        </div>
        {item.badge.description && (
          <p style={{ fontSize: '0.75rem', marginTop: '0.2rem', color: 'var(--bd-ink-mute)', lineHeight: 1.4 }}>
            {item.badge.description}
          </p>
        )}
        {earned && item.earned_at && (
          <p style={{ fontSize: '0.7rem', marginTop: '0.35rem', color: 'var(--bd-ink-soft)' }}>
            {formatDate(item.earned_at)}
          </p>
        )}
      </div>
    </div>
  )
}

function CategorySection({ category, items }) {
  const meta = CATEGORY_META[category] || { label: category, description: '' }
  const earnedCount = items.filter(i => i.earned).length
  const total = items.length

  return (
    <div style={{ marginBottom: '2rem' }}>
      {/* Category header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.875rem' }}>
        <div style={{
          width: 32, height: 32, borderRadius: '0.625rem',
          background: 'var(--bd-bg-soft)',
          border: '1px solid var(--bd-rule)',
          display: 'grid', placeItems: 'center',
          color: 'var(--bd-ink-mute)',
          flexShrink: 0,
        }}>
          <CategoryIcon category={category} size={16} color="var(--bd-ink-mute)" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--bd-ink)', margin: 0 }}>
              {meta.label}
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--bd-ink-mute)' }}>
              {earnedCount} / {total}
            </span>
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--bd-ink-soft)', margin: 0 }}>{meta.description}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, borderRadius: 999, background: 'var(--bd-rule-soft)', marginBottom: '0.875rem', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          borderRadius: 999,
          background: 'var(--bd-moss)',
          width: `${total > 0 ? (earnedCount / total) * 100 : 0}%`,
          transition: 'width 0.4s ease',
        }} />
      </div>

      {/* Badge cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.625rem' }}>
        {items.map((item) => <BadgeCard key={item.badge.id} item={item} />)}
      </div>
    </div>
  )
}

export default function Badges() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/badges/me/status')
      .then(({ data }) => setItems(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const earnedTotal = items.filter(i => i.earned).length
  const total = items.length

  // Group by category, respecting CATEGORY_ORDER
  const grouped = {}
  for (const item of items) {
    const cat = item.badge.category || 'other'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(item)
  }
  const categories = [
    ...CATEGORY_ORDER.filter(c => grouped[c]),
    ...Object.keys(grouped).filter(c => !CATEGORY_ORDER.includes(c)),
  ]

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '2rem 1rem' }}>
      {/* Page header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--bd-ink)', margin: 0 }}>Badges</h1>
        <p style={{ fontSize: '0.875rem', marginTop: '0.25rem', color: 'var(--bd-ink-mute)' }}>
          {loading ? 'Loading…' : `${earnedTotal} of ${total} earned`}
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}>
          {[...Array(8)].map((_, i) => (
            <div key={i} style={{ height: 76, borderRadius: '1.25rem', background: 'var(--bd-rule-soft)' }} className="animate-pulse" />
          ))}
        </div>
      ) : total === 0 ? (
        <div style={{ background: 'var(--bd-card)', border: '1px solid var(--bd-rule)', borderRadius: '1.5rem', padding: '3rem 1.5rem', textAlign: 'center' }}>
          <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--bd-ink)' }}>No badges found</p>
          <p style={{ fontSize: '0.875rem', marginTop: '0.25rem', color: 'var(--bd-ink-mute)' }}>Log your first sighting to start earning.</p>
        </div>
      ) : (
        categories.map(cat => (
          <CategorySection key={cat} category={cat} items={grouped[cat]} />
        ))
      )}
    </div>
  )
}
