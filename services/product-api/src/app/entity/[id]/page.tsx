// src/app/entity/[id]/page.tsx

import { db } from '@/lib/prisma'
import { Activity, ProvenanceInput, ProvenanceOutput } from '@prisma/client'
import Link from 'next/link'
import { notFound } from 'next/navigation'

type ActivityWithRelations = Activity & {
  used: ProvenanceInput[]
  generated: ProvenanceOutput[]
  agent: {
    id: string
    name: string
  }
}

export default async function EntityPage({ params }: { params: { id: string } }) {
  const entity = await db.entity.findUnique({
    where: { id: params.id },
    include: {
      classifications: true,
      createdBy: true,
    },
  })

  if (!entity) return notFound()

  const activities = await db.activity.findMany({
    where: {
      OR: [
        { generated: { some: { entityId: entity.id } } },
        { used: { some: { entityId: entity.id } } },
      ],
    },
    include: {
      used: true,
      generated: true,
      agent: true,
    },
  }) as ActivityWithRelations[]

  const incomingActivities = activities.filter((activity) =>
    activity.generated.some((o) => o.entityId === entity.id)
  )
  const outgoingActivities = activities.filter((activity) =>
    activity.used.some((i) => i.entityId === entity.id)
  )

  return (
    <div className="p-8 space-y-12">
      <Link href="/entity" className="text-blue-600 hover:underline">Back to Entity List</Link>

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
          {incomingActivities.map((activity) => (
            <div key={activity.id} className="border p-4 rounded bg-blue-50">
              <div className="font-medium">Action: {activity.action}</div>
              <div className="text-sm text-gray-600">Timestamp: {new Date(activity.timestamp).toLocaleString()}</div>
              <div className="text-sm">Agent: <Link href={`/agent/${activity.agent.id}`} className="text-blue-600 hover:underline">{activity.agent.name}</Link></div>
              <div className="text-sm mt-2">Used:</div>
              <ul className="ml-4 text-sm list-disc">
                {activity.used.map((input) => (
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
          {outgoingActivities.map((activity) => (
            <div key={activity.id} className="border p-4 rounded bg-green-50">
              <div className="font-medium">Action: {activity.action}</div>
              <div className="text-sm text-gray-600">Timestamp: {new Date(activity.timestamp).toLocaleString()}</div>
              <div className="text-sm">Agent: <Link href={`/agent/${activity.agent.id}`} className="text-blue-600 hover:underline">{activity.agent.name}</Link></div>
              <div className="text-sm mt-2">Generated:</div>
              <ul className="ml-4 text-sm list-disc">
                {activity.generated.map((output) => (
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
