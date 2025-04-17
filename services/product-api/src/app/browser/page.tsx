'use client'

import { FilterPanel } from '@/components/browser/FilterPanel'
import { Switch } from '@/components/ui/switch'
import { useEntitySearch } from '@/hooks/useEntitySearch'



export default function BrowserPage() {
  const { filters, setFilters, results, counts, total, live, setLive } = useEntitySearch()

  const toggle = (group: keyof typeof filters) => (key: string) => {
    setFilters(prev => ({
      ...prev,
      [group]: {
        ...prev[group],
        [key]: !prev[group][key],
      },
    }))
  }

  return (
    <div className="flex">
      <aside className="w-64 p-4 border-r h-screen overflow-y-auto">
        <Switch
            checked={live}
            onCheckedChange={setLive}
            className="ml-4"
            />
        <span className="ml-2 text-sm text-muted-foreground">
            Live Mode
        </span>
        <FilterPanel
          label="Agent"
          options={counts.agent || {}}
          selected={filters.agent}
          onToggle={toggle('agent')}
        />
        <FilterPanel
          label="Section"
          options={counts.section || {}}
          selected={filters.section}
          onToggle={toggle('section')}
        />
        <FilterPanel
          label="Source"
          options={counts.source || {}}
          selected={filters.source}
          onToggle={toggle('source')}
        />
      </aside>
      <main className="flex-1 p-4">
        <h2 className="text-xl font-semibold mb-2">Results ({total})</h2>
        <ul className="space-y-4">
            {results.map((item, idx) => (
                <li key={idx} className="border p-3 rounded bg-white shadow-sm">
                <div className="text-lg font-medium">{item.payload?.title ?? '(no title)'}</div>
                <div className="text-sm text-muted-foreground">
                    {item.payload?.source} — {item.payload?.section}
                </div>
                <div className="text-sm mt-1">
                    {item.payload?.excerpt?.slice(0, 200) ?? '(no excerpt)'}...
                </div>
                </li>
            ))}
        </ul>
      </main>
    </div>
  )
}
