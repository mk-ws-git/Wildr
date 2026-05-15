import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import useAuthStore from '../store/authStore'

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

function initials(name) {
  return name.split(' ').map(p => p[0]?.toUpperCase() || '').slice(0, 2).join('')
}

const card = { background: 'var(--bd-card)', border: '1px solid var(--bd-rule)', borderRadius: '1.5rem' }
const muted = { color: 'var(--bd-ink-mute)', fontSize: '0.8rem' }
const ink = { color: 'var(--bd-ink)' }

function Input({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--bd-ink-mute)', marginBottom: 4 }}>{label}</label>
      {type === 'textarea' ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          style={{ width: '100%', borderRadius: '0.75rem', border: '1px solid var(--bd-rule)', padding: '0.5rem 0.75rem', fontSize: '0.875rem', background: 'var(--bd-bg)', color: 'var(--bd-ink)', resize: 'vertical', boxSizing: 'border-box' }}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ width: '100%', borderRadius: '0.75rem', border: '1px solid var(--bd-rule)', padding: '0.5rem 0.75rem', fontSize: '0.875rem', background: 'var(--bd-bg)', color: 'var(--bd-ink)', boxSizing: 'border-box' }}
        />
      )}
    </div>
  )
}

function Toggle({ checked, onChange, label, description }) {
  return (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 40, height: 22, borderRadius: 999, flexShrink: 0, marginTop: 2,
          background: checked ? 'var(--bd-moss)' : 'var(--bd-rule)',
          position: 'relative', transition: 'background 0.2s', cursor: 'pointer',
        }}
      >
        <span style={{
          position: 'absolute', top: 3, left: checked ? 21 : 3,
          width: 16, height: 16, borderRadius: '50%', background: '#fff',
          transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </div>
      <div>
        <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--bd-ink)', margin: 0 }}>{label}</p>
        {description && <p style={{ fontSize: '0.78rem', color: 'var(--bd-ink-mute)', margin: '2px 0 0' }}>{description}</p>}
      </div>
    </label>
  )
}

// ── Tab: View ─────────────────────────────────────────────────────────────

function ViewTab({ user, recentSightings, badges, friendships, savedLocations, loading, onEdit }) {
  const acceptedFriends = friendships.filter(f => f.status === 'accepted')
  const pendingRequests = friendships.filter(f => f.status === 'pending' && f.addressee_id === user.id)
  const outgoingRequests = friendships.filter(f => f.status === 'pending' && f.requester_id === user.id)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div style={{ ...card, padding: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--bd-rule)', color: 'var(--bd-ink)', display: 'grid', placeItems: 'center', fontSize: '1.25rem', fontWeight: 600, flexShrink: 0, overflow: 'hidden' }}>
              {user.avatar_url
                ? <img src={user.avatar_url} alt={user.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : initials(user.username)}
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, ...ink, margin: 0 }}>{user.username}</h1>
              <p style={{ ...muted, marginTop: '0.25rem' }}>{user.bio || 'A curious nature lover building their Wildr profile.'}</p>
              {user.location_name && <p style={{ ...muted, marginTop: '0.15rem' }}>{user.location_name}</p>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <div style={{ background: 'var(--bd-bg)', borderRadius: '1rem', padding: '0.75rem 1.25rem', fontSize: '0.8rem' }}>
              <p style={{ ...muted, marginBottom: '0.2rem' }}>Member since</p>
              <p style={{ ...ink, fontWeight: 600 }}>{formatDate(user.created_at)}</p>
            </div>
            <button onClick={onEdit} style={{ padding: '0.5rem 1rem', borderRadius: '999px', border: '1px solid var(--bd-rule)', background: 'var(--bd-card)', color: 'var(--bd-ink)', fontSize: '0.875rem', cursor: 'pointer', fontWeight: 500 }}>
              Edit profile
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
        {[
          { label: 'Sightings', count: recentSightings.length },
          { label: 'Badges', count: badges.length },
          { label: 'Friends', count: acceptedFriends.length },
          { label: 'Saved places', count: savedLocations.length },
        ].map(({ label, count }) => (
          <div key={label} style={{ ...card, padding: '1rem 1.25rem' }}>
            <p style={muted}>{label}</p>
            <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--bd-moss)', marginTop: '0.4rem', lineHeight: 1 }}>{loading ? '—' : count}</p>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) minmax(0,1fr)', gap: '1.25rem', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ ...card, padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, ...ink, marginBottom: '1rem' }}>Profile details</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ background: 'var(--bd-bg)', borderRadius: '1rem', padding: '0.875rem 1rem' }}>
                <p style={muted}>Bio</p>
                <p style={{ ...ink, fontSize: '0.85rem', marginTop: '0.35rem' }}>{user.bio || 'No bio yet.'}</p>
              </div>
              <div style={{ background: 'var(--bd-bg)', borderRadius: '1rem', padding: '0.875rem 1rem' }}>
                <p style={muted}>Email</p>
                <p style={{ ...ink, fontSize: '0.85rem', marginTop: '0.35rem', wordBreak: 'break-all' }}>{user.email}</p>
              </div>
            </div>
          </div>
          <div style={{ ...card, padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, ...ink, margin: 0 }}>Recent sightings</h2>
              <Link to="/sightings" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--bd-moss)', textDecoration: 'none' }}>View all</Link>
            </div>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[0,1,2].map(i => <div key={i} style={{ height: 48, borderRadius: '0.75rem', background: 'var(--bd-bg)' }} />)}
              </div>
            ) : recentSightings.length === 0 ? (
              <p style={muted}><Link to="/identify" style={{ color: 'var(--bd-moss)', textDecoration: 'none' }}>Head to Identify</Link> to log your first sighting.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {recentSightings.map(s => (
                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0.875rem', background: 'var(--bd-bg)', borderRadius: '0.75rem' }}>
                    <div>
                      <p style={{ fontSize: '0.875rem', fontWeight: 600, ...ink, margin: 0 }}>{s.common_name}</p>
                      <p style={{ fontSize: '0.75rem', fontStyle: 'italic', ...muted, margin: 0 }}>{s.scientific_name}</p>
                    </div>
                    <p style={{ ...muted, flexShrink: 0 }}>{formatDate(s.identified_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ ...card, padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, ...ink, margin: 0 }}>Badges</h2>
              <Link to="/badges" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--bd-moss)', textDecoration: 'none' }}>View all</Link>
            </div>
            {badges.length === 0 ? (
              <p style={muted}>No badges yet. Log a sighting to start earning.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {badges.slice(0, 5).map(item => (
                  <div key={item.badge.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', background: 'var(--bd-bg)', borderRadius: '0.75rem' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '0.5rem', background: 'var(--bd-moss)', display: 'grid', placeItems: 'center', color: '#fff', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                      {item.badge.name[0].toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: '0.8rem', fontWeight: 600, ...ink, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.badge.name}</p>
                      <p style={{ ...muted, margin: 0 }}>{formatDate(item.earned_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ ...card, padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, ...ink, marginBottom: '1rem' }}>Community</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { label: 'Friends', count: acceptedFriends.length },
                { label: 'Incoming requests', count: pendingRequests.length },
                { label: 'Outgoing requests', count: outgoingRequests.length },
              ].map(({ label, count }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0.875rem', background: 'var(--bd-bg)', borderRadius: '0.75rem' }}>
                  <p style={{ ...muted, margin: 0 }}>{label}</p>
                  <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--bd-moss)', margin: 0 }}>{loading ? '—' : count}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Tab: Edit ─────────────────────────────────────────────────────────────

function EditTab({ user, setUser, onBack }) {
  const { setUser: storeSetUser } = useAuthStore()
  const avatarInputRef = useRef(null)

  const [bio, setBio] = useState(user.bio || '')
  const [locationName, setLocationName] = useState(user.location_name || '')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg] = useState(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPwd, setSavingPwd] = useState(false)
  const [pwdMsg, setPwdMsg] = useState(null)

  const [avatarUploading, setAvatarUploading] = useState(false)

  const saveProfile = async () => {
    setSavingProfile(true)
    setProfileMsg(null)
    try {
      const { data } = await api.patch('/users/me', { bio: bio || null, location_name: locationName || null })
      storeSetUser(data)
      setUser(data)
      setProfileMsg({ ok: true, text: 'Profile saved.' })
    } catch {
      setProfileMsg({ ok: false, text: 'Could not save profile.' })
    } finally {
      setSavingProfile(false)
    }
  }

  const changePassword = async () => {
    if (newPassword !== confirmPassword) { setPwdMsg({ ok: false, text: 'Passwords do not match.' }); return }
    if (newPassword.length < 8) { setPwdMsg({ ok: false, text: 'Password must be at least 8 characters.' }); return }
    setSavingPwd(true)
    setPwdMsg(null)
    try {
      await api.post('/users/me/password', { current_password: currentPassword, new_password: newPassword })
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
      setPwdMsg({ ok: true, text: 'Password updated.' })
    } catch (e) {
      setPwdMsg({ ok: false, text: e.response?.data?.detail || 'Could not update password.' })
    } finally {
      setSavingPwd(false)
    }
  }

  const uploadAvatar = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setAvatarUploading(true)
    const form = new FormData()
    form.append('file', file)
    try {
      const { data } = await api.post('/users/me/avatar', form)
      storeSetUser(data)
      setUser(data)
    } catch { /* silent */ } finally {
      setAvatarUploading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--bd-ink-mute)', fontSize: '0.875rem', padding: 0, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          ← Back to profile
        </button>
      </div>

      {/* Avatar */}
      <div style={{ ...card, padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, ...ink, marginBottom: '1rem' }}>Profile photo</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--bd-rule)', display: 'grid', placeItems: 'center', overflow: 'hidden', flexShrink: 0 }}>
            {avatarUploading ? (
              <span style={{ fontSize: '0.7rem', color: 'var(--bd-ink-mute)' }}>…</span>
            ) : user.avatar_url ? (
              <img src={user.avatar_url} alt={user.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--bd-ink)' }}>{initials(user.username)}</span>
            )}
          </div>
          <div>
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading}
              style={{ padding: '0.4rem 1rem', borderRadius: '999px', border: '1px solid var(--bd-rule)', background: 'var(--bd-card)', color: 'var(--bd-ink)', fontSize: '0.875rem', cursor: 'pointer' }}
            >
              {avatarUploading ? 'Uploading…' : 'Change photo'}
            </button>
            <p style={{ ...muted, marginTop: 4 }}>JPG, PNG or WebP. Max 5 MB.</p>
            <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadAvatar} />
          </div>
        </div>
      </div>

      {/* Profile details */}
      <div style={{ ...card, padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, ...ink, marginBottom: '1rem' }}>Profile details</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <Input label="Bio" value={bio} onChange={setBio} type="textarea" placeholder="Tell Wildr about yourself…" />
          <Input label="Location name" value={locationName} onChange={setLocationName} placeholder="e.g. Edinburgh, Scotland" />
        </div>
        {profileMsg && (
          <p style={{ fontSize: '0.8rem', marginTop: '0.75rem', color: profileMsg.ok ? 'var(--bd-moss)' : 'var(--bd-terra)' }}>{profileMsg.text}</p>
        )}
        <button
          onClick={saveProfile}
          disabled={savingProfile}
          style={{ marginTop: '1rem', padding: '0.5rem 1.25rem', borderRadius: '999px', background: 'var(--bd-moss)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, opacity: savingProfile ? 0.6 : 1 }}
        >
          {savingProfile ? 'Saving…' : 'Save changes'}
        </button>
      </div>

      {/* Change password */}
      <div style={{ ...card, padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, ...ink, marginBottom: '1rem' }}>Change password</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <Input label="Current password" value={currentPassword} onChange={setCurrentPassword} type="password" placeholder="Current password" />
          <Input label="New password" value={newPassword} onChange={setNewPassword} type="password" placeholder="At least 8 characters" />
          <Input label="Confirm new password" value={confirmPassword} onChange={setConfirmPassword} type="password" placeholder="Repeat new password" />
        </div>
        {pwdMsg && (
          <p style={{ fontSize: '0.8rem', marginTop: '0.75rem', color: pwdMsg.ok ? 'var(--bd-moss)' : 'var(--bd-terra)' }}>{pwdMsg.text}</p>
        )}
        <button
          onClick={changePassword}
          disabled={savingPwd || !currentPassword || !newPassword}
          style={{ marginTop: '1rem', padding: '0.5rem 1.25rem', borderRadius: '999px', background: 'var(--bd-moss)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, opacity: (savingPwd || !currentPassword || !newPassword) ? 0.5 : 1 }}
        >
          {savingPwd ? 'Updating…' : 'Update password'}
        </button>
      </div>
    </div>
  )
}

// ── Tab: Preferences ─────────────────────────────────────────────────────

function PrefsTab({ user, setUser, onBack }) {
  const { setUser: storeSetUser } = useAuthStore()
  const [community, setCommunity] = useState(user.share_sightings_community ?? true)
  const [anon, setAnon] = useState(user.anonymize_community_sightings ?? false)
  const [inat, setInat] = useState(user.share_sightings_inat ?? false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  const save = async () => {
    setSaving(true)
    setMsg(null)
    try {
      const { data } = await api.patch('/users/me', {
        share_sightings_community: community,
        anonymize_community_sightings: anon,
        share_sightings_inat: inat,
      })
      storeSetUser(data)
      setUser(data)
      setMsg({ ok: true, text: 'Preferences saved.' })
    } catch {
      setMsg({ ok: false, text: 'Could not save preferences.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--bd-ink-mute)', fontSize: '0.875rem', padding: 0 }}>
          ← Back to profile
        </button>
      </div>

      <div style={{ ...card, padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, ...ink, marginBottom: '0.25rem' }}>Wildr community</h2>
        <p style={{ ...muted, marginBottom: '1.25rem' }}>Control how your sightings are shared within the Wildr app.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Toggle
            checked={community}
            onChange={v => { setCommunity(v); if (!v) setAnon(false) }}
            label="Share sightings with the Wildr community"
            description="Your sightings can appear on community maps and feeds."
          />
          {community && (
            <div style={{ marginLeft: '3.25rem' }}>
              <Toggle
                checked={anon}
                onChange={setAnon}
                label="Share anonymously"
                description="Your username won't be attached to community sightings — only the species and location are shown."
              />
            </div>
          )}
        </div>
      </div>

      <div style={{ ...card, padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, ...ink, marginBottom: '0.25rem' }}>Scientific community</h2>
        <p style={{ ...muted, marginBottom: '1.25rem' }}>Contribute your observations to biodiversity research.</p>
        <Toggle
          checked={inat}
          onChange={setInat}
          label="Share with iNaturalist"
          description="Your identified sightings (species + location + date) will be automatically submitted to iNaturalist, contributing to global biodiversity data. Your iNaturalist username will be used if linked, otherwise submissions are anonymous."
        />
        {inat && (
          <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', borderRadius: '0.75rem', background: 'var(--bd-bg)', border: '1px solid var(--bd-rule)' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--bd-ink-mute)', margin: 0 }}>
              By enabling this, you agree that your observation data will be shared under the <strong>CC BY-NC 4.0</strong> licence with the iNaturalist platform and associated research institutions.
            </p>
          </div>
        )}
      </div>

      {msg && (
        <p style={{ fontSize: '0.875rem', color: msg.ok ? 'var(--bd-moss)' : 'var(--bd-terra)', textAlign: 'center' }}>{msg.text}</p>
      )}
      <button
        onClick={save}
        disabled={saving}
        style={{ padding: '0.625rem 1.5rem', borderRadius: '999px', background: 'var(--bd-moss)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, opacity: saving ? 0.6 : 1, alignSelf: 'flex-start' }}
      >
        {saving ? 'Saving…' : 'Save preferences'}
      </button>
    </div>
  )
}

// ── Page shell ────────────────────────────────────────────────────────────

export default function Profile() {
  const { user: storeUser } = useAuthStore()
  const [user, setUser] = useState(storeUser)
  const [tab, setTab] = useState('view') // 'view' | 'edit' | 'prefs'
  const [recentSightings, setRecentSightings] = useState([])
  const [badges, setBadges] = useState([])
  const [friendships, setFriendships] = useState([])
  const [savedLocations, setSavedLocations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { setUser(storeUser) }, [storeUser])

  useEffect(() => {
    if (!user) return
    setLoading(true)
    Promise.all([
      api.get('/sightings/me?limit=3').then(r => r.data).catch(() => []),
      api.get('/badges/me').then(r => r.data).catch(() => []),
      api.get('/friendships/me').then(r => r.data).catch(() => []),
      api.get('/locations/saved').then(r => r.data).catch(() => []),
    ])
      .then(([sightingsData, badgesData, friendshipData, savedData]) => {
        setRecentSightings(sightingsData)
        setBadges(badgesData)
        setFriendships(friendshipData)
        setSavedLocations(savedData)
      })
      .finally(() => setLoading(false))
  }, [user?.id])

  if (!user) return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1rem', color: 'var(--bd-ink-mute)' }}>
      Loading profile…
    </div>
  )

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1rem' }}>
      {/* Tab bar — only shown on view */}
      {tab === 'view' && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <button
            onClick={() => setTab('edit')}
            style={{ padding: '0.4rem 1rem', borderRadius: '999px', border: '1px solid var(--bd-rule)', background: 'var(--bd-card)', color: 'var(--bd-ink)', fontSize: '0.875rem', cursor: 'pointer' }}
          >
            Edit profile
          </button>
          <button
            onClick={() => setTab('prefs')}
            style={{ padding: '0.4rem 1rem', borderRadius: '999px', border: '1px solid var(--bd-rule)', background: 'var(--bd-card)', color: 'var(--bd-ink)', fontSize: '0.875rem', cursor: 'pointer' }}
          >
            Preferences
          </button>
        </div>
      )}

      {tab === 'view' && (
        <ViewTab
          user={user}
          recentSightings={recentSightings}
          badges={badges}
          friendships={friendships}
          savedLocations={savedLocations}
          loading={loading}
          onEdit={() => setTab('edit')}
        />
      )}
      {tab === 'edit' && <EditTab user={user} setUser={setUser} onBack={() => setTab('view')} />}
      {tab === 'prefs' && <PrefsTab user={user} setUser={setUser} onBack={() => setTab('view')} />}
    </div>
  )
}
