import { Client } from '@opensearch-project/opensearch'

const es = new Client({ node: process.env.ELASTICSEARCH_URL || 'http://elasticsearch:9200' })

type Filters = {
  agent?: string
  section?: string
  source?: string
  q?: string
  page?: number
  perPage?: number
}

export async function searchEntities(filters: Filters) {
  const must: any[] = []

  if (filters.agent) {
    must.push({ term: { agent: filters.agent } })
  }
  if (filters.section) {
    must.push({ term: { section: filters.section } })
  }
  if (filters.source) {
    must.push({ term: { source: filters.source } })
  }
  if (filters.q) {
    must.push({
      multi_match: {
        query: filters.q,
        fields: ['title^2', 'excerpt', 'content'],
      },
    })
  }

  const from = (filters.page! - 1) * filters.perPage!
  const size = filters.perPage!

  const result = await es.search({
    index: 'entities',
    from,
    size,
    body: {
      query: {
        bool: {
          must,
        },
      },
      aggs: {
        agent: { terms: { field: 'agent' } },
        section: { terms: { field: 'section' } },
        source: { terms: { field: 'source' } },
      },
    },
  })

  return {
    results: result.body.hits.hits.map((hit: any) => hit._source),
    filters: {
      agent: aggToCountMap(result.body.aggregations.agent.buckets),
      section: aggToCountMap(result.body.aggregations.section.buckets),
      source: aggToCountMap(result.body.aggregations.source.buckets),
    },
    pagination: {
      page: filters.page,
      perPage: filters.perPage,
      total: result.body.hits.total.value,
    },
  }
}

function aggToCountMap(buckets: any[]) {
  const out: Record<string, number> = {}
  for (const b of buckets) {
    out[b.key] = b.doc_count
  }
  return out
}
