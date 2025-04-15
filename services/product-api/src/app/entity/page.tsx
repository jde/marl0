// src/app/entity/page.tsx

import { db } from '@/lib/prisma'
import Link from 'next/link'

export default async function EntityIndexPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const page = parseInt(searchParams.page as string) || 1
  const pageSize = 10
  const skip = (page - 1) * pageSize

  const where = {
    createdById: searchParams.author
      ? { contains: searchParams.author as string, mode: 'insensitive' }
      : undefined,
    classifications: searchParams.classification
      ? {
          some: {
            name: (searchParams.classification as string).split(':')[0],
            value: (searchParams.classification as string).split(':')[1],
          },
        }
      : undefined,
  }

  const [entities, total] = await Promise.all([
    db.entity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      include: { classifications: true },
    }),
    db.entity.count({ where }),
  ])

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">All Entities</h1>

      <form className="flex flex-wrap gap-4 mb-4 items-end">
        <div className="flex flex-col">
          <label className="text-sm font-medium">Author ID</label>
          <input
            type="text"
            name="author"
            placeholder="Filter by creator ID"
            defaultValue={searchParams.author as string || ''}
            className="border border-gray-300 px-2 py-1 rounded"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium">Classification</label>
          <input
            type="text"
            name="classification"
            placeholder="e.g. tone:sarcastic"
            defaultValue={searchParams.classification as string || ''}
            className="border border-gray-300 px-2 py-1 rounded"
          />
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          Filter
        </button>
      </form>

      <ul className="space-y-4">
        {entities.map((entity) => (
          <li key={entity.id} className="border border-gray-200 p-4 rounded bg-gray-50">
            <Link href={`/entity/${entity.id}`} className="text-blue-600 hover:underline">
              {JSON.stringify(entity.payload, null, 2)}
            </Link>
            <div className="text-sm text-gray-600 mt-1">Created at: {new Date(entity.createdAt).toLocaleString()}</div>
            <div className="text-sm text-gray-600">Created by: {entity.createdById}</div>
            <ul className="text-sm mt-2 list-disc ml-5">
              {entity.classifications.map((c) => (
                <li key={c.id}>
                  <strong>{c.name}</strong>: {c.value} ({c.confidence ?? 'n/a'})
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      <div className="flex gap-2 mt-6 flex-wrap">
        {Array.from({ length: totalPages }).map((_, i) => (
          <Link
            key={i}
            href={`/entity?page=${i + 1}`}
            className={`px-3 py-1 border rounded ${page === i + 1 ? 'bg-blue-600 text-white' : 'bg-white text-blue-600'}`}
          >
            {i + 1}
          </Link>
        ))}
      </div>
    </div>
  )
}
