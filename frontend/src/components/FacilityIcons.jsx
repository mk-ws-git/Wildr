/**
 * FacilityIcons — renders a row of labeled monochrome SVG icons for location amenities.
 * Props: facilities: string[]
 */

const FACILITIES = {
  bbq: {
    label: 'BBQ',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12h16M6 12V8a6 6 0 0 1 12 0v4"/>
        <path d="M8 12v5a4 4 0 0 0 8 0v-5"/>
        <path d="M9 3.5C9 3.5 10 2 12 2s3 1.5 3 1.5"/>
        <line x1="12" y1="21" x2="10" y2="23"/>
        <line x1="12" y1="21" x2="14" y2="23"/>
      </svg>
    ),
  },
  playground: {
    label: 'Playground',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 20L12 4l8 16"/>
        <line x1="12" y1="4" x2="12" y2="14"/>
        <path d="M9 14h6"/>
        <path d="M10 14l-1 4M14 14l1 4"/>
        <circle cx="12" cy="17" r="1" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  washrooms: {
    label: 'Washrooms',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="5" r="2"/>
        <path d="M6 21V12H4l2-6h4l2 6h-2v9"/>
        <circle cx="17" cy="5" r="2"/>
        <path d="M14 21l1-5h4l1 5M14.5 12l2.5-5 2.5 5"/>
      </svg>
    ),
  },
  sports_field: {
    label: 'Sports field',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="1"/>
        <line x1="12" y1="5" x2="12" y2="19"/>
        <circle cx="12" cy="12" r="3"/>
        <path d="M2 9h3M2 15h3M19 9h3M19 15h3"/>
      </svg>
    ),
  },
  picnic: {
    label: 'Picnic',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="9" width="18" height="3" rx="1"/>
        <line x1="6" y1="12" x2="4" y2="19"/>
        <line x1="18" y1="12" x2="20" y2="19"/>
        <line x1="2" y1="15" x2="8" y2="15"/>
        <line x1="16" y1="15" x2="22" y2="15"/>
      </svg>
    ),
  },
  car_park: {
    label: 'Car park',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M9 17V7h4a3 3 0 0 1 0 6H9"/>
      </svg>
    ),
  },
  cycling: {
    label: 'Cycling',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="5" cy="16" r="3"/>
        <circle cx="19" cy="16" r="3"/>
        <path d="M5 16L9 8h5l2 4"/>
        <path d="M9 8l5 8"/>
        <circle cx="14" cy="5" r="1.5" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  dog_friendly: {
    label: 'Dog friendly',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="14" rx="5" ry="4"/>
        <circle cx="9" cy="9" r="1.2" fill="currentColor" stroke="none"/>
        <circle cx="15" cy="9" r="1.2" fill="currentColor" stroke="none"/>
        <circle cx="9" cy="12" r="1.2" fill="currentColor" stroke="none"/>
        <circle cx="15" cy="12" r="1.2" fill="currentColor" stroke="none"/>
        <path d="M7 19v2M17 19v2"/>
      </svg>
    ),
  },
  cafe: {
    label: 'Cafe',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2c0 0 .5 2 2 2s2-2 2-2"/>
        <path d="M3 8h14v7a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z"/>
        <path d="M17 9h1a3 3 0 0 1 0 6h-1"/>
      </svg>
    ),
  },
  fishing: {
    label: 'Fishing',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12c0-4 3-7 7-7 2.5 0 5 1.5 6 4-1 .5-2 .5-3 0-1-1.5-2-2-3-2-2.5 0-4 2-4 5s1.5 5 4 5c1 0 2-.5 3-2 1-.5 2-.5 3 0-1 2.5-3.5 4-6 4-4 0-7-3-7-7z"/>
        <path d="M20 5l-4 4"/>
        <path d="M20 5h-3M20 5v3"/>
      </svg>
    ),
  },
}

export default function FacilityIcons({ facilities }) {
  if (!facilities?.length) return null

  const items = facilities
    .map(f => FACILITIES[f])
    .filter(Boolean)

  if (!items.length) return null

  return (
    <div
      style={{
        background: 'var(--bd-card)',
        border: '1px solid var(--bd-rule)',
        borderRadius: '1rem',
        padding: '0.875rem 1rem',
      }}
    >
      <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--bd-ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.625rem' }}>
        Facilities
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
        {items.map(({ label, icon }) => (
          <div
            key={label}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              color: 'var(--bd-ink-soft)',
              minWidth: 44,
            }}
          >
            <span style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {icon}
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--bd-ink-mute)', textAlign: 'center', lineHeight: 1.2 }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
