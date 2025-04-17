'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

type FilterPanelProps = {
  label: string
  options: Record<string, number>
  selected: Record<string, boolean>
  onToggle: (key: string) => void
}

export function FilterPanel({ label, options, selected, onToggle }: FilterPanelProps) {
  return (
    <div className="mb-6">
      <h3 className="font-semibold mb-2">{label}</h3>
      {Object.entries(options).map(([key, count]) => (
        <div key={key} className="flex items-center space-x-2 mb-1">
          <Checkbox
            id={`${label}-${key}`}
            checked={selected[key] || false}
            onCheckedChange={() => onToggle(key)}
          />
          <Label htmlFor={`${label}-${key}`} className="flex-1">
            {key} <span className="text-muted-foreground">({count})</span>
          </Label>
        </div>
      ))}
    </div>
  )
}
