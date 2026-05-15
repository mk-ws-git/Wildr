import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'

function useGPS() {
  const [coords, setCoords] = useState(null)
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (p) => setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {}
    )
  }, [])
  return coords
}

function LocationPicker({ locationId, setLocationId }) {
  const [locations, setLocations] = useState([])
  useEffect(() => {
    api.get('/locations').then(({ data }) => setLocations(data)).catch(() => {})
  }, [])
  return (
    <select
      value={locationId ?? ''}
      onChange={(e) => setLocationId(e.target.value ? Number(e.target.value) : null)}
      className="w-full border border-gray-200 rounded-2xl px-3 py-2 text-sm bg-white"
      style={{ color: 'var(--bd-ink)' }}
    >
      <option value="">No location selected</option>
      {locations.map((l) => (
        <option key={l.id} value={l.id}>{l.name}</option>
      ))}
    </select>
  )
}

function Banner({ type, children }) {
  const cls = {
    danger: 'bg-red-50 border-red-200 text-red-700',
    success: 'bg-green-50 border-green-200 text-green-700',
    info: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  }[type]
  return <div className={`rounded-2xl border px-4 py-2 text-sm ${cls}`}>{children}</div>
}

function ResultCard({ result, onReset }) {
  const { species, score, uncertain, suggestions, show_endangered_banner, first_sighting, new_badges, photo_url } = result
  return (
    <div className="space-y-3">
      {show_endangered_banner && (
        <Banner type="danger">This species is {species.conservation_status.replace(/_/g, ' ')}.</Banner>
      )}
      {first_sighting && (
        <Banner type="success">First sighting — added to your collection.</Banner>
      )}
      {new_badges?.length > 0 && (
        <Banner type="info">New badge{new_badges.length > 1 ? 's' : ''}: {new_badges.join(', ')}</Banner>
      )}
      <div className="rounded-3xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {photo_url && (
          <img src={photo_url} alt={species.common_name} className="w-full object-cover max-h-56" />
        )}
        <div className="p-5 space-y-2">
          <div className="flex items-baseline justify-between">
            <Link to={`/species/${species.id}`} style={{ textDecoration: 'none' }}>
              <h2 className="text-lg font-semibold hover:underline" style={{ color: 'var(--bd-ink)' }}>{species.common_name}</h2>
            </Link>
            <span className="text-xs" style={{ color: 'var(--bd-ink-mute)' }}>{Math.round(score * 100)}% match</span>
          </div>
          <p className="text-sm italic" style={{ color: 'var(--bd-ink-soft)' }}>{species.scientific_name}</p>
          {species.fun_fact && (
            <p className="text-sm pt-1" style={{ color: 'var(--bd-ink)' }}>{species.fun_fact}</p>
          )}
        </div>
      </div>
      {uncertain && suggestions?.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm space-y-1">
          <p className="font-medium" style={{ color: 'var(--bd-ink-soft)' }}>Could also be:</p>
          {suggestions.map((s) => (
            <div key={s.scientific_name} className="flex justify-between">
              <span style={{ color: 'var(--bd-ink)' }}>{s.common_name}</span>
              <span style={{ color: 'var(--bd-ink-mute)' }}>{Math.round(s.score * 100)}%</span>
            </div>
          ))}
        </div>
      )}
      <button
        onClick={onReset}
        className="w-full py-2.5 rounded-2xl text-sm font-medium text-white"
        style={{ backgroundColor: 'var(--bd-moss)' }}
      >
        Identify another
      </button>
    </div>
  )
}

// ── photo tab ─────────────────────────────────────────────────────────────

function PhotoTab({ coords }) {
  const [mode, setMode] = useState(null)
  const [imageBlob, setImageBlob] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [locationId, setLocationId] = useState(null)
  const [placeName, setPlaceName] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const canvasRef = useRef(null)

  const startCamera = async () => {
    setMode('camera')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch {
      setError('Camera access denied.')
      setMode(null)
    }
  }

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  const capture = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    canvas.toBlob((blob) => {
      setImageBlob(blob)
      setPreviewUrl(URL.createObjectURL(blob))
      stopCamera()
      setMode('preview')
    }, 'image/jpeg', 0.9)
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImageBlob(file)
    setPreviewUrl(URL.createObjectURL(file))
    setMode('preview')
  }

  const submit = async () => {
    setLoading(true)
    setError(null)
    const form = new FormData()
    form.append('photo', imageBlob, 'photo.jpg')
    if (coords) { form.append('lat', coords.lat); form.append('lng', coords.lng) }
    if (locationId) form.append('location_id', locationId)
    if (placeName.trim()) form.append('place_name', placeName.trim())
    try {
      const { data } = await api.post('/identify/photo', form)
      setResult(data)
    } catch (e) {
      setError(e.response?.data?.detail || 'Identification failed.')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    stopCamera()
    setMode(null); setImageBlob(null); setPreviewUrl(null)
    setResult(null); setError(null); setLocationId(null); setPlaceName('')
  }

  if (result) return <ResultCard result={result} onReset={reset} />

  return (
    <div className="space-y-4">
      {mode === null && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={startCamera}
            className="flex flex-col items-center gap-3 py-10 rounded-3xl border border-gray-200 bg-white shadow-sm text-sm hover:bg-gray-50 transition-colors"
            style={{ color: 'var(--bd-ink-soft)' }}
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ color: 'var(--bd-moss)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
            </svg>
            Use camera
          </button>
          <label
            className="flex flex-col items-center gap-3 py-10 rounded-3xl border border-gray-200 bg-white shadow-sm text-sm hover:bg-gray-50 transition-colors cursor-pointer"
            style={{ color: 'var(--bd-ink-soft)' }}
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ color: 'var(--bd-moss)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
            Upload photo
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </label>
        </div>
      )}

      {mode === 'camera' && (
        <div className="relative rounded-3xl overflow-hidden bg-black shadow-sm">
          <video ref={videoRef} autoPlay playsInline className="w-full" />
          <canvas ref={canvasRef} className="hidden" />
          <button
            onClick={capture}
            className="absolute bottom-5 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-white border-4 border-gray-300 shadow-md"
          />
          <button
            onClick={() => { stopCamera(); setMode(null) }}
            className="absolute top-3 right-3 text-white text-xs bg-black/50 rounded-xl px-2 py-1"
          >
            Cancel
          </button>
        </div>
      )}

      {mode === 'preview' && previewUrl && (
        <div className="space-y-3">
          <div className="relative rounded-3xl overflow-hidden shadow-sm">
            <img src={previewUrl} alt="preview" className="w-full object-cover max-h-64" />
            <button
              onClick={reset}
              className="absolute top-3 right-3 bg-black/50 text-white text-xs rounded-xl px-2 py-1"
            >
              Retake
            </button>
          </div>
          <LocationPicker locationId={locationId} setLocationId={setLocationId} />
          <input
            type="text"
            value={placeName}
            onChange={e => setPlaceName(e.target.value)}
            placeholder="Place nickname (optional) — e.g. Back garden"
            className="w-full border border-gray-200 rounded-2xl px-3 py-2 text-sm bg-white"
            style={{ color: 'var(--bd-ink)' }}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            onClick={submit}
            disabled={loading}
            className="w-full py-2.5 rounded-2xl text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: 'var(--bd-moss)' }}
          >
            {loading ? 'Identifying…' : 'Identify'}
          </button>
        </div>
      )}
    </div>
  )
}

// ── audio tab ─────────────────────────────────────────────────────────────

function AudioTab({ coords }) {
  const [phase, setPhase] = useState('idle')
  const [detections, setDetections] = useState([])
  const [locationId, setLocationId] = useState(null)
  const [placeName, setPlaceName] = useState('')
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const allChunksRef = useRef([])
  const intervalRef = useRef(null)
  const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'

  const mergeDetections = (prev, incoming) => {
    const map = new Map(prev.map((d) => [d.scientific_name, d]))
    for (const d of incoming) {
      const existing = map.get(d.scientific_name)
      if (!existing || d.confidence > existing.confidence) map.set(d.scientific_name, d)
    }
    return [...map.values()].sort((a, b) => b.confidence - a.confidence)
  }

  const analyzeChunk = async () => {
    if (chunksRef.current.length === 0) return
    const blob = new Blob(chunksRef.current, { type: mimeType })
    chunksRef.current = []
    const form = new FormData()
    form.append('audio', blob, 'chunk.webm')
    try {
      const { data } = await api.post('/identify/audio/analyze', form)
      if (data.detections?.length) setDetections((prev) => mergeDetections(prev, data.detections))
    } catch { /* silent */ }
  }

  const startRecording = async () => {
    setDetections([]); setError(null)
    chunksRef.current = []; allChunksRef.current = []
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
          allChunksRef.current.push(e.data)
        }
      }
      recorder.start(1000)
      intervalRef.current = setInterval(analyzeChunk, 4000)
      setPhase('recording')
    } catch {
      setError('Microphone access denied.')
    }
  }

  const stopRecording = () => {
    clearInterval(intervalRef.current)
    const recorder = mediaRecorderRef.current
    if (!recorder) return
    recorder.onstop = () => analyzeChunk()
    recorder.stop()
    recorder.stream.getTracks().forEach((t) => t.stop())
    setPhase('review')
  }

  const saveTop = async () => {
    if (!detections.length) return
    setSaving(true); setError(null)
    const blob = new Blob(allChunksRef.current, { type: mimeType })
    const form = new FormData()
    form.append('audio', blob, 'recording.webm')
    if (coords) { form.append('lat', coords.lat); form.append('lng', coords.lng) }
    if (locationId) form.append('location_id', locationId)
    if (placeName.trim()) form.append('place_name', placeName.trim())
    try {
      const { data } = await api.post('/identify/audio', form)
      setResult(data)
    } catch (e) {
      setError(e.response?.data?.detail || 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  const reset = () => {
    setPhase('idle'); setDetections([]); setResult(null)
    setError(null); setLocationId(null); setPlaceName('')
    chunksRef.current = []; allChunksRef.current = []
  }

  if (result && !result.no_result) {
    return <ResultCard result={{ ...result, score: result.detections?.[0]?.confidence ?? 1 }} onReset={reset} />
  }
  if (result?.no_result) {
    return (
      <div className="space-y-4">
        <p className="text-sm" style={{ color: 'var(--bd-ink-soft)' }}>{result.message}</p>
        <button onClick={reset} className="w-full py-2.5 rounded-2xl text-sm font-medium text-white" style={{ backgroundColor: 'var(--bd-moss)' }}>
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center gap-3 py-8">
        {phase === 'idle' && (
          <>
            <button
              onClick={startRecording}
              className="w-20 h-20 rounded-full flex items-center justify-center shadow-md transition-colors"
              style={{ backgroundColor: 'var(--bd-moss)' }}
            >
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1a4 4 0 0 1 4 4v7a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4Zm-1.5 15.93A7.001 7.001 0 0 1 5 11a1 1 0 1 0-2 0 9.001 9.001 0 0 0 7.5 8.938V22H9a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-1.5v-2.07A9.001 9.001 0 0 0 21 11a1 1 0 1 0-2 0 7.001 7.001 0 0 1-5.5 6.848v.082h-3v-.082Z" />
              </svg>
            </button>
            <p className="text-sm" style={{ color: 'var(--bd-ink-mute)' }}>Tap to start listening</p>
          </>
        )}
        {phase === 'recording' && (
          <>
            <button
              onClick={stopRecording}
              className="w-20 h-20 rounded-full flex items-center justify-center shadow-md animate-pulse bg-red-500"
            >
              <span className="w-6 h-6 rounded-sm bg-white" />
            </button>
            <p className="text-sm" style={{ color: 'var(--bd-ink-mute)' }}>Listening — tap to stop</p>
          </>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      {detections.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--bd-ink-mute)' }}>
            {phase === 'recording' ? 'Detected so far' : 'Detected'}
          </p>
          {detections.map((d) => (
            <div key={d.scientific_name} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--bd-ink)' }}>{d.common_name}</p>
                <p className="text-xs italic" style={{ color: 'var(--bd-ink-mute)' }}>{d.scientific_name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold" style={{ color: 'var(--bd-moss)' }}>{Math.round(d.confidence * 100)}%</p>
                <div className="w-16 h-1 rounded mt-1" style={{ backgroundColor: 'var(--bd-rule)' }}>
                  <div className="h-1 rounded" style={{ width: `${Math.round(d.confidence * 100)}%`, backgroundColor: 'var(--bd-moss)' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {phase === 'review' && detections.length > 0 && (
        <div className="space-y-3">
          <LocationPicker locationId={locationId} setLocationId={setLocationId} />
          <input
            type="text"
            value={placeName}
            onChange={e => setPlaceName(e.target.value)}
            placeholder="Place nickname (optional) — e.g. Back garden"
            className="w-full border border-gray-200 rounded-2xl px-3 py-2 text-sm bg-white"
            style={{ color: 'var(--bd-ink)' }}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            onClick={saveTop}
            disabled={saving}
            className="w-full py-2.5 rounded-2xl text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: 'var(--bd-moss)' }}
          >
            {saving ? 'Saving…' : `Save — ${detections[0].common_name}`}
          </button>
          <button onClick={reset} className="w-full py-2 text-sm" style={{ color: 'var(--bd-ink-soft)' }}>
            Discard &amp; record again
          </button>
        </div>
      )}

      {phase === 'review' && detections.length === 0 && (
        <div className="space-y-3 text-center">
          <p className="text-sm" style={{ color: 'var(--bd-ink-soft)' }}>No birds detected. Try a longer recording in a quieter spot.</p>
          <button onClick={reset} className="w-full py-2.5 rounded-2xl border border-gray-200 bg-white text-sm" style={{ color: 'var(--bd-ink)' }}>
            Record again
          </button>
        </div>
      )}
    </div>
  )
}

// ── page shell ────────────────────────────────────────────────────────────

export default function Identify() {
  const [tab, setTab] = useState('photo')
  const coords = useGPS()

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-5">
      <h1 className="text-xl font-semibold" style={{ color: 'var(--bd-ink)' }}>Identify</h1>
      <div className="flex border-b" style={{ borderColor: 'var(--bd-rule)' }}>
        {['photo', 'audio'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-2 text-sm font-medium border-b-2 transition-colors"
            style={tab === t
              ? { borderColor: 'var(--bd-moss)', color: 'var(--bd-moss-deep)' }
              : { borderColor: 'transparent', color: 'var(--bd-ink-mute)' }
            }
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      {tab === 'photo' ? <PhotoTab coords={coords} /> : <AudioTab coords={coords} />}
    </div>
  )
}
