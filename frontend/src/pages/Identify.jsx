import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import { useToast } from '../components/Toast'

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
      className="w-full rounded-2xl px-3 py-2.5 text-sm"
      style={{
        backgroundColor: 'var(--bd-card)',
        border: '1px solid var(--bd-rule)',
        color: 'var(--bd-ink)',
      }}
    >
      <option value="">No saved location</option>
      {locations.map((l) => (
        <option key={l.id} value={l.id}>{l.name}</option>
      ))}
    </select>
  )
}

// ── Full-screen editorial result ───────────────────────────────────────────

function ResultCard({ result, onReset }) {
  const { species, score, uncertain, suggestions, show_endangered_banner, first_sighting, new_badges, photo_url } = result
  const showToast = useToast()
  const toastedBadges = useRef(false)

  useEffect(() => {
    if (!toastedBadges.current && new_badges?.length > 0) {
      toastedBadges.current = true
      new_badges.forEach((name, i) => {
        setTimeout(() => showToast(`Badge unlocked: ${name}`), i * 700)
      })
    }
  }, [new_badges, showToast])

  return (
    <div
      className="relative overflow-hidden"
      style={{ borderRadius: '24px', minHeight: '72vh' }}
    >
      {/* Full background */}
      {photo_url ? (
        <img
          src={photo_url}
          alt={species.common_name}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, var(--bd-moss-deep), var(--bd-moss))' }}
        />
      )}

      {/* Gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.35) 45%, rgba(0,0,0,0.10) 70%)',
        }}
      />

      {/* Top notifications */}
      <div className="absolute top-4 left-4 right-4 flex flex-col gap-2 z-10">
        {first_sighting && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-2xl text-sm text-white"
            style={{ background: 'rgba(44,110,90,0.55)', backdropFilter: 'blur(12px)' }}
          >
            ✓ First sighting — added to your life list
          </div>
        )}
        {show_endangered_banner && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-2xl text-sm"
            style={{ background: 'rgba(220,38,38,0.35)', backdropFilter: 'blur(12px)', color: '#fecaca' }}
          >
            ⚠ {species.conservation_status?.replace(/_/g, ' ')}
          </div>
        )}
      </div>

      {/* Bottom: species info + CTA */}
      <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
        {/* Confidence chip */}
        <div
          className="inline-flex items-center gap-1 mb-3 px-3 py-1 rounded-full text-xs font-semibold"
          style={{ background: 'rgba(255,255,255,0.16)', backdropFilter: 'blur(8px)', color: 'rgba(255,255,255,0.85)' }}
        >
          {Math.round(score * 100)}% match
        </div>

        {/* Species name */}
        <Link to={`/species/${species.id}`} style={{ textDecoration: 'none' }}>
          <h2
            className="text-4xl font-bold text-white leading-tight mb-1 hover:underline underline-offset-4"
            style={{ letterSpacing: '-0.01em' }}
          >
            {species.common_name}
          </h2>
        </Link>
        <p className="text-sm italic mb-4" style={{ color: 'rgba(255,255,255,0.60)' }}>
          {species.scientific_name}
        </p>

        {/* Fun fact */}
        {species.fun_fact && (
          <p className="text-sm leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.78)' }}>
            {species.fun_fact}
          </p>
        )}

        {/* Alternative suggestions */}
        {uncertain && suggestions?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-xs self-center" style={{ color: 'rgba(255,255,255,0.50)' }}>
              Could also be:
            </span>
            {suggestions.map((s) => (
              <span
                key={s.scientific_name}
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.80)' }}
              >
                {s.common_name} · {Math.round(s.score * 100)}%
              </span>
            ))}
          </div>
        )}

        <button
          onClick={onReset}
          className="w-full py-3.5 rounded-2xl font-semibold text-sm text-white transition hover:brightness-110"
          style={{
            background: 'rgba(255,255,255,0.18)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.28)',
          }}
        >
          Identify another
        </button>
      </div>
    </div>
  )
}

// ── Photo tab ──────────────────────────────────────────────────────────────

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
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      })
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
    canvas.toBlob(
      (blob) => {
        setImageBlob(blob)
        setPreviewUrl(URL.createObjectURL(blob))
        stopCamera()
        setMode('preview')
      },
      'image/jpeg',
      0.92
    )
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
        <div
          className="grid grid-cols-2 gap-3"
          style={{ paddingTop: '8px' }}
        >
          <button
            onClick={startCamera}
            className="flex flex-col items-center gap-3 py-12 rounded-3xl transition-colors hover:brightness-95"
            style={{ backgroundColor: 'var(--bd-card)', border: '1px solid var(--bd-rule)', color: 'var(--bd-ink-soft)' }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--bd-moss)' }}>
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
              <circle cx="12" cy="13" r="3"/>
            </svg>
            <span className="text-sm font-medium">Use camera</span>
          </button>
          <label
            className="flex flex-col items-center gap-3 py-12 rounded-3xl transition-colors hover:brightness-95 cursor-pointer"
            style={{ backgroundColor: 'var(--bd-card)', border: '1px solid var(--bd-rule)', color: 'var(--bd-ink-soft)' }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--bd-moss)' }}>
              <path d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"/>
            </svg>
            <span className="text-sm font-medium">Upload photo</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </label>
        </div>
      )}

      {mode === 'camera' && (
        <div
          className="relative overflow-hidden bg-black"
          style={{ borderRadius: '24px', height: 'min(70vh, 560px)' }}
        >
          <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
          <canvas ref={canvasRef} className="hidden" />

          {/* Cancel */}
          <button
            onClick={() => { stopCamera(); setMode(null) }}
            className="absolute top-4 right-4 text-white text-sm font-medium"
            style={{ background: 'rgba(0,0,0,0.40)', backdropFilter: 'blur(8px)', padding: '7px 16px', borderRadius: '999px' }}
          >
            Cancel
          </button>

          {/* Shutter */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
            <button
              onClick={capture}
              className="rounded-full bg-white shadow-xl transition active:scale-95"
              style={{ width: '72px', height: '72px', border: '4px solid rgba(255,255,255,0.45)', outline: '2px solid rgba(255,255,255,0.25)', outlineOffset: '4px' }}
            />
          </div>
        </div>
      )}

      {mode === 'preview' && previewUrl && (
        <div className="space-y-3">
          <div
            className="relative overflow-hidden"
            style={{ borderRadius: '24px', height: 'min(55vh, 460px)' }}
          >
            <img src={previewUrl} alt="preview" className="absolute inset-0 w-full h-full object-cover" />
            {/* Dark gradient at bottom for inputs */}
            <div
              className="absolute inset-x-0 bottom-0 h-24"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)' }}
            />
            <button
              onClick={reset}
              className="absolute top-4 right-4 text-white text-sm font-medium"
              style={{ background: 'rgba(0,0,0,0.40)', backdropFilter: 'blur(8px)', padding: '7px 16px', borderRadius: '999px' }}
            >
              Retake
            </button>
          </div>
          <LocationPicker locationId={locationId} setLocationId={setLocationId} />
          <input
            type="text"
            value={placeName}
            onChange={(e) => setPlaceName(e.target.value)}
            placeholder="Place nickname — e.g. Back garden"
            className="w-full rounded-2xl px-3 py-2.5 text-sm"
            style={{ backgroundColor: 'var(--bd-card)', border: '1px solid var(--bd-rule)', color: 'var(--bd-ink)' }}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            onClick={submit}
            disabled={loading}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white disabled:opacity-50 transition"
            style={{ backgroundColor: 'var(--bd-moss)' }}
          >
            {loading ? 'Identifying…' : 'Identify species'}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Audio tab ──────────────────────────────────────────────────────────────

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
      <div className="space-y-4 pt-8 text-center">
        <p className="text-sm" style={{ color: 'var(--bd-ink-soft)' }}>{result.message}</p>
        <button
          onClick={reset}
          className="w-full py-3 rounded-2xl text-sm font-semibold text-white"
          style={{ backgroundColor: 'var(--bd-moss)' }}
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-5 pt-6">
      {/* Big mic button */}
      <div className="flex flex-col items-center gap-3">
        {phase === 'idle' && (
          <>
            <button
              onClick={startRecording}
              className="w-24 h-24 rounded-full flex items-center justify-center shadow-lg transition active:scale-95"
              style={{ backgroundColor: 'var(--bd-moss)' }}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="white">
                <path d="M12 1a4 4 0 0 1 4 4v7a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4Zm0 14a5 5 0 0 0 5-5V5a5 5 0 1 0-10 0v5a5 5 0 0 0 5 5Zm-1.5 1.93A7.001 7.001 0 0 1 5 11a1 1 0 1 0-2 0 9.001 9.001 0 0 0 7.5 8.938V22H9a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-1.5v-2.062A9.001 9.001 0 0 0 21 11a1 1 0 1 0-2 0 7.001 7.001 0 0 1-5.5 6.93v.07h-3v-.07Z"/>
              </svg>
            </button>
            <p className="text-sm font-medium" style={{ color: 'var(--bd-ink-soft)' }}>Tap to start listening</p>
          </>
        )}
        {phase === 'recording' && (
          <>
            <button
              onClick={stopRecording}
              className="w-24 h-24 rounded-full flex items-center justify-center shadow-lg"
              style={{ backgroundColor: '#ef4444', animation: 'pulse 1.5s ease-in-out infinite' }}
            >
              <span className="w-7 h-7 rounded bg-white block" />
            </button>
            <p className="text-sm font-medium" style={{ color: 'var(--bd-ink-soft)' }}>
              Listening… tap to stop
            </p>
          </>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Live detections */}
      {detections.length > 0 && (
        <div className="w-full space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest px-1" style={{ color: 'var(--bd-ink-mute)' }}>
            {phase === 'recording' ? 'Detected so far' : 'Detected'}
          </p>
          {detections.map((d) => (
            <div
              key={d.scientific_name}
              className="flex items-center justify-between rounded-2xl px-4 py-3"
              style={{ backgroundColor: 'var(--bd-card)', border: '1px solid var(--bd-rule)' }}
            >
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--bd-ink)' }}>{d.common_name}</p>
                <p className="text-xs italic" style={{ color: 'var(--bd-ink-mute)' }}>{d.scientific_name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold" style={{ color: 'var(--bd-moss)' }}>{Math.round(d.confidence * 100)}%</p>
                <div className="w-16 h-1 rounded-full mt-1" style={{ backgroundColor: 'var(--bd-rule)' }}>
                  <div
                    className="h-1 rounded-full"
                    style={{ width: `${Math.round(d.confidence * 100)}%`, backgroundColor: 'var(--bd-moss)' }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {phase === 'review' && detections.length > 0 && (
        <div className="w-full space-y-3">
          <LocationPicker locationId={locationId} setLocationId={setLocationId} />
          <input
            type="text"
            value={placeName}
            onChange={(e) => setPlaceName(e.target.value)}
            placeholder="Place nickname — e.g. Back garden"
            className="w-full rounded-2xl px-3 py-2.5 text-sm"
            style={{ backgroundColor: 'var(--bd-card)', border: '1px solid var(--bd-rule)', color: 'var(--bd-ink)' }}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            onClick={saveTop}
            disabled={saving}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white disabled:opacity-50"
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
        <div className="w-full space-y-3 text-center pt-2">
          <p className="text-sm" style={{ color: 'var(--bd-ink-soft)' }}>
            No birds detected. Try a longer recording in a quieter spot.
          </p>
          <button
            onClick={reset}
            className="w-full py-3 rounded-2xl text-sm font-medium"
            style={{ backgroundColor: 'var(--bd-card)', border: '1px solid var(--bd-rule)', color: 'var(--bd-ink)' }}
          >
            Record again
          </button>
        </div>
      )}
    </div>
  )
}

// ── Page shell ─────────────────────────────────────────────────────────────

export default function Identify() {
  const [tab, setTab] = useState('photo')
  const coords = useGPS()

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)' }}>
      {/* Header + tab switcher */}
      <div className="flex items-center justify-between px-4 pt-6 pb-4">
        <h1 className="text-xl font-bold" style={{ color: 'var(--bd-ink)' }}>Identify</h1>
        <div
          className="flex p-1 rounded-full gap-1"
          style={{ backgroundColor: 'var(--bd-card)', border: '1px solid var(--bd-rule)' }}
        >
          {['photo', 'audio'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-4 py-1.5 rounded-full text-sm font-semibold transition"
              style={
                tab === t
                  ? { backgroundColor: 'var(--bd-ink)', color: '#fff' }
                  : { backgroundColor: 'transparent', color: 'var(--bd-ink-soft)' }
              }
            >
              {t === 'photo' ? 'Photo' : 'Sound'}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-4 pb-8">
        {tab === 'photo' ? <PhotoTab coords={coords} /> : <AudioTab coords={coords} />}
      </div>
    </div>
  )
}
