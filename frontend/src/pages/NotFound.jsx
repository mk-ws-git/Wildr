import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '5rem 1.5rem', textAlign: 'center' }}>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--bd-rule)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1.5rem' }}>
        <circle cx="11" cy="11" r="8"/>
        <path d="M21 21l-4.35-4.35"/>
        <path d="M11 8v3M11 14h.01"/>
      </svg>
      <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--bd-ink)', margin: '0 0 0.5rem' }}>Page not found</h1>
      <p style={{ fontSize: '0.875rem', color: 'var(--bd-ink-mute)', marginBottom: '2rem' }}>
        This page doesn't exist or may have been moved.
      </p>
      <Link
        to="/"
        style={{ padding: '0.5rem 1.5rem', borderRadius: '999px', background: 'var(--bd-moss)', color: '#fff', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}
      >
        Go home
      </Link>
    </div>
  )
}
