import api from './client'

export async function fetchNearbyGreenspaces(lat, lng, radiusM = 2000) {
  const { data } = await api.get('/greenspaces/nearby', {
    params: { lat, lng, radius_m: radiusM, limit: 100 },
  })
  return data
}

export async function fetchNearbyWaterBodies(lat, lng, radiusM = 2000) {
  const { data } = await api.get('/water-bodies/nearby', {
    params: { lat, lng, radius_m: radiusM, limit: 100 },
  })
  return data
}

export async function fetchGreenspaceSummary(id) {
  const { data } = await api.get(`/greenspaces/${id}/summary`)
  return data
}
export async function fetchWaterBodySummary(id) {
  const { data } = await api.get(`/water-bodies/${id}/summary`)
  return data
}

export async function createLocation(body) {
  const { data } = await api.post('/locations', body)
  return data
}
