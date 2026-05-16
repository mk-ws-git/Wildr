import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import useAuthStore from '../store/authStore'
import AuthShell, { AuthTextarea, AuthField, AuthBtn } from '../components/AuthShell'

const InterestIcon = ({ id }) => {
  const icons = {
    birds: <path d="M12 2C9 2 6 4 6 7c0 2 1 3.5 2.5 4.5L6 20h12l-2.5-8.5C17 10.5 18 9 18 7c0-3-3-5-6-5zm0 3c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z"/>,
    mammals: <><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/><path d="M8 4.5C7 3.5 5 3 4 4M16 4.5C17 3.5 19 3 20 4"/></>,
    insects: <><path d="M12 8a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/><path d="M12 8v12M8 10l-4 2M16 10l4 2M6 16l-3 2M18 16l3 2"/></>,
    plants: <path d="M12 22V12M12 12C12 7 7 5 4 7c3 0 5 2 8 5M12 12c0-5 5-7 8-5-3 0-5 2-8 5"/>,
    fungi: <><path d="M5 12c0-3.9 3.1-7 7-7s7 3.1 7 7H5z"/><path d="M9 12v5a3 3 0 0 0 6 0v-5"/></>,
    reptiles: <><path d="M21 16s-3-2-6-2-4 2-4 2"/><path d="M3 16s2-3 5-4 7 0 9 3"/><path d="M9 20l3-8 3 8"/><circle cx="12" cy="8" r="2"/></>,
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
      {icons[id]}
    </svg>
  )
}

const INTERESTS = [
  { id: 'birds', label: 'Birds' },
  { id: 'mammals', label: 'Mammals' },
  { id: 'insects', label: 'Insects' },
  { id: 'plants', label: 'Plants' },
  { id: 'fungi', label: 'Fungi' },
  { id: 'reptiles', label: 'Reptiles' },
]

function StepDots({ step, total }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem', marginBottom: '1.75rem' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width: i === step ? 20 : 6,
            height: 6,
            borderRadius: 999,
            background: i === step ? 'var(--bd-moss)' : 'var(--bd-rule)',
            transition: 'all 0.25s',
          }}
        />
      ))}
    </div>
  )
}

function LeafIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <path d="M20 4 Q36 20 20 36 Q4 20 20 4Z" fill="var(--bd-moss)" opacity="0.15" />
      <path d="M20 8 Q32 20 20 32 Q8 20 20 8Z" fill="var(--bd-moss)" opacity="0.4" />
    </svg>
  )
}

export default function Onboarding() {
  const { user, setUser } = useAuthStore()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [locationName, setLocationName] = useState('')
  const [locationLat, setLocationLat] = useState(null)
  const [locationLng, setLocationLng] = useState(null)
  const [detectingLocation, setDetectingLocation] = useState(false)
  const [locationDetected, setLocationDetected] = useState(false)
  const [interests, setInterests] = useState(new Set())
  const [saving, setSaving] = useState(false)

  const toggleInterest = (id) =>
    setInterests(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const detectLocation = () => {
    if (!navigator.geolocation) return
    setDetectingLocation(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocationLat(coords.latitude)
        setLocationLng(coords.longitude)
        setLocationDetected(true)
        setDetectingLocation(false)
      },
      () => setDetectingLocation(false),
      { timeout: 8000 }
    )
  }

  const saveProfile = async () => {
    setSaving(true)
    try {
      const updates = {}
      if (bio.trim()) updates.bio = bio.trim()
      if (avatarUrl.trim()) updates.avatar_url = avatarUrl.trim()
      if (locationName.trim()) updates.location_name = locationName.trim()
      if (locationLat != null) updates.location_lat = locationLat
      if (locationLng != null) updates.location_lng = locationLng
      if (Object.keys(updates).length > 0) {
        const { data } = await api.patch('/users/me', updates)
        setUser(data)
      }
    } catch {
      // non-fatal
    } finally {
      setSaving(false)
    }
  }

  const handleProfile = async (e) => {
    e.preventDefault()
    await saveProfile()
    setStep(2)
  }

  const finish = () => navigate('/')

  return (
    <AuthShell>
      <StepDots step={step} total={3} />

      {step === 0 && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
            <LeafIcon />
          </div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--bd-ink)', margin: '0 0 0.5rem' }}>
            Welcome{user?.username ? `, ${user.username}` : ''}!
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--bd-ink-mute)', lineHeight: 1.6, margin: '0 0 0.25rem' }}>
            Wildr is your field companion for spotting and logging wildlife.
          </p>
          <p style={{ fontSize: '0.9rem', color: 'var(--bd-ink-mute)', lineHeight: 1.6, margin: '0 0 2rem' }}>
            Identify species from photos or audio, track sightings, explore local hotspots, and share discoveries with friends.
          </p>
          <AuthBtn onClick={() => setStep(1)}>Get started</AuthBtn>
        </div>
      )}

      {step === 1 && (
        <form onSubmit={handleProfile}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--bd-ink)', margin: '0 0 0.3rem' }}>About you</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--bd-ink-mute)', margin: 0 }}>Set up your profile — or skip for now.</p>
          </div>

          <AuthTextarea
            label="Bio"
            id="bio"
            placeholder="e.g. Amateur birder based in the Scottish Highlands…"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
          <AuthField
            label="Avatar URL"
            id="avatar"
            type="url"
            placeholder="https://…"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
          />

          {/* Location */}
          <div style={{ marginBottom: '1.25rem' }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--bd-ink-soft)', marginBottom: '0.5rem' }}>
              Your location <span style={{ fontWeight: 400, color: 'var(--bd-ink-mute)' }}>(sets map & weather defaults)</span>
            </p>
            <button
              type="button"
              onClick={detectLocation}
              disabled={detectingLocation || locationDetected}
              style={{
                width: '100%',
                padding: '0.55rem 0.875rem',
                borderRadius: '0.625rem',
                border: `1.5px solid ${locationDetected ? 'var(--bd-moss)' : 'var(--bd-rule)'}`,
                background: locationDetected ? 'rgba(45,106,79,0.06)' : 'var(--bd-bg)',
                color: locationDetected ? 'var(--bd-moss)' : 'var(--bd-ink)',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: detectingLocation || locationDetected ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                marginBottom: '0.5rem',
                transition: 'all 0.15s',
              }}
            >
              {locationDetected ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Location detected
                </>
              ) : detectingLocation ? (
                'Detecting…'
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>
                    <line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/>
                    <line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/>
                  </svg>
                  Detect my location
                </>
              )}
            </button>
            <AuthField
              label="City / place name"
              id="location"
              placeholder="e.g. Edinburgh, Scotland"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--bd-ink-soft)', marginBottom: '0.6rem' }}>
              Interests <span style={{ fontWeight: 400, color: 'var(--bd-ink-mute)' }}>(optional)</span>
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {INTERESTS.map(({ id, label }) => {
                const active = interests.has(id)
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleInterest(id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.625rem',
                      border: `1.5px solid ${active ? 'var(--bd-moss)' : 'var(--bd-rule)'}`,
                      background: active ? 'rgba(45,106,79,0.08)' : 'var(--bd-bg)',
                      color: active ? 'var(--bd-moss-deep)' : 'var(--bd-ink)',
                      fontSize: '0.85rem', fontWeight: active ? 600 : 400,
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    <InterestIcon id={id} />
                    <span>{label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <AuthBtn loading={saving}>Continue</AuthBtn>
          <button
            type="button"
            onClick={() => setStep(2)}
            style={{ width: '100%', marginTop: '0.5rem', background: 'none', border: 'none', color: 'var(--bd-ink-mute)', fontSize: '0.85rem', cursor: 'pointer', padding: '0.4rem' }}
          >
            Skip for now
          </button>
        </form>
      )}

      {step === 2 && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(45,106,79,0.1)', display: 'grid', placeItems: 'center', margin: '0 auto 1.25rem' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--bd-moss)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--bd-ink)', margin: '0 0 0.5rem' }}>
            You&apos;re all set!
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--bd-ink-mute)', lineHeight: 1.6, margin: '0 0 2rem' }}>
            Head out, spot something, and log your first sighting. Happy exploring.
          </p>
          <AuthBtn onClick={finish}>Start exploring</AuthBtn>
        </div>
      )}
    </AuthShell>
  )
}
