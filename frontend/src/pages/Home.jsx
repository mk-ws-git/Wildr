import { useEffect, useState, useRef, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Link } from 'react-router-dom'
import api from '../api/client'
import useAuthStore from '../store/authStore'
import WeatherIcon from '../components/WeatherIcon'
import PineTrees from '../components/PineTrees'
import {
  fetchNearbyGreenspaces,
  fetchNearbyWaterBodies,
  createLocation,
} from '../api/map'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN
const DEFAULT_CENTER = { lat: 51.5074, lng: -0.1278 }
const FETCH_RADIUS = 2000
const REFETCH_THRESHOLD = 500

function formatCount(value) {
  return value.toLocaleString()
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning,'
  if (h < 18) return 'Good afternoon,'
  return 'Good evening,'
}

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
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

function createPopupElement(title, subtitle, saved, visited, onSave, onVisit) {
  const wrap = document.createElement('div')
  wrap.style.cssText = 'min-width:200px;font-family:Inter,system-ui,sans-serif;'

  // header
  const header = document.createElement('div')
  header.style.cssText = 'margin-bottom:10px;'
  const titleEl = document.createElement('div')
  titleEl.style.cssText = 'font-size:14px;font-weight:700;color:#1f261a;margin-bottom:3px;'
  titleEl.textContent = title
  header.appendChild(titleEl)
  if (subtitle) {
    const sub = document.createElement('div')
    sub.style.cssText = 'font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#5a6451;background:#efeadf;display:inline-block;padding:2px 8px;border-radius:999px;'
    sub.textContent = subtitle
    header.appendChild(sub)
  }
  wrap.appendChild(header)

  // visited badge
  if (visited) {
    const badge = document.createElement('div')
    badge.style.cssText = 'font-size:11px;font-weight:600;color:#3d4a32;background:rgba(90,110,74,0.12);padding:4px 10px;border-radius:999px;display:inline-block;margin-bottom:8px;'
    badge.textContent = 'Visited'
    wrap.appendChild(badge)
  }

  const btnBase = 'width:100%;padding:8px 12px;border-radius:999px;font-size:13px;font-weight:600;cursor:pointer;border:none;margin-top:6px;display:block;text-align:center;'

  // Mark as Visited button
  if (onVisit) {
    const visitBtn = document.createElement('button')
    visitBtn.type = 'button'
    visitBtn.textContent = visited ? 'Visited' : 'Mark as Visited'
    visitBtn.style.cssText = btnBase + (visited
      ? 'background:rgba(90,110,74,0.12);color:#3d4a32;cursor:default;'
      : 'background:#5a6e4a;color:#fff;')
    visitBtn.disabled = visited
    visitBtn.addEventListener('click', async () => {
      if (visitBtn.disabled) return
      visitBtn.disabled = true
      visitBtn.textContent = 'Saving…'
      try {
        await onVisit()
        visitBtn.textContent = 'Visited'
        visitBtn.style.background = 'rgba(90,110,74,0.12)'
        visitBtn.style.color = '#3d4a32'
      } catch {
        visitBtn.textContent = 'Try again'
        visitBtn.disabled = false
      }
    })
    wrap.appendChild(visitBtn)
  }

  // Want to Visit / Save button
  if (onSave) {
    const saveBtn = document.createElement('button')
    saveBtn.type = 'button'
    saveBtn.textContent = saved ? (visited ? 'Saved' : 'Want to Visit') : 'Want to Visit'
    saveBtn.style.cssText = btnBase + (saved
      ? 'background:#efeadf;color:#5a6451;cursor:default;border:1px solid rgba(31,38,26,0.1);'
      : 'background:white;color:#1f261a;border:1px solid rgba(31,38,26,0.15);')
    saveBtn.disabled = saved
    saveBtn.addEventListener('click', async () => {
      if (saveBtn.disabled) return
      saveBtn.disabled = true
      saveBtn.textContent = 'Saving…'
      try {
        await onSave()
        saveBtn.textContent = 'Want to Visit'
        saveBtn.style.background = '#efeadf'
        saveBtn.style.color = '#5a6451'
      } catch {
        saveBtn.textContent = 'Try again'
        saveBtn.disabled = false
      }
    })
    wrap.appendChild(saveBtn)
  }

  return wrap
}

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

function IconCameraSmall() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
      <circle cx="12" cy="13" r="3"/>
    </svg>
  )
}

function IconMicSmall() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3Z"/>
      <path d="M19 10a7 7 0 0 1-14 0"/>
      <path d="M12 19v4"/>
      <path d="M8 23h8"/>
    </svg>
  )
}

function IconTrophy() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3h8v4a4 4 0 0 1-4 4h0a4 4 0 0 1-4-4V3Z"/>
      <path d="M5 7H3a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2H5Z"/>
      <path d="M19 7h2a2 2 0 0 1-2 2h0a2 2 0 0 1-2-2h2Z"/>
      <path d="M8 15h8"/>
      <path d="M12 15v6"/>
    </svg>
  )
}

function IconStarSmall() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  )
}

function IconBirdSmall() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12c2-2 4-3 8-3s6 1 8 3c-1 1-2 1-4 1h-8c-2 0-3 0-4-1Z"/>
      <path d="M14 8c0 2-1 4-2 4s-2-2-2-4"/>
      <path d="M8 8l-2 2"/>
      <path d="M16 10l2-2"/>
    </svg>
  )
}

export default function Home() {
  const user = useAuthStore((state) => state.user)
  const [sightings, setSightings] = useState([])
  const [savedLocations, setSavedLocations] = useState([])
  const [badges, setBadges] = useState([])
  const [friendships, setFriendships] = useState([])
  const [friendProfiles, setFriendProfiles] = useState({})
  const [loading, setLoading] = useState(true)
  const [mapLoading, setMapLoading] = useState(true)
  const [weather, setWeather] = useState(null)
  const [heroPhoto, setHeroPhoto] = useState(null)
  const [noLocation, setNoLocation] = useState(false)
  const [showCommunitySightings, setShowCommunitySightings] = useState(true)
  const [showPersonalSightings, setShowPersonalSightings] = useState(true)
  const [showSavedPlaces, setShowSavedPlaces] = useState(true)
  const [showOthers, setShowOthers] = useState(false)
  const mapContainer = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const lastFetchPos = useRef(null)

  const isLocationSaved = useCallback(
    (feature) => {
      if (!feature || feature.lat == null || feature.lng == null) return false
      return savedLocations.some((location) => {
        return (
          location.lat != null &&
          location.lng != null &&
          Math.abs(location.lat - feature.lat) < 0.00005 &&
          Math.abs(location.lng - feature.lng) < 0.00005
        )
      })
    },
    [savedLocations]
  )

  const isLocationVisited = useCallback(
    (feature) => {
      if (!feature || feature.lat == null || feature.lng == null) return false
      return savedLocations.some((l) =>
        l.visited &&
        l.lat != null && l.lng != null &&
        Math.abs(l.lat - feature.lat) < 0.00005 &&
        Math.abs(l.lng - feature.lng) < 0.00005
      )
    },
    [savedLocations]
  )

  const ensureSaved = useCallback(
    async (feature) => {
      const existing = savedLocations.find((l) =>
        l.lat != null && l.lng != null &&
        Math.abs(l.lat - feature.lat) < 0.00005 &&
        Math.abs(l.lng - feature.lng) < 0.00005
      )
      if (existing) return existing
      const name = feature.name || (feature.kind === 'water' ? 'Water location' : 'Greenspace')
      const type = feature.kind === 'water'
        ? feature.water_subtype || feature.type || 'water'
        : feature.type || 'greenspace'
      const location = await createLocation({ name, type, lat: feature.lat, lng: feature.lng })
      setSavedLocations((prev) => [location, ...prev])
      return location
    },
    [createLocation, savedLocations]
  )

  const handleSavePlace = useCallback(
    async (feature) => {
      if (!feature || !feature.lat || !feature.lng) return
      await ensureSaved(feature)
    },
    [ensureSaved]
  )

  const handleMarkVisited = useCallback(
    async (feature) => {
      if (!feature || !feature.lat || !feature.lng) return
      const location = await ensureSaved(feature)
      await api.post(`/locations/${location.id}/visit`)
      setSavedLocations((prev) =>
        prev.map((l) => l.id === location.id ? { ...l, visited: true } : l)
      )
    },
    [ensureSaved]
  )

  const acceptedFriends = friendships.filter((item) => item.status === 'accepted')
  const incomingRequests = friendships.filter((item) => item.status === 'pending' && item.addressee_id === user?.id)
  const outgoingRequests = friendships.filter((item) => item.status === 'pending' && item.requester_id === user?.id)
  const visitedCount = savedLocations.filter((l) => l.visited).length
  const wantToVisitCount = savedLocations.filter((l) => !l.visited).length

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

      const m = mapRef.current
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
        m.on('click', 'wildr-greenspaces-fill', (e) => {
          const props = e.features[0].properties
          const saved = isLocationSaved(props)
          const visited = isLocationVisited(props)
          new mapboxgl.Popup({ offset: 12, maxWidth: '240px' })
            .setLngLat(e.lngLat)
            .setDOMContent(
              createPopupElement(
                props.name || 'Greenspace',
                props.type || 'Greenspace',
                saved,
                visited,
                async () => { await handleSavePlace(props) },
                async () => { await handleMarkVisited(props) }
              )
            )
            .addTo(m)
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
        m.on('click', 'wildr-water-fill', (e) => {
          const props = e.features[0].properties
          const label = props.is_swimming_spot ? 'Swimming spot' : (props.water_subtype || props.type || 'Water')
          const saved = isLocationSaved(props)
          const visited = isLocationVisited(props)
          new mapboxgl.Popup({ offset: 12, maxWidth: '240px' })
            .setLngLat(e.lngLat)
            .setDOMContent(
              createPopupElement(
                props.name || 'Water body',
                label,
                saved,
                visited,
                async () => { await handleSavePlace(props) },
                async () => { await handleMarkVisited(props) }
              )
            )
            .addTo(m)
        })
        m.on('mouseenter', 'wildr-water-fill', () => { m.getCanvas().style.cursor = 'pointer' })
        m.on('mouseleave', 'wildr-water-fill', () => { m.getCanvas().style.cursor = '' })
      }
    } catch (err) {
      lastFetchPos.current = null
    }
  }, [])

  useEffect(() => {
    if (!user) return

    setLoading(true)
    Promise.all([
      api.get('/sightings/me').then((res) => res.data).catch(() => []),
      api.get('/locations/saved').then((res) => res.data).catch(() => []),
      api.get('/badges/me').then((res) => res.data).catch(() => []),
      api.get('/friendships/me').then((res) => res.data).catch(() => []),
    ])
      .then(([sightingsData, savedData, badgesData, friendshipData]) => {
        setSightings(sightingsData)
        setSavedLocations(savedData)
        setBadges(badgesData)
        setFriendships(friendshipData)
      })
      .finally(() => setLoading(false))
  }, [user])

  useEffect(() => {
    const ids = [
      ...acceptedFriends.map((item) => (item.requester_id === user?.id ? item.addressee_id : item.requester_id)),
      ...incomingRequests.map((item) => item.requester_id),
      ...outgoingRequests.map((item) => item.addressee_id),
    ]
      .filter(Boolean)
      .slice(0, 8)
    const uniqueIds = [...new Set(ids)]

    if (!uniqueIds.length) {
      return
    }

    Promise.all(
      uniqueIds.map((id) =>
        api
          .get(`/users/${id}`)
          .then((res) => ({ id, user: res.data }))
          .catch(() => null)
      )
    ).then((results) => {
      const byId = {}
      results.forEach((entry) => {
        if (entry?.user) {
          byId[entry.id] = entry.user
        }
      })
      setFriendProfiles((prev) => ({ ...prev, ...byId }))
    })
  }, [acceptedFriends.length, incomingRequests.length, outgoingRequests.length, user])

  useEffect(() => {
    if (mapRef.current || !mapContainer.current) return

    mapRef.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [DEFAULT_CENTER.lng, DEFAULT_CENTER.lat],
      zoom: 11,
    })

    mapRef.current.on('style.load', () => {
      mapRef.current.setPaintProperty('water', 'fill-color', 'hsl(196, 42%, 74%)')
      mapRef.current.setPaintProperty('waterway', 'line-color', 'hsl(196, 38%, 68%)')
      mapRef.current.setPaintProperty('national-park', 'fill-color', 'hsl(122, 22%, 80%)')
      mapRef.current.setPaintProperty('landuse', 'fill-color', 'hsl(122, 22%, 80%)')
      mapRef.current.setPaintProperty('building', 'fill-color', 'hsl(80, 4%, 91%)')
      mapRef.current.setPaintProperty('building', 'fill-outline-color', 'hsl(80, 4%, 86%)')
      mapRef.current.setPaintProperty('waterway-label', 'text-color', 'hsl(196, 45%, 38%)')
      mapRef.current.setPaintProperty('water-line-label', 'text-color', 'hsl(196, 45%, 38%)')
      mapRef.current.setPaintProperty('water-point-label', 'text-color', 'hsl(196, 45%, 38%)')
      mapRef.current.setPaintProperty('natural-point-label', 'text-color', 'hsl(122, 28%, 38%)')
      mapRef.current.setPaintProperty('natural-line-label', 'text-color', 'hsl(122, 28%, 38%)')
      ;['natural-point-label', 'natural-line-label', 'poi-label'].forEach(id => {
        if (mapRef.current.getLayer(id)) {
          mapRef.current.setLayoutProperty(id, 'visibility', 'none')
        }
      })

      mapRef.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right')

      const fetchWeather = (lat, lng) => {
        api.get(`/weather?lat=${lat}&lng=${lng}`)
          .then(res => { if (!res.data.error) setWeather(res.data) })
          .catch(() => {})
      }

      const fetchHeroPhoto = (lat, lng) => {
        api.get(`/photos/daily?lat=${lat}&lng=${lng}`)
          .then(res => { if (res.data.photo_url) setHeroPhoto(res.data) })
          .catch(() => {})
      }

      const storedLat = user?.location_lat
      const storedLng = user?.location_lng

      if (storedLat && storedLng) {
        mapRef.current.flyTo({ center: [storedLng, storedLat], zoom: 11 })
        loadPins(storedLat, storedLng)
        fetchWeather(storedLat, storedLng)
        fetchHeroPhoto(storedLat, storedLng)
        setMapLoading(false)
      }

      navigator.geolocation?.getCurrentPosition(
        ({ coords }) => {
          mapRef.current.flyTo({ center: [coords.longitude, coords.latitude], zoom: 11 })
          loadPins(coords.latitude, coords.longitude)
          fetchWeather(coords.latitude, coords.longitude)
          fetchHeroPhoto(coords.latitude, coords.longitude)
          setMapLoading(false)
        },
        () => {
          if (!storedLat) {
            loadPins(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng)
            setNoLocation(true)
            setMapLoading(false)
          }
        }
      )
    })

    mapRef.current.on('moveend', () => {
      const c = mapRef.current.getCenter()
      loadPins(c.lat, c.lng)
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [loadPins])

  useEffect(() => {
    if (!mapRef.current || !mapRef.current.loaded()) return

    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []

    if (showSavedPlaces) {
      savedLocations
        .filter((location) => location.lat != null && location.lng != null)
        .forEach((location) => {
          const marker = new mapboxgl.Marker(markerElement('var(--bd-moss)', location.name || 'Saved place'))
            .setLngLat([location.lng, location.lat])
            .setPopup(
              new mapboxgl.Popup({ offset: 12 }).setDOMContent(
                createPopupElement(location.name || 'Saved place', location.type || 'Saved location')
              )
            )
            .addTo(mapRef.current)
          markersRef.current.push(marker)
        })
    }

    if (showPersonalSightings) {
      sightings
        .filter((sighting) => sighting.lat != null && sighting.lng != null)
        .forEach((sighting) => {
          const title = sighting.common_name || `Sighting #${sighting.id}`
          const subtitle = sighting.identified_at
            ? new Date(sighting.identified_at).toLocaleDateString()
            : 'Personal sighting'

          const marker = new mapboxgl.Marker(markerElement('var(--bd-terra)', title))
            .setLngLat([sighting.lng, sighting.lat])
            .setPopup(new mapboxgl.Popup({ offset: 12 }).setDOMContent(createPopupElement(title, subtitle)))
            .addTo(mapRef.current)
          markersRef.current.push(marker)
        })
    }

    // Handle greenspace and water layers visibility
    const layers = ['wildr-greenspaces-fill', 'wildr-greenspaces-outline', 'wildr-water-fill', 'wildr-water-outline']
    layers.forEach(layerId => {
      if (mapRef.current.getLayer(layerId)) {
        mapRef.current.setLayoutProperty(layerId, 'visibility', showOthers ? 'visible' : 'none')
      }
    })

    // TODO: Add community sightings when API available
  }, [savedLocations, sightings, showCommunitySightings, showPersonalSightings, showSavedPlaces, showOthers])

  const visibleFriends = acceptedFriends.slice(0, 4).map((friendship) => {
    const friendId = friendship.requester_id === user?.id ? friendship.addressee_id : friendship.requester_id
    return {
      id: friendId,
      username: friendProfiles[friendId]?.username || `User ${friendId}`,
    }
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6" style={{ backgroundColor: 'var(--bd-bg)', color: 'var(--bd-ink)' }}>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div
        className="relative rounded-3xl overflow-hidden"
        style={{ minHeight: '420px', maxHeight: '520px', height: '52vw' }}
      >
        {/* Background photo */}
        {heroPhoto?.photo_url ? (
          <img
            src={heroPhoto.photo_url}
            alt={heroPhoto.description || 'Daily nature photo'}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: 'center' }}
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg, var(--bd-moss-deep) 0%, var(--bd-moss) 100%)' }}
          />
        )}

        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.08) 48%, rgba(0,0,0,0.52) 100%)',
          }}
        />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-between p-6 md:p-8">
          {/* Top row: greeting + weather + action buttons */}
          <div className="flex items-start justify-between gap-4">
            {/* Left: greeting + weather */}
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: 'rgba(255,255,255,0.72)', letterSpacing: '0.12em' }}
              >
                {greeting()}
              </p>
              <h1 className="text-3xl md:text-4xl font-bold text-white mt-0.5 leading-tight">
                {user?.username || 'Wildr'}
              </h1>

              {/* Weather widget */}
              {weather ? (
                <div className="mt-4 flex items-center gap-3">
                  <WeatherIcon code={weather.icon_code} size={44} />
                  <div>
                    <div
                      className="text-5xl font-light text-white leading-none"
                      style={{ letterSpacing: '-0.02em' }}
                    >
                      {Math.round(weather.temp_c)}°
                    </div>
                    <div
                      className="text-sm capitalize mt-1"
                      style={{ color: 'rgba(255,255,255,0.80)' }}
                    >
                      {weather.description}
                    </div>
                    <div
                      className="text-xs mt-0.5"
                      style={{ color: 'rgba(255,255,255,0.55)' }}
                    >
                      Feels {Math.round(weather.feels_like_c)}° · Wind {weather.wind_kph} km/h
                    </div>
                  </div>
                </div>
              ) : noLocation ? (
                <div className="mt-4">
                  <Link
                    to="/profile"
                    className="text-sm underline underline-offset-2"
                    style={{ color: 'rgba(255,255,255,0.55)' }}
                  >
                    Set your location in Profile for weather
                  </Link>
                </div>
              ) : (
                <div className="mt-4 flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  <div className="w-6 h-6 rounded-full border-2 border-current opacity-40 animate-pulse" />
                  <span className="text-sm">Loading weather…</span>
                </div>
              )}
            </div>

            {/* Right: action buttons */}
            <div className="flex gap-2 shrink-0 mt-1">
              <Link
                to="/identify"
                className="w-12 h-12 rounded-full flex items-center justify-center transition hover:scale-105"
                style={{
                  background: 'rgba(255,255,255,0.18)',
                  border: '1px solid rgba(255,255,255,0.30)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                }}
                title="Identify by photo"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                  <circle cx="12" cy="13" r="3"/>
                </svg>
              </Link>
              <Link
                to="/identify-audio"
                className="w-12 h-12 rounded-full flex items-center justify-center transition hover:scale-105"
                style={{
                  background: 'rgba(255,255,255,0.18)',
                  border: '1px solid rgba(255,255,255,0.30)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                }}
                title="Identify by sound"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3Z"/>
                  <path d="M19 10a7 7 0 0 1-14 0"/>
                  <path d="M12 19v4"/>
                  <path d="M8 23h8"/>
                </svg>
              </Link>
              <Link
                to="/log"
                className="w-12 h-12 rounded-full flex items-center justify-center transition hover:scale-105"
                style={{
                  background: 'rgba(255,255,255,0.18)',
                  border: '1px solid rgba(255,255,255,0.30)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                }}
                title="Log a sighting"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
              </Link>
            </div>
          </div>

          {/* Bottom: photo attribution */}
          {heroPhoto && (
            <div className="flex items-end justify-between gap-4">
              <p
                className="text-xs leading-relaxed"
                style={{ color: 'rgba(255,255,255,0.55)', maxWidth: '320px' }}
              >
                {heroPhoto.description && (
                  <span className="italic">{heroPhoto.description}</span>
                )}
                {heroPhoto.photographer && (
                  <span>
                    {heroPhoto.description ? ' · ' : ''}Photo by{' '}
                    <a
                      href={heroPhoto.photographer_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2 hover:text-white transition"
                    >
                      {heroPhoto.photographer}
                    </a>{' '}
                    on{' '}
                    <a
                      href="https://unsplash.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2 hover:text-white transition"
                    >
                      Unsplash
                    </a>
                  </span>
                )}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6 order-2 lg:order-1">
          <div className="rounded-3xl p-6 shadow-sm" style={{ backgroundColor: 'var(--bd-card)', border: '1px solid var(--bd-rule)' }}>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold" style={{ color: 'var(--bd-moss-deep)' }}>{formatCount(sightings.length)}</div>
                <div className="text-xs font-semibold uppercase tracking-wide mt-2" style={{ color: 'var(--bd-ink-soft)' }}>Species</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold" style={{ color: 'var(--bd-moss-deep)' }}>{formatCount(badges.length)}</div>
                <div className="text-xs font-semibold uppercase tracking-wide mt-2" style={{ color: 'var(--bd-ink-soft)' }}>Badges</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold" style={{ color: 'var(--bd-moss-deep)' }}>{formatCount(savedLocations.length)}</div>
                <div className="text-xs font-semibold uppercase tracking-wide mt-2" style={{ color: 'var(--bd-ink-soft)' }}>Saved places</div>
                <div className="mt-3 flex justify-center gap-2 text-[11px]">
                  <span style={{ borderRadius: '999px', padding: '2px 8px', background: 'var(--bd-bg)', border: '1px solid var(--bd-rule)', color: 'var(--bd-ink-mute)', fontSize: 'inherit' }}>Want {formatCount(wantToVisitCount)}</span>
                  <span style={{ borderRadius: '999px', padding: '2px 8px', background: 'var(--bd-moss)', color: '#fff', fontSize: 'inherit' }}>Visited {formatCount(visitedCount)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl p-6 shadow-sm" style={{ backgroundColor: 'var(--bd-moss-deep)', color: '#f6f3ea' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}>
                <IconTrophy />
              </div>
              <div>
                <div className="text-sm font-semibold uppercase tracking-wide opacity-80">TODAY'S QUEST</div>
                <div className="text-xl font-semibold mt-1">Find a house sparrow at dusk</div>
                <div className="text-sm opacity-80 mt-1">Passer domesticus · ~12 min walk · listen for the chatter</div>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="flex-1 h-11 rounded-2xl font-semibold text-sm" style={{ backgroundColor: 'var(--bd-bg)', color: 'var(--bd-ink)' }}>
                Set out →
              </button>
              <button className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.25)' }}>
                <IconStarSmall />
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-3xl overflow-hidden shadow-sm order-1 lg:order-2" style={{ backgroundColor: 'var(--bd-card)', border: '1px solid var(--bd-rule)' }}>
          <div className="flex items-center justify-between p-6 pb-4">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--bd-ink)' }}>Your map</h2>
              <p className="text-sm" style={{ color: 'var(--bd-ink-soft)' }}>Sightings and saved locations</p>
            </div>
            <Link to="/map" className="text-sm font-semibold hover:underline" style={{ color: 'var(--bd-terra)' }}>
              View full map →
            </Link>
          </div>
          <div className="px-6 pb-4">
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
          <div className="relative h-80">
            <div ref={mapContainer} className="h-full w-full" />
            {mapLoading && (
              <div className="absolute inset-0 z-10 grid place-items-center text-sm" style={{ backgroundColor: 'rgba(247,244,237,0.9)', color: 'var(--bd-ink-soft)' }}>
                Loading map…
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-6">
          <div className="rounded-3xl p-6 shadow-sm" style={{ backgroundColor: 'var(--bd-card)', border: '1px solid var(--bd-rule)' }}>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-base font-semibold" style={{ color: 'var(--bd-ink)' }}>This week in nature</h2>
                <p className="text-sm" style={{ color: 'var(--bd-ink-soft)' }}>Recent activity near you</p>
              </div>
              <Link to="/sightings" className="text-sm font-semibold" style={{ color: 'var(--bd-terra)', textDecoration: 'none' }}>see all</Link>
            </div>
            <div className="rounded-2xl p-4 flex items-center gap-4" style={{ backgroundColor: 'var(--bd-bg-soft)' }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(196,103,66,0.15)' }}>
                <IconBirdSmall />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-sm" style={{ color: 'var(--bd-ink)' }}>Barn swallows arrived</div>
                <div className="text-sm mt-1" style={{ color: 'var(--bd-ink-soft)' }}>3 days early · 247 neighbors confirmed</div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl p-6 shadow-sm" style={{ backgroundColor: 'var(--bd-card)', border: '1px solid var(--bd-rule)' }}>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-base font-semibold" style={{ color: 'var(--bd-ink)' }}>Recently within 1 mile</h2>
                <p className="text-sm" style={{ color: 'var(--bd-ink-soft)' }}>Latest sightings nearby</p>
              </div>
              <Link to="/sightings" className="text-sm font-semibold" style={{ color: 'var(--bd-moss)', textDecoration: 'none', flexShrink: 0 }}>View all</Link>
            </div>
            <div className="space-y-3">
              {loading ? (
                [...Array(3)].map((_, idx) => (
                  <div key={idx} className="h-16 rounded-2xl" style={{ backgroundColor: 'var(--bd-bg-soft)' }} />
                ))
              ) : sightings.length === 0 ? (
                <div className="flex flex-col items-center py-6 gap-3">
                  <PineTrees size="sm" />
                  <p className="text-sm" style={{ color: 'var(--bd-ink-soft)' }}>
                    Head out and <Link to="/log" style={{ color: 'var(--bd-moss)', textDecoration: 'none', fontWeight: 600 }}>log a sighting</Link>!
                  </p>
                </div>
              ) : (
                sightings.slice(0, 3).map((sighting) => (
                  <div key={sighting.id} className="rounded-2xl flex items-center gap-0 overflow-hidden" style={{ backgroundColor: 'var(--bd-card)', border: '1px solid var(--bd-rule)' }}>
                    <div className="w-14 h-14 flex-shrink-0" style={{ backgroundColor: 'var(--bd-bg-soft)' }}>
                      {sighting.photo_url
                        ? <img src={sighting.photo_url} alt={sighting.common_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : null}
                    </div>
                    <div className="flex-1 px-3 py-2">
                      <div className="font-semibold text-sm" style={{ color: 'var(--bd-ink)' }}>{sighting.common_name || `Sighting #${sighting.id}`}</div>
                      <div className="text-xs italic" style={{ color: 'var(--bd-ink-mute)' }}>{sighting.scientific_name}</div>
                      <div className="text-xs" style={{ color: 'var(--bd-ink-soft)' }}>{formatDate(sighting.identified_at)}{sighting.place_name ? ` · ${sighting.place_name}` : ''}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-3xl p-6 shadow-sm" style={{ backgroundColor: 'var(--bd-card)', border: '1px solid var(--bd-rule)' }}>
            <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--bd-ink)' }}>Saved places</h2>
            <p className="text-sm mb-5" style={{ color: 'var(--bd-ink-soft)' }}>Your visited and want-to-visit marks</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl p-4 bg-slate-50">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Want to Visit</div>
                <div className="mt-3 text-2xl font-bold" style={{ color: 'var(--bd-ink)' }}>{formatCount(wantToVisitCount)}</div>
              </div>
              <div className="rounded-2xl p-4 bg-slate-50">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Visited</div>
                <div className="mt-3 text-2xl font-bold" style={{ color: 'var(--bd-ink)' }}>{formatCount(visitedCount)}</div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl p-6 shadow-sm" style={{ backgroundColor: 'var(--bd-card)', border: '1px solid var(--bd-rule)' }}>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--bd-ink)' }}>Community</h2>
              <Link to="/friends" className="text-sm font-semibold" style={{ color: 'var(--bd-moss)', textDecoration: 'none' }}>View all</Link>
            </div>
            <p className="text-sm mb-5" style={{ color: 'var(--bd-ink-soft)' }}>Friends and requests</p>
            <div className="space-y-3">
              <div className="rounded-2xl p-4" style={{ backgroundColor: 'rgba(90,110,74,0.08)' }}>
                <div className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--bd-moss-deep)' }}>Friends</div>
                <div className="text-2xl font-bold mt-2" style={{ color: 'var(--bd-ink)' }}>{formatCount(acceptedFriends.length)}</div>
              </div>
              <div className="rounded-2xl p-4" style={{ backgroundColor: 'rgba(196,103,66,0.08)' }}>
                <div className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--bd-terra)' }}>Incoming requests</div>
                <div className="text-2xl font-bold mt-2" style={{ color: 'var(--bd-ink)' }}>{formatCount(incomingRequests.length)}</div>
              </div>
              <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--bd-bg-soft)' }}>
                <div className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--bd-ink-soft)' }}>Outgoing requests</div>
                <div className="text-2xl font-bold mt-2" style={{ color: 'var(--bd-ink)' }}>{formatCount(outgoingRequests.length)}</div>
              </div>
              <Link
                to="/friends"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  padding: '0.625rem 1rem',
                  borderRadius: '999px',
                  background: 'var(--bd-moss)',
                  color: '#fff',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  marginTop: '0.25rem',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                Invite friends
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
