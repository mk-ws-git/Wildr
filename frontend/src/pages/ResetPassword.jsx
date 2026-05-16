import { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import api from '../api/client'
import AuthShell, { AuthHeading, AuthField, AuthBtn, AuthError, AuthLinks } from '../components/AuthShell'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token, new_password: password })
      setDone(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      setError(err.response?.data?.detail || 'Reset failed. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <AuthShell page="reset">
        <AuthHeading title="Invalid link" />
        <p style={{ fontSize: '0.875rem', color: 'var(--bd-ink-mute)', marginBottom: '1rem' }}>
          This reset link is missing a token.
        </p>
        <Link to="/forgot-password" style={{ color: 'var(--bd-moss)', fontSize: '0.875rem', textDecoration: 'none' }}>
          Request a new one →
        </Link>
      </AuthShell>
    )
  }

  if (done) {
    return (
      <AuthShell page="reset">
        <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#f0faf0', display: 'grid', placeItems: 'center', margin: '0 auto 1.25rem' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--bd-moss)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--bd-ink)', margin: '0 0 0.5rem' }}>Password updated</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--bd-ink-mute)' }}>Redirecting you to log in…</p>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell page="reset">
      <AuthHeading title="Set new password" subtitle="Choose a password at least 8 characters long" />
      <AuthError message={error} />
      <form onSubmit={handleSubmit}>
        <AuthField
          label="New password"
          id="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
        <AuthField
          label="Confirm new password"
          id="confirm"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
        <AuthBtn loading={loading}>Update password</AuthBtn>
      </form>
    </AuthShell>
  )
}
