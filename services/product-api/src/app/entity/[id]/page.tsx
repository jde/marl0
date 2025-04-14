// src/app/entity/[id]/page.tsx

import { db } from '@/lib/prisma'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function EntityPage({ params }: { params: { id: string } }) {
  const entity = await db.entity.findUnique({
    where: { id: params.id },
    include: {
      classifications: true,
      createdBy: true,
    },
  })

  if (!entity) return notFound()

  const provenance = await db.provenanceEdge.findMany({
    where: {
      OR: [
        { outputs: { some: { entityId: entity.id } } },
        { inputs: { some: { entityId: entity.id } } },
      ],
    },
    include: {
      inputs: true,
      outputs: true,
      actor: true,
    },
  })

  const incomingEdges = provenance.filter((edge) =>
    edge.outputs.some((o) => o.entityId === entity.id)
  )
  const outgoingEdges = provenance.filter((edge) =>
    edge.inputs.some((i) => i.entityId === entity.id)
  )

  return (
    <div className="p-8 space-y-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Entity: {entity.id}</h1>
        <div className="text-gray-500 text-sm">Created by: {entity.createdById}</div>
        <div className="text-sm mt-2">{new Date(entity.createdAt).toLocaleString()}</div>
      </div>

      <div className="mx-auto max-w-2xl border p-6 rounded shadow-sm bg-white">
        <h2 className="text-lg font-semibold mb-2">Payload</h2>
        <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
          {JSON.stringify(entity.payload, null, 2)}
        </pre>
        <h2 className="text-lg font-semibold mt-4">Classifications</h2>
        <ul className="list-disc ml-5 text-sm">
          {entity.classifications.map((cls) => (
            <li key={cls.id}>
              <strong>{cls.name}</strong>: {cls.value} ({cls.confidence ?? 'n/a'})
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">⬆️ Created By:</h2>
          {incomingEdges.map((edge) => (
            <div key={edge.id} className="border p-4 rounded bg-blue-50">
              <div className="font-medium">Action: {edge.action}</div>
              <div className="text-sm text-gray-600">Timestamp: {new Date(edge.timestamp).toLocaleString()}</div>
              <div className="text-sm">Actor: <Link href={`/actor/${edge.actor.id}`} className="text-blue-600 hover:underline">{edge.actor.name}</Link></div>
              <div className="text-sm mt-2">Inputs:</div>
              <ul className="ml-4 text-sm list-disc">
                {edge.inputs.map((input) => (
                  <li key={input.entityId}>
                    <Link href={`/entity/${input.entityId}`} className="text-blue-600 hover:underline">
                      {input.entityId}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">⬇️ Used In:</h2>
          {outgoingEdges.map((edge) => (
            <div key={edge.id} className="border p-4 rounded bg-green-50">
              <div className="font-medium">Action: {edge.action}</div>
              <div className="text-sm text-gray-600">Timestamp: {new Date(edge.timestamp).toLocaleString()}</div>
              <div className="text-sm">Actor: <Link href={`/actor/${edge.actor.id}`} className="text-blue-600 hover:underline">{edge.actor.name}</Link></div>
              <div className="text-sm mt-2">Outputs:</div>
              <ul className="ml-4 text-sm list-disc">
                {edge.outputs.map((output) => (
                  <li key={output.entityId}>
                    <Link href={`/entity/${output.entityId}`} className="text-blue-600 hover:underline">
                      {output.entityId}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
