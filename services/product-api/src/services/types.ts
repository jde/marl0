// services/product/types.ts

export type AgentContext = {
  id: string
  name: string
  version: string
  agentKind: 'human' | 'automated' | 'hybrid'
  agentMethod?: string
}

export type ClassificationInput = {
  name: string
  value: string
  confidence?: number
  namespace?: string
  taxonomyVersionId?: string
  overrideId?: string
}

export type ActivityInput = {
  payload: any
  classifications?: ClassificationInput[]
}

export type PerformActivityArgs = {
  agent: AgentContext
  activity: {
    action: string
    timestamp: string
  }
  usedEntityIds: string[]
  generatedEntities: ActivityInput[]
}

export type ClassifyEntityArgs = {
  agent: AgentContext
  entityId: string
  classification: ClassificationInput
}

export type UpsertClassificationArgs = {
  agent: AgentContext
  entityId: string
  name: string
  value: string
  confidence?: number
  namespace?: string
}

// Deprecated
export type CreateEntitiesArgs = {
  agent: AgentContext
  entities: Array<{
    payload: any
    classifications?: Array<{
      name: string
      value: string
      confidence?: number
      namespace?: string
    }>
    provenance?: {
      action: string
      timestamp: string
      inputEntityIds: string[]
    }
  }>
}

export type CreateEntitiesResult = {
  entities: any[] // Will be typed as Prisma.Entity[] if imported
  activities: any[] // Will be typed as Prisma.Activity[] if imported
}
