import { useState, useRef, useCallback } from 'react'

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

export default function LocationSearch({ onSelect }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const debounceRef = useRef(null)

  const search = useCallback((value) => {
    clearTimeout(debounceRef.current)
    if (!value.trim()) { setResults([]); setOpen(false); return }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(value)}.json` +
          `?access_token=${TOKEN}&limit=5&types=place,locality,neighborhood,address,poi`
        )
        const data = await res.json()
        setResults(data.features || [])
        setOpen(true)
      } catch { setResults([]) }
    }, 300)
  }, [])

  const handleChange = (e) => {
    setQuery(e.target.value)
    search(e.target.value)
  }

  const handleSelect = (feature) => {
    const [lng, lat] = feature.center
    onSelect({ lng, lat, name: feature.place_name })
    setQuery(feature.place_name)
    setResults([])
    setOpen(false)
  }

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 w-72 sm:w-96">
      <input
        type="text"
        value={query}
        onChange={handleChange}
        onFocus={() => results.length && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Search location..."
        className="w-full px-4 py-2 rounded-full bg-white shadow-md text-sm text-gray-700 placeholder-gray-400 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
      />
      {open && results.length > 0 && (
        <ul className="mt-1 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden text-sm">
          {results.map((f) => (
            <li
              key={f.id}
              onMouseDown={() => handleSelect(f)}
              className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer text-gray-700 truncate"
            >
              <span className="font-medium">{f.text}</span>
              <span className="text-gray-400 ml-1.5 text-xs">{f.place_name.split(', ').slice(1).join(', ')}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
