import { useState } from 'react'
import api from '../api/client'

/**
 * Small "Report" link that opens an inline form.
 * Props: contentType ('location' | 'greenspace' | 'species'), contentId
 */
export default function FlagButton({ contentType, contentId }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (reason.trim().length < 5) return
    setLoading(true)
    try {
      await api.post('/flags', { content_type: contentType, content_id: contentId, reason: reason.trim() })
      setSent(true)
    } catch {
      // silent fail — user can try again
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <p style={{ fontSize: '0.75rem', color: 'var(--bd-ink-mute)', textAlign: 'center', padding: '0.5rem 0' }}>
        Thanks — we'll review this.
      </p>
    )
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '0.75rem',
          color: 'var(--bd-ink-mute)',
          padding: '0.25rem 0',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
          <line x1="4" y1="22" x2="4" y2="15"/>
        </svg>
        Report incorrect info
      </button>
    )
  }

  return (
    <div
      style={{
        background: 'var(--bd-card)',
        border: '1px solid var(--bd-rule)',
        borderRadius: '0.75rem',
        padding: '0.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}
    >
      <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--bd-ink)', margin: 0 }}>
        What's incorrect?
      </p>
      <textarea
        rows={3}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Describe the error briefly…"
        style={{
          width: '100%',
          boxSizing: 'border-box',
          borderRadius: '0.5rem',
          padding: '0.5rem 0.625rem',
          fontSize: '0.8rem',
          border: '1px solid var(--bd-rule)',
          background: 'var(--bd-bg)',
          color: 'var(--bd-ink)',
          resize: 'vertical',
        }}
      />
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={submit}
          disabled={loading || reason.trim().length < 5}
          style={{
            flex: 1,
            padding: '0.4rem 0',
            borderRadius: '0.5rem',
            border: 'none',
            background: 'var(--bd-moss)',
            color: '#fff',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            opacity: reason.trim().length < 5 ? 0.5 : 1,
          }}
        >
          {loading ? 'Sending…' : 'Send report'}
        </button>
        <button
          onClick={() => { setOpen(false); setReason('') }}
          style={{
            padding: '0.4rem 0.75rem',
            borderRadius: '0.5rem',
            border: '1px solid var(--bd-rule)',
            background: 'none',
            fontSize: '0.8rem',
            color: 'var(--bd-ink-mute)',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
