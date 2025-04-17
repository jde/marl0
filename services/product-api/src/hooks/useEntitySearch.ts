'use client'

import { useCallback, useEffect, useState } from 'react'

export type FilterMap = Record<string, boolean>

export type EntitySearchFilters = {
  agent: FilterMap
  section: FilterMap
  source: FilterMap
  q?: string
  page?: number
  perPage?: number
}

export function useEntitySearch(initial?: Partial<EntitySearchFilters>) {
  const [filters, setFilters] = useState<EntitySearchFilters>({
    agent: {},
    section: {},
    source: {},
    q: '',
    page: 1,
    perPage: 20,
    ...initial
  })

  const [results, setResults] = useState<any[]>([])
  const [counts, setCounts] = useState<Record<string, Record<string, number>>>({})
  const [total, setTotal] = useState(0)
  const [live, setLive] = useState(false)

  const fetchResults = useCallback(() => {
    const params = new URLSearchParams()

    Object.entries(filters).forEach(([key, value]) => {
      if (typeof value === 'object') {
        Object.entries(value).forEach(([k, checked]) => {
          if (checked) params.append(key, k)
        })
      } else if (value !== undefined && value !== '') {
        params.set(key, String(value))
      }
    })

    fetch(`/api/product/search/entities?${params}`)
      .then(res => res.json())
      .then(data => {
        setResults(data.results || [])
        setCounts(data.filters || { agent: {}, section: {}, source: {} })
        setTotal(data.pagination?.total || 0)
      })
  }, [filters])

  // Run once on mount + when filters change
  useEffect(() => {
    fetchResults()
  }, [fetchResults])

  // Live mode polling
  useEffect(() => {
    if (!live) return
    const interval = setInterval(fetchResults, 5000)
    return () => clearInterval(interval)
  }, [live, fetchResults])

  return { filters, setFilters, results, counts, total, live, setLive }
}
