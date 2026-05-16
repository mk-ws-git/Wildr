import { useState, useRef } from 'react'
import api from '../api/client'

const TABS = [
  { id: 'inat', label: 'iNat Pull' },
  { id: 'ebird', label: 'eBird CSV' },
  { id: 'bulk', label: 'Bulk CSV' },
]

const BULK_TEMPLATE = `date,species_name,lat,lng,place_name,notes
2024-06-01,Robin,51.5074,-0.1278,Hyde Park,Singing from oak
2024-06-02,Blue Tit,51.5080,-0.1290,Kensington Gardens,Pair nesting`

function ResultBlock({ result }) {
  if (!result) return null
  return (
    <div style={{ marginTop: '1.25rem' }}>
      <p style={{ margin: '0 0 0.5rem', color: 'var(--bd-ink)', fontSize: '0.9rem', fontWeight: 600 }}>
        {typeof result.imported === 'number'
          ? `Imported ${result.imported} sighting${result.imported !== 1 ? 's' : ''}, skipped ${result.skipped ?? 0} duplicate${(result.skipped ?? 0) !== 1 ? 's' : ''}.`
          : result.message}
      </p>
      {result.errors && result.errors.length > 0 && (
        <div
          style={{
            maxHeight: '180px',
            overflowY: 'auto',
            background: 'var(--bd-bg)',
            border: '1px solid var(--bd-rule)',
            borderRadius: '6px',
            padding: '0.625rem 0.75rem',
          }}
        >
          {result.errors.map((err, i) => (
            <p
              key={i}
              style={{
                margin: '0 0 0.25rem',
                fontFamily: 'ui-monospace, monospace',
                fontSize: '0.75rem',
                color: 'var(--bd-ink-mute)',
                lineHeight: 1.5,
              }}
            >
              {err}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

function ErrorMsg({ message }) {
  if (!message) return null
  return (
    <p style={{ marginTop: '1rem', color: '#c0392b', fontSize: '0.875rem' }}>{message}</p>
  )
}

function Spinner() {
  return (
    <span
      style={{
        display: 'inline-block',
        width: '16px',
        height: '16px',
        border: '2px solid var(--bd-rule)',
        borderTopColor: 'var(--bd-moss)',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
        verticalAlign: 'middle',
        marginRight: '0.5rem',
      }}
    />
  )
}

// ── iNat Pull tab ─────────────────────────────────────────────────────────────

function InatTab() {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  async function handleImport() {
    if (!username.trim()) return
    setLoading(true)
    setResult(null)
    setError('')
    try {
      const res = await api.post('/sightings/import/inat', { inat_username: username.trim() })
      setResult(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Import failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <label style={labelStyle}>iNaturalist username</label>
      <input
        type="text"
        value={username}
        onChange={e => setUsername(e.target.value)}
        placeholder="e.g. naturalist_jane"
        style={inputStyle}
        disabled={loading}
      />
      <button
        onClick={handleImport}
        disabled={loading || !username.trim()}
        style={btnStyle(loading || !username.trim())}
      >
        {loading && <Spinner />}
        {loading ? 'Importing…' : 'Import sightings'}
      </button>
      <ErrorMsg message={error} />
      <ResultBlock result={result} />
    </div>
  )
}

// ── eBird CSV tab ─────────────────────────────────────────────────────────────

function EbirdTab() {
  const fileRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  async function handleImport() {
    const file = fileRef.current?.files?.[0]
    if (!file) return
    setLoading(true)
    setResult(null)
    setError('')
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await api.post('/sightings/import/ebird', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResult(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Import failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <p style={{ margin: '0 0 1.25rem', color: 'var(--bd-ink-mute)', fontSize: '0.875rem' }}>
        Export your eBird data from ebird.org/downloadMyData, then upload the CSV here.
      </p>
      <label style={labelStyle}>CSV file</label>
      <input
        ref={fileRef}
        type="file"
        accept=".csv"
        style={fileInputStyle}
        disabled={loading}
      />
      <button
        onClick={handleImport}
        disabled={loading}
        style={btnStyle(loading)}
      >
        {loading && <Spinner />}
        {loading ? 'Importing…' : 'Import from eBird'}
      </button>
      <ErrorMsg message={error} />
      <ResultBlock result={result} />
    </div>
  )
}

// ── Bulk CSV tab ──────────────────────────────────────────────────────────────

function BulkTab() {
  const fileRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  async function handleImport() {
    const file = fileRef.current?.files?.[0]
    if (!file) return
    setLoading(true)
    setResult(null)
    setError('')
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await api.post('/sightings/import/bulk', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResult(res.data)
    } catch (err) {
      if (err.response?.status === 403) {
        setError("You don't have permission for bulk import.")
      } else {
        setError(err.response?.data?.detail || 'Import failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <p style={{ margin: '0 0 1rem', color: 'var(--bd-ink-mute)', fontSize: '0.875rem' }}>
        Trusted users only. CSV columns: date, species_name, lat, lng, place_name, notes
      </p>
      <pre
        style={{
          margin: '0 0 1.25rem',
          padding: '0.75rem 1rem',
          background: 'var(--bd-bg)',
          border: '1px solid var(--bd-rule)',
          borderRadius: '6px',
          fontFamily: 'ui-monospace, monospace',
          fontSize: '0.75rem',
          color: 'var(--bd-ink-mute)',
          overflowX: 'auto',
          lineHeight: 1.6,
          whiteSpace: 'pre',
        }}
      >
        {BULK_TEMPLATE}
      </pre>
      <label style={labelStyle}>CSV file</label>
      <input
        ref={fileRef}
        type="file"
        accept=".csv"
        style={fileInputStyle}
        disabled={loading}
      />
      <button
        onClick={handleImport}
        disabled={loading}
        style={btnStyle(loading)}
      >
        {loading && <Spinner />}
        {loading ? 'Importing…' : 'Import'}
      </button>
      <ErrorMsg message={error} />
      <ResultBlock result={result} />
    </div>
  )
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const labelStyle = {
  display: 'block',
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: 'var(--bd-ink-soft)',
  marginBottom: '0.375rem',
  letterSpacing: '0.01em',
}

const inputStyle = {
  display: 'block',
  width: '100%',
  padding: '0.55rem 0.75rem',
  border: '1px solid var(--bd-rule)',
  borderRadius: '8px',
  background: 'var(--bd-bg)',
  color: 'var(--bd-ink)',
  fontSize: '0.9rem',
  marginBottom: '0.875rem',
  boxSizing: 'border-box',
  outline: 'none',
}

const fileInputStyle = {
  display: 'block',
  marginBottom: '0.875rem',
  fontSize: '0.875rem',
  color: 'var(--bd-ink-mute)',
}

function btnStyle(disabled) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.55rem 1.25rem',
    borderRadius: '999px',
    border: 'none',
    background: disabled ? 'var(--bd-rule)' : 'var(--bd-moss)',
    color: disabled ? 'var(--bd-ink-mute)' : '#fff',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'background 0.15s',
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Import() {
  const [activeTab, setActiveTab] = useState('inat')

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '2rem 1rem' }}>
        <h1
          style={{
            margin: '0 0 0.25rem',
            fontSize: '1.375rem',
            fontWeight: 700,
            color: 'var(--bd-ink)',
          }}
        >
          Import sightings
        </h1>
        <p
          style={{
            margin: '0 0 1.75rem',
            fontSize: '0.875rem',
            color: 'var(--bd-ink-mute)',
          }}
        >
          Bring in sightings from external sources.
        </p>

        {/* Tab pills */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
          }}
        >
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.4rem 1rem',
                borderRadius: '999px',
                border: activeTab === tab.id
                  ? '1.5px solid var(--bd-moss)'
                  : '1px solid var(--bd-rule)',
                background: activeTab === tab.id ? 'var(--bd-moss)' : 'var(--bd-card)',
                color: activeTab === tab.id ? '#fff' : 'var(--bd-ink)',
                fontSize: '0.875rem',
                fontWeight: activeTab === tab.id ? 600 : 400,
                cursor: 'pointer',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div
          style={{
            background: 'var(--bd-card)',
            border: '1px solid var(--bd-rule-soft)',
            borderRadius: '12px',
            padding: '1.5rem',
          }}
        >
          {activeTab === 'inat' && <InatTab />}
          {activeTab === 'ebird' && <EbirdTab />}
          {activeTab === 'bulk' && <BulkTab />}
        </div>
      </div>
    </>
  )
}
