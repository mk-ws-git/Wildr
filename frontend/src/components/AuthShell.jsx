import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api'

function usePagePhoto(page) {
  const [photo, setPhoto] = useState(null)
  useEffect(() => {
    fetch(`${API_URL}/photos/auth-panel?page=${encodeURIComponent(page)}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.photo_url) setPhoto(d) })
      .catch(() => {})
  }, [page])
  return photo
}

function NaturePanel({ photo }) {
  return (
    <div
      style={{
        position: 'relative',
        width: '52%',
        flexShrink: 0,
        overflow: 'hidden',
        background: '#0f2a1c',
      }}
    >
      {photo?.photo_url && (
        <img
          src={photo.photo_url}
          alt={photo.description || 'Nature'}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
          }}
        />
      )}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(160deg, rgba(7,20,13,0.55) 0%, rgba(26,64,53,0.30) 60%, rgba(7,20,13,0.70) 100%)',
        }}
      />
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
            <em style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#8bba2e' }}>
              wildr
            </em>{' '}
            than you think.
          </p>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.62)', margin: '0 0 0.875rem', lineHeight: 1.5 }}>
            Discover the wildlife living right outside your door.
          </p>
          {photo?.photographer && (
            <p style={{ margin: 0, fontSize: '0.7rem', color: 'rgba(255,255,255,0.40)', lineHeight: 1.4 }}>
              Photo by{' '}
              <a href={photo.photographer_url} target="_blank" rel="noopener noreferrer"
                style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'underline' }}>
                {photo.photographer}
              </a>{' '}
              on{' '}
              <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer"
                style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'underline' }}>
                Unsplash
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AuthShell({ children, page = 'default' }) {
  const photo = usePagePhoto(page)

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bd-bg)', position: 'relative' }}>

      {/* Mobile: full-screen photo background */}
      {photo?.photo_url && (
        <div
          className="md:hidden"
          style={{ position: 'fixed', inset: 0, zIndex: 0 }}
        >
          <img
            src={photo.photo_url}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(7,20,13,0.72)' }} />
        </div>
      )}

      {/* Desktop: nature panel */}
      <div
        style={{ width: '52%', flexShrink: 0, display: 'none', position: 'relative' }}
        className="md:block"
      >
        <NaturePanel photo={photo} />
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
          position: 'relative',
          zIndex: 1,
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
              color: photo ? '#ffffff' : 'var(--bd-ink)',
              textDecoration: 'none',
              textShadow: photo ? '0 1px 8px rgba(0,0,0,0.4)' : 'none',
            }}
          >
            Wildr
          </Link>
        </div>

        <div style={{ width: '100%', maxWidth: '380px' }}>
          <div
            style={{
              background: photo ? 'rgba(15,26,20,0.82)' : 'var(--bd-card)',
              borderRadius: '1.5rem',
              padding: '2.25rem 2rem 2rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.18)',
              border: photo ? '1px solid rgba(255,255,255,0.10)' : '1px solid var(--bd-rule)',
              backdropFilter: photo ? 'blur(12px)' : 'none',
            }}
          >
            {children}
          </div>
          {/* Mobile Unsplash attribution */}
          {photo?.photographer && (
            <p className="md:hidden" style={{ margin: '0.75rem 0 0', fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
              Photo by{' '}
              <a href={photo.photographer_url} target="_blank" rel="noopener noreferrer"
                style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'underline' }}>
                {photo.photographer}
              </a>{' '}
              on Unsplash
            </p>
          )}
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
    primary: { background: 'var(--bd-moss)', color: '#fff', boxShadow: '0 2px 10px rgba(44,110,90,0.25)' },
    ghost: { background: 'transparent', color: 'var(--bd-ink-mute)', border: '1.5px solid var(--bd-rule)' },
  }
  return (
    <button disabled={loading} style={{ ...base, ...variants[variant] }} {...props}>
      {loading ? '…' : children}
    </button>
  )
}

export function AuthLinkBtn({ to, children, variant = 'ghost' }) {
  const base = {
    display: 'block',
    width: '100%',
    padding: '0.8rem',
    borderRadius: '0.75rem',
    fontSize: '0.9rem',
    fontWeight: 700,
    textAlign: 'center',
    textDecoration: 'none',
    letterSpacing: '0.01em',
    transition: 'opacity 0.15s',
    boxSizing: 'border-box',
  }
  const variants = {
    primary: { background: 'var(--bd-moss)', color: '#fff', boxShadow: '0 2px 10px rgba(44,110,90,0.25)' },
    ghost: { background: 'transparent', color: 'var(--bd-ink-mute)', border: '1.5px solid var(--bd-rule)' },
  }
  return <Link to={to} style={{ ...base, ...variants[variant] }}>{children}</Link>
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
