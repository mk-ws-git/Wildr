import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api/client'
import useAuthStore from '../store/authStore'
import AuthShell, { AuthHeading, AuthField, AuthBtn, AuthLinkBtn, AuthError } from '../components/AuthShell'

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const { setToken, setUser } = useAuthStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const inviteToken = searchParams.get('invite')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const payload = { ...form }
      if (inviteToken) payload.invite_token = inviteToken
      await api.post('/auth/register', payload)
      const { data } = await api.post('/auth/login', { username: form.username, password: form.password })
      setToken(data.access_token)
      const me = await api.get('/users/me')
      setUser(me.data)
      navigate('/onboarding')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Try a different username or email.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell page="register">
      {inviteToken && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          background: 'rgba(44,110,90,0.10)',
          border: '1px solid rgba(139,186,46,0.30)',
          borderRadius: '0.75rem',
          padding: '0.65rem 0.875rem',
          marginBottom: '1.25rem',
        }}>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#8bba2e', fontWeight: 500 }}>
            You've been invited to Wildr! Create your account to get started.
          </p>
        </div>
      )}
      <AuthHeading title="Create your account" subtitle="Join Wildr and start spotting wildlife" />
      <AuthError message={error} />
      <form onSubmit={handleSubmit}>
        <AuthField
          label="Username"
          id="username"
          name="username"
          autoComplete="username"
          value={form.username}
          onChange={handleChange}
          required
        />
        <AuthField
          label="Email"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <AuthField
          label="Password"
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={handleChange}
          required
          minLength={8}
        />
        <AuthBtn loading={loading}>Create account</AuthBtn>
      </form>
      <div style={{ marginTop: '0.75rem' }}>
        <AuthLinkBtn to="/login">Log in</AuthLinkBtn>
      </div>
    </AuthShell>
  )
}
