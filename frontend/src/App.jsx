import { Routes, Route } from 'react-router-dom'
import NavBar from './components/NavBar'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import Identify from './pages/Identify'
import IdentifyAudio from './pages/IdentifyAudio'
import Species from './pages/Species'
import SpeciesDetail from './pages/SpeciesDetail'
import Walks from './pages/Walks'
import WalkDetail from './pages/WalkDetail'
import LocationDetail from './pages/LocationDetail'
import Profile from './pages/Profile'

export default function App() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/identify" element={<ProtectedRoute><Identify /></ProtectedRoute>} />
        <Route path="/species" element={<ProtectedRoute><Species /></ProtectedRoute>} />
        <Route path="/species/:id" element={<ProtectedRoute><SpeciesDetail /></ProtectedRoute>} />
        <Route path="/identify/audio" element={<ProtectedRoute><IdentifyAudio /></ProtectedRoute>} />
        <Route path="/walks" element={<ProtectedRoute><Walks /></ProtectedRoute>} />
        <Route path="/walks/:id" element={<ProtectedRoute><WalkDetail /></ProtectedRoute>} />
        <Route path="/locations/:id" element={<ProtectedRoute><LocationDetail /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      </Routes>
    </>
  )
}