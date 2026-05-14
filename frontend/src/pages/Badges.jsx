import { useEffect, useState } from 'react'
import api from '../api/client'

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function BadgeCard({ item }) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white shadow-sm p-5 flex items-start gap-4">
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-white text-lg font-bold"
        style={{ backgroundColor: 'var(--bd-moss)' }}
      >
        {item.badge.icon_url ? (
          <img src={item.badge.icon_url} alt="" className="w-8 h-8 object-contain" />
        ) : (
          item.badge.name[0].toUpperCase()
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm" style={{ color: 'var(--bd-ink)' }}>{item.badge.name}</p>
        {item.badge.description && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--bd-ink-soft)' }}>{item.badge.description}</p>
        )}
        <p className="text-xs mt-2" style={{ color: 'var(--bd-ink-mute)' }}>Earned {formatDate(item.earned_at)}</p>
      </div>
    </div>
  )
}

export default function Badges() {
  const [badges, setBadges] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/badges/me')
      .then(({ data }) => setBadges(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--bd-ink)' }}>Badges</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--bd-ink-soft)' }}>Achievements earned through your sightings and exploration.</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-3xl animate-pulse" style={{ backgroundColor: 'var(--bd-rule-soft)' }} />
          ))}
        </div>
      ) : badges.length === 0 ? (
        <div className="rounded-3xl border border-gray-200 bg-white shadow-sm px-6 py-12 text-center">
          <p className="text-sm font-medium" style={{ color: 'var(--bd-ink)' }}>No badges yet</p>
          <p className="text-sm mt-1" style={{ color: 'var(--bd-ink-soft)' }}>Log your first sighting to start earning.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {badges.map((item) => <BadgeCard key={item.badge.id} item={item} />)}
        </div>
      )}
    </div>
  )
}
