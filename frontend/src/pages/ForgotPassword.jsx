import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import AuthShell, { AuthHeading, AuthField, AuthBtn, AuthError, AuthLinks } from '../components/AuthShell'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [resetToken, setResetToken] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { data } = await api.post('/auth/forgot-password', { email })
      if (data.reset_token) setResetToken(data.reset_token)
      else setError(data.message)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (resetToken) {
    return (
      <AuthShell page="forgot">
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--bd-bg-soft)', display: 'grid', placeItems: 'center', margin: '0 auto 1.25rem' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--bd-moss)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--bd-ink)', margin: '0 0 0.5rem' }}>Check your email</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--bd-ink-mute)', marginBottom: '1.5rem' }}>
            We&apos;ve sent a reset link to <strong style={{ color: 'var(--bd-ink)' }}>{email}</strong>.
          </p>
          <Link
            to={`/reset-password?token=${resetToken}`}
            style={{
              display: 'block',
              background: 'var(--bd-moss)',
              color: '#fff',
              borderRadius: '0.625rem',
              padding: '0.7rem',
              fontSize: '0.9rem',
              fontWeight: 600,
              textDecoration: 'none',
              textAlign: 'center',
              marginBottom: '1rem',
            }}
          >
            Set new password
          </Link>
          <Link to="/login" style={{ fontSize: '0.85rem', color: 'var(--bd-moss)', textDecoration: 'none' }}>
            Back to log in
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell page="forgot">
      <AuthHeading
        title="Reset your password"
        subtitle="Enter your email and we'll send a reset link"
      />
      <AuthError message={error} />
      <form onSubmit={handleSubmit}>
        <AuthField
          label="Email address"
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <AuthBtn loading={loading}>Send reset link</AuthBtn>
      </form>
      <AuthLinks>
        <Link to="/login" style={{ color: 'var(--bd-moss)', textDecoration: 'none' }}>
          Back to log in
        </Link>
      </AuthLinks>
    </AuthShell>
  )
}
