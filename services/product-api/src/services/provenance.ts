import neo4j from 'neo4j-driver'

const driver = neo4j.driver(
  process.env.MEMGRAPH_URI || 'bolt://memgraph:7687',
  neo4j.auth.none(),
  {
    encrypted: 'ENCRYPTION_OFF',
    resolver: address => [address.replace('localhost', '127.0.0.1')]
  }
)

export async function getProvenanceTimeline(entityId: string, depth: number = 2) {
  const session = driver.session()

const result = await session.run(
  `
  MATCH (target:Entity)
  WHERE target.id = $id
  MATCH path = (target)<-[:GENERATED]-(a:Activity)-[:USED*0..2]->(e:Entity)
  UNWIND nodes(path) AS n
  RETURN DISTINCT n
  `,
  { id: entityId }
)

  await session.close()

  const timeline = result.records.map((record) => {
    const n = record.get('n').properties
    const label = record.get('n').labels?.[0] ?? 'Node'
    return { ...n, type: label }
  })

  return timeline
}
