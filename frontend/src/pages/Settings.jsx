import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import useAuthStore from '../store/authStore'

const card = { background: 'var(--bd-card)', border: '1px solid var(--bd-rule)', borderRadius: '1.5rem' }
const muted = { color: 'var(--bd-ink-mute)', fontSize: '0.8rem' }
const ink = { color: 'var(--bd-ink)' }

function Section({ title, description, children }) {
  return (
    <div style={{ ...card, padding: '1.5rem' }}>
      <h2 style={{ fontSize: '1rem', fontWeight: 600, ...ink, margin: '0 0 0.25rem' }}>{title}</h2>
      {description && <p style={{ ...muted, marginBottom: '1.25rem' }}>{description}</p>}
      {!description && <div style={{ marginBottom: '1.25rem' }} />}
      {children}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--bd-ink-mute)', marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  )
}

function TextInput({ value, onChange, type = 'text', placeholder }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ width: '100%', borderRadius: '0.75rem', border: '1px solid var(--bd-rule)', padding: '0.5rem 0.75rem', fontSize: '0.875rem', background: 'var(--bd-bg)', color: 'var(--bd-ink)', boxSizing: 'border-box' }}
    />
  )
}

function Toggle({ checked, onChange, label, description }) {
  return (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
      <div
        onClick={() => onChange(!checked)}
        style={{ width: 40, height: 22, borderRadius: 999, flexShrink: 0, marginTop: 2, background: checked ? 'var(--bd-moss)' : 'var(--bd-rule)', position: 'relative', transition: 'background 0.2s', cursor: 'pointer' }}
      >
        <span style={{ position: 'absolute', top: 3, left: checked ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
      </div>
      <div>
        <p style={{ fontSize: '0.875rem', fontWeight: 500, ...ink, margin: 0 }}>{label}</p>
        {description && <p style={{ ...muted, margin: '2px 0 0' }}>{description}</p>}
      </div>
    </label>
  )
}

function Btn({ onClick, disabled, children, danger }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '0.5rem 1.25rem', borderRadius: '999px',
        background: danger ? 'transparent' : 'var(--bd-moss)',
        color: danger ? 'var(--bd-terra, #b04040)' : '#fff',
        border: danger ? '1px solid var(--bd-terra, #b04040)' : 'none',
        cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  )
}

export default function Settings() {
  const navigate = useNavigate()
  const { user, setUser, logout } = useAuthStore()

  // Password
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [pwdSaving, setPwdSaving] = useState(false)
  const [pwdMsg, setPwdMsg] = useState(null)

  // Notification prefs
  const [community, setCommunity] = useState(user?.share_sightings_community ?? true)
  const [anon, setAnon] = useState(user?.anonymize_community_sightings ?? false)
  const [inat, setInat] = useState(user?.share_sightings_inat ?? false)
  const [prefsSaving, setPrefsSaving] = useState(false)
  const [prefsMsg, setPrefsMsg] = useState(null)

  // Delete account
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)

  const changePassword = async () => {
    if (newPwd !== confirmPwd) { setPwdMsg({ ok: false, text: 'Passwords do not match.' }); return }
    if (newPwd.length < 8) { setPwdMsg({ ok: false, text: 'Password must be at least 8 characters.' }); return }
    setPwdSaving(true); setPwdMsg(null)
    try {
      await api.post('/users/me/password', { current_password: currentPwd, new_password: newPwd })
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('')
      setPwdMsg({ ok: true, text: 'Password updated.' })
    } catch (e) {
      setPwdMsg({ ok: false, text: e.response?.data?.detail || 'Could not update password.' })
    } finally {
      setPwdSaving(false)
    }
  }

  const savePrefs = async () => {
    setPrefsSaving(true); setPrefsMsg(null)
    try {
      const { data } = await api.patch('/users/me', {
        share_sightings_community: community,
        anonymize_community_sightings: anon,
        share_sightings_inat: inat,
      })
      setUser(data)
      setPrefsMsg({ ok: true, text: 'Preferences saved.' })
    } catch {
      setPrefsMsg({ ok: false, text: 'Could not save preferences.' })
    } finally {
      setPrefsSaving(false)
    }
  }

  const deleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') return
    setDeleting(true)
    try {
      await api.delete('/users/me')
      logout()
      navigate('/login')
    } catch {
      setDeleting(false)
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
        <button onClick={() => navigate('/profile')} style={{ background: 'none', border: 'none', cursor: 'pointer', ...muted, fontSize: '0.875rem', padding: 0 }}>← Profile</button>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, ...ink, margin: 0 }}>Settings</h1>
      </div>

      {/* Change password */}
      <Section title="Change password" description="Update your account password.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <Field label="Current password">
            <TextInput value={currentPwd} onChange={setCurrentPwd} type="password" placeholder="Current password" />
          </Field>
          <Field label="New password">
            <TextInput value={newPwd} onChange={setNewPwd} type="password" placeholder="At least 8 characters" />
          </Field>
          <Field label="Confirm new password">
            <TextInput value={confirmPwd} onChange={setConfirmPwd} type="password" placeholder="Repeat new password" />
          </Field>
        </div>
        {pwdMsg && <p style={{ fontSize: '0.8rem', marginTop: '0.75rem', color: pwdMsg.ok ? 'var(--bd-moss)' : 'var(--bd-terra, #b04040)' }}>{pwdMsg.text}</p>}
        <div style={{ marginTop: '1rem' }}>
          <Btn onClick={changePassword} disabled={pwdSaving || !currentPwd || !newPwd}>
            {pwdSaving ? 'Updating…' : 'Update password'}
          </Btn>
        </div>
      </Section>

      {/* Sharing prefs */}
      <Section title="Sharing preferences" description="Control how your sightings are shared.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Toggle
            checked={community}
            onChange={v => { setCommunity(v); if (!v) setAnon(false) }}
            label="Share sightings with the Wildr community"
            description="Your sightings can appear on community maps and feeds."
          />
          {community && (
            <div style={{ marginLeft: '3.25rem' }}>
              <Toggle checked={anon} onChange={setAnon} label="Share anonymously" description="Your username won't be attached to community sightings." />
            </div>
          )}
          <Toggle
            checked={inat}
            onChange={setInat}
            label="Share with iNaturalist"
            description="Contribute your observations to global biodiversity data."
          />
        </div>
        {prefsMsg && <p style={{ fontSize: '0.8rem', marginTop: '0.75rem', color: prefsMsg.ok ? 'var(--bd-moss)' : 'var(--bd-terra, #b04040)' }}>{prefsMsg.text}</p>}
        <div style={{ marginTop: '1rem' }}>
          <Btn onClick={savePrefs} disabled={prefsSaving}>{prefsSaving ? 'Saving…' : 'Save preferences'}</Btn>
        </div>
      </Section>

      {/* Delete account */}
      <Section title="Delete account" description="This permanently deletes your account and all sightings. This cannot be undone.">
        <Field label={'Type DELETE to confirm'}>
          <TextInput value={deleteConfirm} onChange={setDeleteConfirm} placeholder="DELETE" />
        </Field>
        <div style={{ marginTop: '1rem' }}>
          <Btn onClick={deleteAccount} disabled={deleting || deleteConfirm !== 'DELETE'} danger>
            {deleting ? 'Deleting…' : 'Delete my account'}
          </Btn>
        </div>
      </Section>
    </div>
  )
}
