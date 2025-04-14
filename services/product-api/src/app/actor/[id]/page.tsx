// src/app/actor/[id]/page.tsx

import { db } from '@/lib/prisma'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function ActorPage({ params }: { params: { id: string } }) {
  const actor = await db.actor.findUnique({
    where: { id: params.id },
  })

  if (!actor) return notFound()

  const edges = await db.provenanceEdge.findMany({
    where: { actorId: actor.id },
    include: {
      inputs: true,
      outputs: true,
    },
    orderBy: { timestamp: 'desc' },
  })

  return (
    <div className="p-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Actor: {actor.name}</h1>
        <div className="text-sm text-gray-500">{actor.id} — v{actor.version}</div>
        <div className="text-sm text-gray-600 mt-1">Kind: {actor.actorKind}</div>
        <div className="text-sm text-gray-600">Method: {actor.actorMethod || 'n/a'}</div>
      </div>

      <div className="space-y-4">
        {edges.map((edge) => (
          <div key={edge.id} className="border rounded p-4 bg-white shadow-sm">
            <div className="font-semibold mb-1">Action: {edge.action}</div>
            <div className="text-sm text-gray-500 mb-2">{new Date(edge.timestamp).toLocaleString()}</div>

            <div className="text-sm">
              <span className="font-medium">Inputs:</span>
              <ul className="ml-4 list-disc list-inside">
                {edge.inputs.map((input) => (
                  <li key={input.entityId}>
                    <Link href={`/entity/${input.entityId}`} className="text-blue-600 hover:underline">
                      {input.entityId}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="text-sm mt-2">
              <span className="font-medium">Outputs:</span>
              <ul className="ml-4 list-disc list-inside">
                {edge.outputs.map((output) => (
                  <li key={output.entityId}>
                    <Link href={`/entity/${output.entityId}`} className="text-blue-600 hover:underline">
                      {output.entityId}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
