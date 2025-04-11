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

export type CreateItemsArgs = {
  actor: ActorContext
  items: {
    payload: any
    provenance?: {
      action: string
      timestamp: string
      parameters?: any
      inputItemIds: string[]
    }
    classifications?: ClassificationInput[]
  }[]
}

export type CreateItemsResult = {
  items: any[] // Will be typed as Prisma.Item[] if imported
  provenanceEdges: any[] // Will be typed as Prisma.ProvenanceEdge[] if imported
}

export type ClassifyItemArgs = {
  actor: ActorContext
  itemId: string
  classification: ClassificationInput
}

export type UpsertClassificationArgs = {
  actor: ActorContext
  itemId: string
  name: string
  value: string
  confidence?: number
  namespace?: string
  taxonomyVersionId?: string
  overrideId?: string
}