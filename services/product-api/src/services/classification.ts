// services/product/classification.ts

import { db } from '@/lib/prisma'

export type ClassificationQueryOptions = {
  includeDeleted?: boolean
  trustedAgents?: string[]
  excludedAgents?: string[]
  activityIds?: string[]
  namespace?: string
}

export async function getClassificationById(id: string) {
  const classification = await db.classification.findUniqueOrThrow({
    where: { id },
  })

  return {
    classification: {
      id: classification.id,
      name: classification.name,
      value: classification.value,
      confidence: classification.confidence,
      namespace: classification.namespace,
      entityId: classification.entityId,
      supersedesId: classification.supersedesId,
      agentId: classification.agentId,
      activityId: classification.activityId,
      createdAt: classification.createdAt,
      updatedAt: classification.updatedAt,
      deletedAt: classification.deletedAt,
    },
  }
}

/**
 * Returns the current working set of classifications for an entity,
 * filtered by optional trust and activity filters.
 */
export async function getCurrentClassifications(
  entityId: string,
  options: ClassificationQueryOptions = {}
) {
  const filters: any = {
    entityId,
    deletedAt: options.includeDeleted ? undefined : null,
  }

  if (options.namespace !== undefined) filters.namespace = options.namespace
  if (options.trustedAgents) filters.agentId = { in: options.trustedAgents }
  if (options.excludedAgents) filters.agentId = { notIn: options.excludedAgents }
  if (options.activityIds) filters.activityId = { in: options.activityIds }

  const all = await db.classification.findMany({
    where: filters,
    orderBy: { createdAt: 'desc' },
  })

  const result: Record<string, typeof all[0]> = {}
  for (const c of all) {
    if (!result[c.name]) {
      result[c.name] = c
    }
  }
  return Object.values(result)
}

/**
 * Returns the full classification history for an entity,
 * optionally filtered by trust, activity, namespace, or deletion state.
 */
export async function getClassificationHistory(
  entityId: string,
  options: ClassificationQueryOptions = {}
) {
  const filters: any = {
    entityId,
    deletedAt: options.includeDeleted ? undefined : null,
  }

  if (options.namespace !== undefined) filters.namespace = options.namespace
  if (options.trustedAgents) filters.agentId = { in: options.trustedAgents }
  if (options.excludedAgents) filters.agentId = { notIn: options.excludedAgents }
  if (options.activityIds) filters.activityId = { in: options.activityIds }

  return db.classification.findMany({
    where: filters,
    orderBy: { createdAt: 'asc' },
  })
}