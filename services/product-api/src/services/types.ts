// services/product/types.ts

export type ActorContext = {
  id: string
  name: string
  version: string
  actorKind: 'human' | 'automated' | 'hybrid'
  actorMethod?: string
}

export type ClassificationInput = {
  name: string
  value: string
  confidence?: number
  namespace?: string
  taxonomyVersionId?: string
  overrideId?: string
}

export type CreateEntitiesArgs = {
  actor: ActorContext
  entities: {
    payload: any
    provenance?: {
      action: string
      timestamp: string
      parameters?: any
      inputEntityIds: string[]
    }
    classifications?: ClassificationInput[]
  }[]
}

export type CreateEntitiesResult = {
  entities: any[] // Will be typed as Prisma.Entity[] if imported
  provenanceEdges: any[] // Will be typed as Prisma.ProvenanceEdge[] if imported
}

export type ClassifyEntityArgs = {
  actor: ActorContext
  entityId: string
  classification: ClassificationInput
}

export type UpsertClassificationArgs = {
  actor: ActorContext
  entityId: string
  name: string
  value: string
  confidence?: number
  namespace?: string
  taxonomyVersionId?: string
  overrideId?: string
}