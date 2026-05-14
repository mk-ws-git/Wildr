import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'

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
      <div className="auth-page">
        <h1>Reset your password</h1>
        <p>Use the link below to set a new password.</p>
        <Link to={`/reset-password?token=${resetToken}`} className="button-link">
          Set new password
        </Link>
        <p style={{ marginTop: '1rem' }}>
          <Link to="/login">Back to log in</Link>
        </p>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <h1>Forgot password</h1>
      <p>Enter your email and we&apos;ll generate a reset link.</p>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        {error && <p className="auth-error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Sending…' : 'Send reset link'}
        </button>
      </form>
      <p><Link to="/login">Back to log in</Link></p>
    </div>
  )
}
