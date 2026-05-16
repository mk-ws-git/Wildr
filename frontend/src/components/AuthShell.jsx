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

// Full-bleed photo layout — glass card centered over landscape photo
export default function AuthShell({ children, page = 'default' }) {
  const photo = usePagePhoto(page)

  return (
    <div style={{ minHeight: '100vh', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#07140d' }}>

      {/* Photo background */}
      {photo?.photo_url && (
        <img
          src={photo.photo_url}
          alt=""
          style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 40%' }}
        />
      )}

      {/* Dark gradient overlay */}
      <div style={{
        position: 'fixed', inset: 0,
        background: 'linear-gradient(180deg, rgba(5,14,9,0.55) 0%, rgba(5,14,9,0.40) 50%, rgba(5,14,9,0.65) 100%)',
      }} />

      {/* Centered content */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '420px', padding: '2rem 1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {/* Wordmark */}
        <Link to="/" style={{ fontFamily: 'Georgia, serif', fontSize: '1.7rem', fontStyle: 'italic', color: '#ffffff', textDecoration: 'none', textShadow: '0 1px 12px rgba(0,0,0,0.5)', marginBottom: '1.75rem', display: 'block' }}>
          Wildr
        </Link>

        {/* Glass card */}
        <div style={{
          width: '100%',
          background: 'rgba(8,20,13,0.52)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          borderRadius: '1.5rem',
          padding: '2.25rem 2rem 2rem',
          border: '1px solid rgba(255,255,255,0.13)',
          boxShadow: '0 8px 48px rgba(0,0,0,0.45)',
        }}>
          {children}
        </div>

        {/* Unsplash attribution */}
        {photo?.photographer && (
          <p style={{ margin: '1rem 0 0', fontSize: '0.68rem', color: 'rgba(255,255,255,0.30)', textAlign: 'center' }}>
            Photo by{' '}
            <a href={photo.photographer_url} target="_blank" rel="noopener noreferrer"
              style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'underline' }}>
              {photo.photographer}
            </a>{' '}
            on Unsplash
          </p>
        )}
      </div>
    </div>
  )
}

export function AuthHeading({ title, subtitle }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h1 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>{title}</h1>
      {subtitle && (
        <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.58)', margin: '0.35rem 0 0' }}>
          {subtitle}
        </p>
      )}
    </div>
  )
}

export function AuthField({ label, id, error, type, ...inputProps }) {
  const [showPw, setShowPw] = useState(false)
  const isPassword = type === 'password'

  return (
    <div style={{ marginBottom: '1rem' }}>
      {label && (
        <label
          htmlFor={id}
          style={{
            display: 'block',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.65)',
            marginBottom: '0.3rem',
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
          }}
        >
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        <input
          id={id}
          className="auth-input"
          type={isPassword ? (showPw ? 'text' : 'password') : type}
          {...inputProps}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            border: `1.5px solid ${error ? 'rgba(248,113,113,0.7)' : 'rgba(255,255,255,0.18)'}`,
            borderRadius: '0.75rem',
            padding: isPassword ? '0.7rem 2.6rem 0.7rem 0.9rem' : '0.7rem 0.9rem',
            fontSize: '0.9rem',
            background: 'rgba(255,255,255,0.09)',
            color: '#ffffff',
            outline: 'none',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPw(v => !v)}
            aria-label={showPw ? 'Hide password' : 'Show password'}
            style={{
              position: 'absolute',
              right: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.5)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {showPw ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        )}
      </div>
      {error && (
        <p style={{ fontSize: '0.78rem', color: '#fca5a5', margin: '0.25rem 0 0' }}>{error}</p>
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
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.65)',
            marginBottom: '0.3rem',
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
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
          border: '1.5px solid rgba(255,255,255,0.18)',
          borderRadius: '0.75rem',
          padding: '0.7rem 0.9rem',
          fontSize: '0.9rem',
          background: 'rgba(255,255,255,0.09)',
          color: '#ffffff',
          outline: 'none',
          resize: 'vertical',
          fontFamily: 'inherit',
          transition: 'border-color 0.15s',
        }}
      />
    </div>
  )
}

export function AuthBtn({ children, loading, variant = 'primary', style: extraStyle, ...props }) {
  const base = {
    width: '100%',
    padding: '0.8rem',
    borderRadius: '0.75rem',
    fontSize: '0.9rem',
    fontWeight: 700,
    cursor: loading ? 'default' : 'pointer',
    border: 'none',
    transition: 'opacity 0.15s',
    opacity: loading ? 0.65 : 1,
    letterSpacing: '0.01em',
  }
  const variants = {
    primary: { background: '#8bba2e', color: '#0f2a1c', boxShadow: '0 2px 16px rgba(139,186,46,0.30)' },
    ghost: { background: 'rgba(255,255,255,0.10)', color: '#ffffff', border: '1.5px solid rgba(255,255,255,0.22)' },
  }
  return (
    <button disabled={loading} style={{ ...base, ...variants[variant], ...extraStyle }} {...props}>
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
    fontWeight: 600,
    textAlign: 'center',
    textDecoration: 'none',
    letterSpacing: '0.01em',
    transition: 'opacity 0.15s',
    boxSizing: 'border-box',
  }
  const variants = {
    primary: { background: '#8bba2e', color: '#0f2a1c', boxShadow: '0 2px 16px rgba(139,186,46,0.30)' },
    ghost: { background: 'rgba(255,255,255,0.10)', color: '#ffffff', border: '1.5px solid rgba(255,255,255,0.22)' },
  }
  return <Link to={to} style={{ ...base, ...variants[variant] }}>{children}</Link>
}

export function AuthError({ message }) {
  if (!message) return null
  return (
    <p
      style={{
        fontSize: '0.85rem',
        color: '#fca5a5',
        background: 'rgba(239,68,68,0.15)',
        border: '1px solid rgba(239,68,68,0.35)',
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
        color: 'rgba(255,255,255,0.55)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.4rem',
      }}
    >
      {children}
    </div>
  )
}
