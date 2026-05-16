import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import useAuthStore from '../store/authStore'
import AuthShell, { AuthHeading, AuthField, AuthBtn, AuthLinkBtn, AuthError } from '../components/AuthShell'

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' })
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
      const { data } = await api.post('/auth/login', form)
      setToken(data.access_token)
      const me = await api.get('/users/me')
      setUser(me.data)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Check your username and password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell page="login">
      <AuthHeading title="Welcome back" subtitle="Log in to continue exploring wildlife" />
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
          label="Password"
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={handleChange}
          required
        />
        <div style={{ marginBottom: '1.25rem', textAlign: 'right', marginTop: '-0.5rem' }}>
          <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--bd-moss)', textDecoration: 'none' }}>
            Forgot password?
          </Link>
        </div>
        <AuthBtn loading={loading}>Log in</AuthBtn>
      </form>
      <div style={{ marginTop: '0.75rem' }}>
        <AuthLinkBtn to="/register">Create an account</AuthLinkBtn>
      </div>
    </AuthShell>
  )
}
