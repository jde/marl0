'use client'

import { useEffect, useState } from 'react'

export function ProvenanceTimeline({ entityId }: { entityId: string }) {
  const [events, setEvents] = useState<any[]>([])

  useEffect(() => {
    fetch(`/api/product/provenance?id=${entityId}&depth=2`)
      .then(res => res.json())
      .then(setEvents)
  }, [entityId])

  if (!events.length) return null

  return (
    <div className="mt-6">
      <h3 className="font-semibold text-lg mb-2">Provenance Timeline</h3>
      <ul className="space-y-3 border-l pl-4">
        {events.map((e, i) => (
          <li key={i} className="relative">
            <div className="absolute -left-2 top-1.5 w-2 h-2 bg-blue-500 rounded-full" />
            <div className="text-sm">
              {e.type === 'Entity' && `📦 Entity ${e.id}`}
              {e.type === 'Activity' && `⚙️ Activity: ${e.kind}`}
              <div className="text-xs text-muted-foreground">
                {e.timestamp?.slice(0, 19).replace('T', ' ') ?? ''}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
