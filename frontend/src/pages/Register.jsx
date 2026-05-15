import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/client'
import useAuthStore from '../store/authStore'
import AuthShell, { AuthHeading, AuthField, AuthBtn, AuthError, AuthLinks } from '../components/AuthShell'

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const { setToken, setUser } = useAuthStore()
  const navigate = useNavigate()

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await api.post('/auth/register', form)
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
    <AuthShell>
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
        <AuthBtn loading={loading} style={{ marginTop: '0.25rem' }}>Create account</AuthBtn>
      </form>
      <AuthLinks>
        <span>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--bd-moss)', fontWeight: 600, textDecoration: 'none' }}>
            Log in
          </Link>
        </span>
      </AuthLinks>
    </AuthShell>
  )
}
