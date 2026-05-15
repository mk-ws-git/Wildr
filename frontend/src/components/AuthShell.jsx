import { Link } from 'react-router-dom'

// Curated Unsplash photo IDs — work as direct CDN img src, no API key needed
const PANEL_PHOTOS = [
  'photo-1474511320723-9a56873867b5', // Red fox
  'photo-1466921583968-f07aa80c526e', // Misty forest dawn
  'photo-1452570053594-1b985d6ea890', // Deer in woodland
  'photo-1516934024742-b461fba47600', // Wildflower meadow
  'photo-1497206365907-f5e630693df0', // Kingfisher
  'photo-1542276834-cf249e85b2aa', // Hedgehog
  'photo-1518020382113-a7e8fc38eac9', // Pine forest fog
]

function panelPhoto() {
  const seed = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) // changes daily
  const id = PANEL_PHOTOS[seed % PANEL_PHOTOS.length]
  return `https://images.unsplash.com/${id}?w=900&q=80&fit=crop`
}

// Left panel shown on md+ screens
function NaturePanel() {
  const url = panelPhoto()
  return (
    <div
      style={{
        position: 'relative',
        width: '52%',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {/* Photo */}
      <img
        src={url}
        alt="Nature"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
        }}
      />
      {/* Gradient overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(160deg, rgba(7,20,13,0.55) 0%, rgba(26,64,53,0.30) 60%, rgba(7,20,13,0.70) 100%)',
        }}
      />
      {/* Text content */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '2.5rem',
          zIndex: 1,
        }}
      >
        {/* Wordmark */}
        <div
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: '1.6rem',
            fontStyle: 'italic',
            color: '#ffffff',
            letterSpacing: '-0.01em',
            textShadow: '0 1px 12px rgba(0,0,0,0.30)',
          }}
        >
          Wildr
        </div>

        {/* Tagline at bottom */}
        <div>
          <p
            style={{
              fontSize: 'clamp(1.3rem, 2.5vw, 1.8rem)',
              fontWeight: 700,
              color: '#ffffff',
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              margin: '0 0 0.75rem',
              textShadow: '0 2px 16px rgba(0,0,0,0.40)',
            }}
          >
            Your city is{' '}
            <em
              style={{
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic',
                color: '#8bba2e',
              }}
            >
              wildr
            </em>{' '}
            than you think.
          </p>
          <p
            style={{
              fontSize: '0.85rem',
              color: 'rgba(255,255,255,0.62)',
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            Discover the wildlife living right outside your door.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function AuthShell({ children }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bd-bg)' }}>
      {/* Nature panel — desktop only */}
      <div
        style={{ width: '52%', flexShrink: 0, display: 'none', position: 'relative' }}
        className="md:block"
      >
        <NaturePanel />
      </div>

      {/* Form panel */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1.5rem',
          minHeight: '100vh',
          overflowY: 'auto',
        }}
      >
        {/* Mobile wordmark */}
        <div className="md:hidden" style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <Link
            to="/"
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: '1.8rem',
              fontStyle: 'italic',
              color: 'var(--bd-ink)',
              textDecoration: 'none',
            }}
          >
            Wildr
          </Link>
        </div>

        <div style={{ width: '100%', maxWidth: '380px' }}>
          <div
            style={{
              background: 'var(--bd-card)',
              borderRadius: '1.5rem',
              padding: '2.25rem 2rem 2rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.08)',
              border: '1px solid var(--bd-rule)',
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export function AuthHeading({ title, subtitle }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h1 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--bd-ink)', margin: 0 }}>{title}</h1>
      {subtitle && (
        <p style={{ fontSize: '0.875rem', color: 'var(--bd-ink-mute)', margin: '0.35rem 0 0' }}>
          {subtitle}
        </p>
      )}
    </div>
  )
}

export function AuthField({ label, id, error, ...inputProps }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      {label && (
        <label
          htmlFor={id}
          style={{
            display: 'block',
            fontSize: '0.78rem',
            fontWeight: 600,
            color: 'var(--bd-ink-soft)',
            marginBottom: '0.3rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className="auth-input"
        {...inputProps}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          border: `1.5px solid ${error ? '#f87171' : 'var(--bd-rule)'}`,
          borderRadius: '0.75rem',
          padding: '0.7rem 0.9rem',
          fontSize: '0.9rem',
          background: 'var(--bd-bg)',
          color: 'var(--bd-ink)',
          outline: 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
      />
      {error && (
        <p style={{ fontSize: '0.78rem', color: '#dc2626', margin: '0.25rem 0 0' }}>{error}</p>
      )}
    </div>
  )
}

export function AuthTextarea({ label, id, ...props }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      {label && (
        <label
          htmlFor={id}
          style={{
            display: 'block',
            fontSize: '0.78rem',
            fontWeight: 600,
            color: 'var(--bd-ink-soft)',
            marginBottom: '0.3rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {label}
        </label>
      )}
      <textarea
        id={id}
        className="auth-input"
        rows={3}
        {...props}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          border: '1.5px solid var(--bd-rule)',
          borderRadius: '0.75rem',
          padding: '0.7rem 0.9rem',
          fontSize: '0.9rem',
          background: 'var(--bd-bg)',
          color: 'var(--bd-ink)',
          outline: 'none',
          resize: 'vertical',
          fontFamily: 'inherit',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
      />
    </div>
  )
}

export function AuthBtn({ children, loading, variant = 'primary', ...props }) {
  const base = {
    width: '100%',
    padding: '0.8rem',
    borderRadius: '0.75rem',
    fontSize: '0.9rem',
    fontWeight: 700,
    cursor: loading ? 'default' : 'pointer',
    border: 'none',
    transition: 'opacity 0.15s, transform 0.1s',
    opacity: loading ? 0.65 : 1,
    letterSpacing: '0.01em',
  }
  const variants = {
    primary: {
      background: 'var(--bd-moss)',
      color: '#fff',
      boxShadow: '0 2px 10px rgba(44,110,90,0.25)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--bd-ink-mute)',
      border: '1.5px solid var(--bd-rule)',
    },
  }
  return (
    <button
      disabled={loading}
      style={{ ...base, ...variants[variant] }}
      {...props}
    >
      {loading ? '…' : children}
    </button>
  )
}

export function AuthError({ message }) {
  if (!message) return null
  return (
    <p
      style={{
        fontSize: '0.85rem',
        color: '#b91c1c',
        background: '#fef2f2',
        border: '1px solid #fca5a5',
        borderRadius: '0.6rem',
        padding: '0.55rem 0.8rem',
        margin: '0 0 1rem',
        lineHeight: 1.4,
      }}
    >
      {message}
    </p>
  )
}

export function AuthLinks({ children }) {
  return (
    <div
      style={{
        textAlign: 'center',
        marginTop: '1.25rem',
        fontSize: '0.85rem',
        color: 'var(--bd-ink-mute)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.4rem',
      }}
    >
      {children}
    </div>
  )
}
