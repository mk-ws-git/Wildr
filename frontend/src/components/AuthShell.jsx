import { Link } from 'react-router-dom'

function BgLeaves() {
  return (
    <>
      <svg
        viewBox="0 0 300 300"
        fill="none"
        style={{ position: 'fixed', top: -60, right: -60, width: 340, height: 340, opacity: 0.07, pointerEvents: 'none' }}
      >
        <path d="M150 10 Q290 150 150 290 Q10 150 150 10Z" fill="var(--bd-moss)" />
        <path d="M220 60 Q290 150 220 240 Q150 150 220 60Z" fill="var(--bd-moss)" />
      </svg>
      <svg
        viewBox="0 0 200 200"
        fill="none"
        style={{ position: 'fixed', bottom: -30, left: -30, width: 220, height: 220, opacity: 0.05, pointerEvents: 'none' }}
      >
        <path d="M100 5 Q195 100 100 195 Q5 100 100 5Z" fill="var(--bd-moss)" />
      </svg>
    </>
  )
}

export default function AuthShell({ children }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bd-bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <BgLeaves />

      <div style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}>
        {/* Wordmark */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <Link
            to="/"
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: '2rem',
              fontStyle: 'italic',
              letterSpacing: '-0.02em',
              color: 'var(--bd-ink)',
              textDecoration: 'none',
            }}
          >
            Wildr
          </Link>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--bd-card)',
          borderRadius: '1.5rem',
          padding: '2rem 2rem 1.75rem',
          boxShadow: '0 2px 24px rgba(31,38,26,0.09), 0 1px 3px rgba(31,38,26,0.06)',
        }}>
          {children}
        </div>
      </div>
    </div>
  )
}

export function AuthHeading({ title, subtitle }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--bd-ink)', margin: 0 }}>{title}</h1>
      {subtitle && <p style={{ fontSize: '0.875rem', color: 'var(--bd-ink-mute)', margin: '0.3rem 0 0' }}>{subtitle}</p>}
    </div>
  )
}

export function AuthField({ label, id, error, ...inputProps }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      {label && (
        <label htmlFor={id} style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--bd-ink-soft)', marginBottom: '0.3rem' }}>
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
          borderRadius: '0.625rem',
          padding: '0.625rem 0.875rem',
          fontSize: '0.9rem',
          background: 'var(--bd-bg)',
          color: 'var(--bd-ink)',
          outline: 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
      />
    </div>
  )
}

export function AuthTextarea({ label, id, ...props }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      {label && (
        <label htmlFor={id} style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--bd-ink-soft)', marginBottom: '0.3rem' }}>
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
          borderRadius: '0.625rem',
          padding: '0.625rem 0.875rem',
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
    padding: '0.7rem',
    borderRadius: '0.625rem',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: loading ? 'default' : 'pointer',
    border: 'none',
    transition: 'opacity 0.15s',
    opacity: loading ? 0.6 : 1,
  }
  const variants = {
    primary: { background: 'var(--bd-moss)', color: '#fff' },
    ghost: { background: 'transparent', color: 'var(--bd-ink-mute)', border: '1.5px solid var(--bd-rule)' },
  }
  return (
    <button disabled={loading} style={{ ...base, ...variants[variant] }} {...props}>
      {loading ? '…' : children}
    </button>
  )
}

export function AuthError({ message }) {
  if (!message) return null
  return (
    <p style={{
      fontSize: '0.85rem',
      color: '#b91c1c',
      background: '#fef2f2',
      border: '1px solid #fca5a5',
      borderRadius: '0.5rem',
      padding: '0.5rem 0.75rem',
      margin: '0 0 1rem',
    }}>
      {message}
    </p>
  )
}

export function AuthLinks({ children }) {
  return (
    <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--bd-ink-mute)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      {children}
    </div>
  )
}
