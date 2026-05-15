import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import NavBar from './components/NavBar'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Home from './pages/Home'
import Identify from './pages/Identify'
import LogSighting from './pages/LogSighting'
import Species from './pages/Species'
import SpeciesDetail from './pages/SpeciesDetail'
import Walks from './pages/Walks'
import WalkDetail from './pages/WalkDetail'
import LocationDetail from './pages/LocationDetail'
import Profile from './pages/Profile'
import Map from './pages/Map'
import Badges from './pages/Badges'
import Sightings from './pages/Sightings'
import Friends from './pages/Friends'
import Onboarding from './pages/Onboarding'
import api from './api/client'
import useAuthStore from './store/authStore'
import { ToastProvider } from './components/Toast'

export default function App() {
  const { token, setUser } = useAuthStore()

  useEffect(() => {
    if (token) {
      api.get('/users/me').then(({ data }) => setUser(data)).catch(() => {})
    }
  }, [token, setUser])

  return (
    <ToastProvider>
      <NavBar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/identify" element={<ProtectedRoute><Identify /></ProtectedRoute>} />
        <Route path="/species" element={<ProtectedRoute><Species /></ProtectedRoute>} />
        <Route path="/species/:id" element={<ProtectedRoute><SpeciesDetail /></ProtectedRoute>} />
        <Route path="/identify/audio" element={<ProtectedRoute><Identify /></ProtectedRoute>} />
        <Route path="/log-sighting" element={<ProtectedRoute><LogSighting /></ProtectedRoute>} />
        <Route path="/walks" element={<ProtectedRoute><Walks /></ProtectedRoute>} />
        <Route path="/walks/:id" element={<ProtectedRoute><WalkDetail /></ProtectedRoute>} />
        <Route path="/locations/:id" element={<ProtectedRoute><LocationDetail /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/map" element={<ProtectedRoute><Map /></ProtectedRoute>} />
        <Route path="/badges" element={<ProtectedRoute><Badges /></ProtectedRoute>} />
        <Route path="/sightings" element={<ProtectedRoute><Sightings /></ProtectedRoute>} />
        <Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />
      </Routes>
    </ToastProvider>
  )
}