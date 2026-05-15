import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import useAuthStore from '../store/authStore'
import AuthShell, { AuthTextarea, AuthField, AuthBtn } from '../components/AuthShell'

const INTERESTS = [
  { id: 'birds', label: 'Birds', emoji: '🐦' },
  { id: 'mammals', label: 'Mammals', emoji: '🦊' },
  { id: 'insects', label: 'Insects', emoji: '🦋' },
  { id: 'plants', label: 'Plants', emoji: '🌿' },
  { id: 'fungi', label: 'Fungi', emoji: '🍄' },
  { id: 'reptiles', label: 'Reptiles', emoji: '🦎' },
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
  const [interests, setInterests] = useState(new Set())
  const [saving, setSaving] = useState(false)

  const toggleInterest = (id) =>
    setInterests(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const saveProfile = async () => {
    setSaving(true)
    try {
      const updates = {}
      if (bio.trim()) updates.bio = bio.trim()
      if (avatarUrl.trim()) updates.avatar_url = avatarUrl.trim()
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
            <p style={{ fontSize: '0.875rem', color: 'var(--bd-ink-mute)', margin: 0 }}>Tell other naturalists a little about yourself — or skip for now.</p>
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

          <div style={{ marginBottom: '1.25rem' }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--bd-ink-soft)', marginBottom: '0.6rem' }}>
              Interests <span style={{ fontWeight: 400, color: 'var(--bd-ink-mute)' }}>(optional)</span>
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {INTERESTS.map(({ id, label, emoji }) => {
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
                      background: active ? 'rgba(90,110,74,0.08)' : 'var(--bd-bg)',
                      color: active ? 'var(--bd-moss-deep)' : 'var(--bd-ink)',
                      fontSize: '0.85rem', fontWeight: active ? 600 : 400,
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    <span>{emoji}</span>
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
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(90,110,74,0.1)', display: 'grid', placeItems: 'center', margin: '0 auto 1.25rem' }}>
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
