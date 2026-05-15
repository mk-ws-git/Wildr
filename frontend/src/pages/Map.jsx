import { useEffect, useRef, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import MapPanel from '../components/MapPanel'
import LocationSearch from '../components/LocationSearch'
import {
  fetchNearbyGreenspaces,
  fetchNearbyWaterBodies,
  fetchGreenspaceSummary,
  fetchWaterBodySummary,
  createLocation,
} from '../api/map'
import api from '../api/client'
import useAuthStore from '../store/authStore'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

const BERLIN_DEFAULT = { lat: 52.52, lng: 13.405 }
const FETCH_RADIUS = 2000
const REFETCH_THRESHOLD = 500

function distanceMetres(a, b) {
  const R = 6371000
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

function markerElement(color, label) {
  const el = document.createElement('div')
  el.className = 'rounded-full border-2 border-white shadow-lg'
  el.style.width = '16px'
  el.style.height = '16px'
  el.style.backgroundColor = color
  el.style.boxSizing = 'border-box'
  el.title = label
  return el
}

export default function Map() {
  const user = useAuthStore((state) => state.user)
  const mapContainer = useRef(null)
  const map = useRef(null)
  const lastFetchPos = useRef(null)
  const markersRef = useRef([])

  const [userPos, setUserPos] = useState(null)
  const [selected, setSelected] = useState(null)
  const [summary, setSummary] = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [visitLoading, setVisitLoading] = useState(false)
  const [selectedSaved, setSelectedSaved] = useState(false)
  const [selectedVisited, setSelectedVisited] = useState(false)
  const [error, setError] = useState(null)
  const [sightings, setSightings] = useState([])
  const [savedLocations, setSavedLocations] = useState([])
  const [showCommunitySightings, setShowCommunitySightings] = useState(true)
  const [showPersonalSightings, setShowPersonalSightings] = useState(true)
  const [showSavedPlaces, setShowSavedPlaces] = useState(true)
  const [showOthers, setShowOthers] = useState(true)

  const loadPins = useCallback(async (lat, lng) => {
    if (
      lastFetchPos.current &&
      distanceMetres(lastFetchPos.current, { lat, lng }) < REFETCH_THRESHOLD
    ) return

    lastFetchPos.current = { lat, lng }

    try {
      const [greenspaces, waterBodies] = await Promise.all([
        fetchNearbyGreenspaces(lat, lng, FETCH_RADIUS),
        fetchNearbyWaterBodies(lat, lng, FETCH_RADIUS),
      ])

      const toFeature = (item, kind) => ({
        type: 'Feature',
        geometry: item.geojson ? JSON.parse(item.geojson) : {
          type: 'Point',
          coordinates: [item.lng, item.lat],
        },
        properties: { ...item, kind },
      })

      const gsCollection = {
        type: 'FeatureCollection',
        features: greenspaces.map(g => toFeature(g, 'greenspace')),
      }
      const wbCollection = {
        type: 'FeatureCollection',
        features: waterBodies.map(w => toFeature(w, 'water')),
      }

      const m = map.current
      if (!m) return

      if (m.getSource('wildr-greenspaces')) {
        m.getSource('wildr-greenspaces').setData(gsCollection)
      } else {
        m.addSource('wildr-greenspaces', { type: 'geojson', data: gsCollection })
        m.addLayer({
          id: 'wildr-greenspaces-fill',
          type: 'fill',
          source: 'wildr-greenspaces',
          paint: { 'fill-color': '#16a34a', 'fill-opacity': 0.25 },
        })
        m.addLayer({
          id: 'wildr-greenspaces-outline',
          type: 'line',
          source: 'wildr-greenspaces',
          paint: { 'line-color': '#16a34a', 'line-width': 1.5, 'line-opacity': 0.7 },
        })
        m.on('click', 'wildr-greenspaces-fill', e => {
          const props = e.features[0].properties
          setSelected({ ...props, kind: 'greenspace' })
          setSummary(null)
        })
        m.on('mouseenter', 'wildr-greenspaces-fill', () => { m.getCanvas().style.cursor = 'pointer' })
        m.on('mouseleave', 'wildr-greenspaces-fill', () => { m.getCanvas().style.cursor = '' })
      }

      if (m.getSource('wildr-water')) {
        m.getSource('wildr-water').setData(wbCollection)
      } else {
        m.addSource('wildr-water', { type: 'geojson', data: wbCollection })
        m.addLayer({
          id: 'wildr-water-fill',
          type: 'fill',
          source: 'wildr-water',
          paint: {
            'fill-color': ['case', ['get', 'is_swimming_spot'], '#0d9488', '#2563eb'],
            'fill-opacity': 0.3,
          },
        })
        m.addLayer({
          id: 'wildr-water-outline',
          type: 'line',
          source: 'wildr-water',
          paint: {
            'line-color': ['case', ['get', 'is_swimming_spot'], '#0d9488', '#2563eb'],
            'line-width': 1.5,
            'line-opacity': 0.8,
          },
        })
        m.on('click', 'wildr-water-fill', e => {
          const props = e.features[0].properties
          setSelected({ ...props, kind: 'water' })
          setSummary(null)
        })
        m.on('mouseenter', 'wildr-water-fill', () => { m.getCanvas().style.cursor = 'pointer' })
        m.on('mouseleave', 'wildr-water-fill', () => { m.getCanvas().style.cursor = '' })
      }
    } catch (err) {
      lastFetchPos.current = null
    }
  }, [])

  const handleLocationSelect = useCallback(({ lng, lat }) => {
    map.current?.flyTo({ center: [lng, lat], zoom: 14 })
    lastFetchPos.current = null
    loadPins(lat, lng)
  }, [loadPins])

  useEffect(() => {
    if (map.current) return

    const initLat = user?.location_lat ?? BERLIN_DEFAULT.lat
    const initLng = user?.location_lng ?? BERLIN_DEFAULT.lng

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [initLng, initLat],
      zoom: 13,
    })

    map.current.on('style.load', () => {
      const tryPaint = (id, prop, val) => {
        if (map.current.getLayer(id)) map.current.setPaintProperty(id, prop, val)
      }
      tryPaint('water', 'fill-color', 'hsl(196, 42%, 74%)')
      tryPaint('waterway', 'line-color', 'hsl(196, 38%, 68%)')
      tryPaint('national-park', 'fill-color', 'hsl(122, 22%, 80%)')
      tryPaint('landuse', 'fill-color', 'hsl(122, 22%, 80%)')
      tryPaint('building', 'fill-color', 'hsl(80, 4%, 91%)')
      tryPaint('building', 'fill-outline-color', 'hsl(80, 4%, 86%)')
      tryPaint('waterway-label', 'text-color', 'hsl(196, 45%, 38%)')
      tryPaint('water-line-label', 'text-color', 'hsl(196, 45%, 38%)')
      tryPaint('water-point-label', 'text-color', 'hsl(196, 45%, 38%)')
      tryPaint('natural-point-label', 'text-color', 'hsl(122, 28%, 38%)')
      tryPaint('natural-line-label', 'text-color', 'hsl(122, 28%, 38%)')
      ;['natural-point-label', 'natural-line-label', 'poi-label'].forEach(id => {
        if (map.current.getLayer(id)) {
          map.current.setLayoutProperty(id, 'visibility', 'none')
        }
      })

      const storedLat = user?.location_lat
      const storedLng = user?.location_lng

      if (storedLat && storedLng) {
        loadPins(storedLat, storedLng)
      }

      navigator.geolocation?.getCurrentPosition(
        ({ coords }) => {
          const { latitude: lat, longitude: lng } = coords
          setUserPos({ lat, lng })
          map.current.flyTo({ center: [lng, lat], zoom: 14 })
          loadPins(lat, lng)
        },
        () => {
          if (!storedLat) {
            loadPins(BERLIN_DEFAULT.lat, BERLIN_DEFAULT.lng)
          }
        }
      )
    })

    map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right')
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true,
      }),
      'bottom-right'
    )

    map.current.on('moveend', () => {
      const c = map.current.getCenter()
      loadPins(c.lat, c.lng)
    })
  }, [loadPins])

  useEffect(() => {
    if (!selected) {
      setSummary(null)
      setSelectedSaved(false)
      return
    }

    const match = savedLocations.find((location) =>
      selected.lat != null && selected.lng != null &&
      location.lat != null && location.lng != null &&
      Math.abs(location.lat - selected.lat) < 0.0001 &&
      Math.abs(location.lng - selected.lng) < 0.0001
    )
    setSelectedSaved(!!match)
    setSelectedVisited(!!match?.visited)

    setSummaryLoading(true)
    setSummary(null)

    const fetchSummary = async () => {
      try {
        if (selected.kind === 'greenspace') {
          const data = await fetchGreenspaceSummary(selected.id)
          setSummary(data)
        } else if (selected.kind === 'water') {
          const data = await fetchWaterBodySummary(selected.id)
          setSummary(data)
        }
      } catch {
        setSummary(null)
      } finally {
        setSummaryLoading(false)
      }
    }

    fetchSummary()
  }, [selected, savedLocations])

  const ensureSelectedSaved = useCallback(async () => {
    const existing = savedLocations.find((l) =>
      l.lat != null && l.lng != null &&
      Math.abs(l.lat - selected.lat) < 0.0001 &&
      Math.abs(l.lng - selected.lng) < 0.0001
    )
    if (existing) return existing
    const name = selected.name || (selected.kind === 'water' ? 'Water location' : 'Greenspace')
    const type = selected.kind === 'water'
      ? selected.water_subtype || selected.type || 'water'
      : selected.type || 'greenspace'
    const location = await createLocation({ name, type, lat: selected.lat, lng: selected.lng })
    setSavedLocations((prev) => [location, ...prev])
    setSelectedSaved(true)
    return location
  }, [selected, savedLocations])

  const handleSaveSelected = useCallback(async () => {
    if (!selected || !selected.lat || !selected.lng) return
    setSaveLoading(true)
    try {
      await ensureSelectedSaved()
      setSelectedSaved(true)
    } catch (err) {
      console.error(err)
    } finally {
      setSaveLoading(false)
    }
  }, [selected, ensureSelectedSaved])

  const handleMarkVisited = useCallback(async () => {
    if (!selected || !selected.lat || !selected.lng) return
    setVisitLoading(true)
    try {
      const location = await ensureSelectedSaved()
      await api.post(`/locations/${location.id}/visit`)
      setSavedLocations((prev) =>
        prev.map((l) => l.id === location.id ? { ...l, visited: true } : l)
      )
      setSelectedSaved(true)
      setSelectedVisited(true)
    } catch (err) {
      console.error(err)
    } finally {
      setVisitLoading(false)
    }
  }, [selected, ensureSelectedSaved])

  useEffect(() => {
    if (!user) return

    Promise.all([
      api.get('/sightings/me').then((res) => res.data).catch(() => []),
      api.get('/locations/saved').then((res) => res.data).catch(() => []),
    ])
      .then(([sightingsData, savedData]) => {
        setSightings(sightingsData)
        setSavedLocations(savedData)
      })
  }, [user])

  useEffect(() => {
    if (!map.current || !map.current.loaded()) return

    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []

    if (showSavedPlaces) {
      savedLocations
        .filter((location) => location.lat != null && location.lng != null)
        .forEach((location) => {
          const marker = new mapboxgl.Marker(markerElement('var(--bd-moss)', location.name || 'Saved place'))
            .setLngLat([location.lng, location.lat])
            .setPopup(
              new mapboxgl.Popup({ offset: 12 }).setText(`Saved place: ${location.name}`)
            )
            .addTo(map.current)
          markersRef.current.push(marker)
        })
    }

    if (showPersonalSightings) {
      sightings
        .filter((sighting) => sighting.lat != null && sighting.lng != null)
        .forEach((sighting) => {
          const name = sighting.common_name || 'Sighting'
          const subtitle = sighting.place_name || new Date(sighting.identified_at).toLocaleDateString()
          const marker = new mapboxgl.Marker(markerElement('var(--bd-terra)', name))
            .setLngLat([sighting.lng, sighting.lat])
            .setPopup(new mapboxgl.Popup({ offset: 12 }).setText(`${name} · ${subtitle}`))
            .addTo(map.current)
          markersRef.current.push(marker)
        })
    }

    // TODO: Add community sightings when API available
  }, [savedLocations, sightings, showCommunitySightings, showPersonalSightings, showSavedPlaces, showOthers])

  return (
    <div className="relative w-full" style={{ height: 'calc(100vh - 48px)', backgroundColor: 'var(--bd-bg)' }}>
      <LocationSearch onSelect={handleLocationSelect} />
      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm shadow">
          {error}
        </div>
      )}

      <div className="absolute top-4 left-4 z-10 rounded-2xl shadow-sm overflow-hidden" style={{ backgroundColor: 'rgba(247,244,237,0.92)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
        <div className="p-4">
          <div className="flex gap-2 overflow-x-auto">
            {[
              { label: 'Community', state: showCommunitySightings, setter: setShowCommunitySightings },
              { label: 'Personal', state: showPersonalSightings, setter: setShowPersonalSightings },
              { label: 'Saved places', state: showSavedPlaces, setter: setShowSavedPlaces },
              { label: 'Others', state: showOthers, setter: setShowOthers },
            ].map((toggle) => (
              <button
                key={toggle.label}
                onClick={() => toggle.setter(!toggle.state)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition"
                style={{
                  backgroundColor: toggle.state ? 'var(--bd-moss-deep)' : 'var(--bd-bg-soft)',
                  color: toggle.state ? '#f6f3ea' : 'var(--bd-ink)',
                  border: `1px solid ${toggle.state ? 'var(--bd-moss-deep)' : 'var(--bd-rule)'}`
                }}
              >
                {toggle.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-24 left-3 z-10 rounded-2xl shadow-sm p-3" style={{ backgroundColor: 'var(--bd-card)', border: '1px solid var(--bd-rule)' }}>
        <div className="space-y-2">
          {[
            { color: 'var(--bd-moss)', label: 'Saved places' },
            { color: 'var(--bd-terra)', label: 'Personal' },
            { color: '#16a34a', label: 'Greenspace' },
            { color: '#2563eb', label: 'Water' },
            { color: '#0d9488', label: 'Swimming' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2 text-xs" style={{ color: 'var(--bd-ink-soft)' }}>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
              {label}
            </div>
          ))}
        </div>
      </div>

      <div ref={mapContainer} className="w-full h-full" />

      <MapPanel
        selected={selected}
        summary={summary}
        loading={summaryLoading}
        onClose={() => { setSelected(null); setSummary(null) }}
        onSave={handleSaveSelected}
        onVisit={handleMarkVisited}
        saved={selectedSaved}
        visited={selectedVisited}
        saveLoading={saveLoading}
        visitLoading={visitLoading}
      />
    </div>
  )
}
