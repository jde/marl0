import { db } from '@/lib/prisma'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function AgentPage({ params }: { params: { id: string } }) {
  const agent = await db.agent.findUnique({
    where: { id: params.id },
  })

  if (!agent) return notFound()

  const activities = await db.activity.findMany({
    where: { agentId: agent.id },
    include: {
      used: true,
      generated: true,
    },
  })

  return (
    <div className="p-8 space-y-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Agent: {agent.name}</h1>
        <div className="text-sm text-gray-500">{agent.id} — v{agent.version}</div>
        <div className="text-sm text-gray-600 mt-1">Kind: {agent.agentKind}</div>
        <div className="text-sm text-gray-600">Method: {agent.agentMethod || 'n/a'}</div>
      </div>

      <div className="mx-auto max-w-2xl">
        <h2 className="text-xl font-semibold mb-4">Activities</h2>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="border p-4 rounded bg-white shadow-sm">
              <div className="font-medium">Action: {activity.action}</div>
              <div className="text-sm text-gray-600">Timestamp: {new Date(activity.timestamp).toLocaleString()}</div>
              
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