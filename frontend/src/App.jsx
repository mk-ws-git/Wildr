import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import NavBar from './components/NavBar'
import ProtectedRoute from './components/ProtectedRoute'
import PineTrees from './components/PineTrees'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Splash from './pages/Splash'
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
import Notifications from './pages/Notifications'
import Settings from './pages/Settings'
import Onboarding from './pages/Onboarding'
import UserProfile from './pages/UserProfile'
import Search from './pages/Search'
import NotFound from './pages/NotFound'
import api from './api/client'
import useAuthStore from './store/authStore'
import { ToastProvider } from './components/Toast'

export default function App() {
  const { token, setUser } = useAuthStore()
  const [initializing, setInitializing] = useState(!!token)

  useEffect(() => {
    if (token) {
      setInitializing(true)
      api.get('/users/me')
        .then(({ data }) => setUser(data))
        .catch(() => {})
        .finally(() => setInitializing(false))
    } else {
      setInitializing(false)
    }
  }, [token, setUser])

  if (initializing) {
    return <PineTrees fullPage size="lg" label="Loading Wildr…" />
  }

  return (
    <ToastProvider>
      <NavBar />
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Splash for unauthenticated, Home for authenticated */}
        <Route path="/" element={token ? <ProtectedRoute><Home /></ProtectedRoute> : <Splash />} />

        {/* Protected */}
        <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
        <Route path="/identify" element={<ProtectedRoute><Identify /></ProtectedRoute>} />
        <Route path="/identify/audio" element={<ProtectedRoute><Identify /></ProtectedRoute>} />
        <Route path="/log-sighting" element={<ProtectedRoute><LogSighting /></ProtectedRoute>} />
        <Route path="/species" element={<ProtectedRoute><Species /></ProtectedRoute>} />
        <Route path="/species/:id" element={<ProtectedRoute><SpeciesDetail /></ProtectedRoute>} />
        <Route path="/walks" element={<ProtectedRoute><Walks /></ProtectedRoute>} />
        <Route path="/walks/:id" element={<ProtectedRoute><WalkDetail /></ProtectedRoute>} />
        <Route path="/locations/:id" element={<ProtectedRoute><LocationDetail /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/map" element={<ProtectedRoute><Map /></ProtectedRoute>} />
        <Route path="/badges" element={<ProtectedRoute><Badges /></ProtectedRoute>} />
        <Route path="/sightings" element={<ProtectedRoute><Sightings /></ProtectedRoute>} />
        <Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/users/:id" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ToastProvider>
  )
}