-- CreateTable
CREATE TABLE "product_entity" (
    "id" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "product_entity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_provenance_edge" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "action" TEXT NOT NULL,
    "parameters" JSONB,
    "notes" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "product_provenance_edge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_provenance_input" (
    "id" TEXT NOT NULL,
    "provenance_edge_id" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,

    CONSTRAINT "product_provenance_input_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_provenance_output" (
    "id" TEXT NOT NULL,
    "provenance_edge_id" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,

    CONSTRAINT "product_provenance_output_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_actor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "actor_kind" TEXT NOT NULL,
    "actor_method" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "product_actor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_classification" (
    "id" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "namespace" TEXT,
    "taxonomy_version_id" TEXT,
    "supersedes_id" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "product_classification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_entity_created_by_id_idx" ON "product_entity"("created_by_id");

-- CreateIndex
CREATE INDEX "product_entity_deleted_at_idx" ON "product_entity"("deleted_at");

-- CreateIndex
CREATE INDEX "product_provenance_edge_actor_id_idx" ON "product_provenance_edge"("actor_id");

-- CreateIndex
CREATE INDEX "product_provenance_edge_timestamp_idx" ON "product_provenance_edge"("timestamp");

-- CreateIndex
CREATE INDEX "product_provenance_edge_deleted_at_idx" ON "product_provenance_edge"("deleted_at");

-- CreateIndex
CREATE INDEX "product_provenance_input_provenance_edge_id_idx" ON "product_provenance_input"("provenance_edge_id");

-- CreateIndex
CREATE INDEX "product_provenance_input_entity_id_idx" ON "product_provenance_input"("entity_id");

-- CreateIndex
CREATE INDEX "product_provenance_input_provenance_edge_id_entity_id_idx" ON "product_provenance_input"("provenance_edge_id", "entity_id");

-- CreateIndex
CREATE INDEX "product_provenance_output_provenance_edge_id_idx" ON "product_provenance_output"("provenance_edge_id");

-- CreateIndex
CREATE INDEX "product_provenance_output_entity_id_idx" ON "product_provenance_output"("entity_id");

-- CreateIndex
CREATE INDEX "product_provenance_output_provenance_edge_id_entity_id_idx" ON "product_provenance_output"("provenance_edge_id", "entity_id");

-- CreateIndex
CREATE INDEX "product_actor_name_idx" ON "product_actor"("name");

-- CreateIndex
CREATE INDEX "product_actor_actor_kind_idx" ON "product_actor"("actor_kind");

-- CreateIndex
CREATE INDEX "product_actor_deleted_at_idx" ON "product_actor"("deleted_at");

-- CreateIndex
CREATE INDEX "product_classification_entity_id_idx" ON "product_classification"("entity_id");

-- CreateIndex
CREATE INDEX "product_classification_actor_id_idx" ON "product_classification"("actor_id");

-- CreateIndex
CREATE INDEX "product_classification_name_idx" ON "product_classification"("name");

-- CreateIndex
CREATE INDEX "product_classification_namespace_idx" ON "product_classification"("namespace");

-- CreateIndex
CREATE INDEX "product_classification_deleted_at_idx" ON "product_classification"("deleted_at");

-- CreateIndex
CREATE INDEX "product_classification_entity_id_name_idx" ON "product_classification"("entity_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "product_classification_entity_id_name_key" ON "product_classification"("entity_id", "name");

-- AddForeignKey
ALTER TABLE "product_entity" ADD CONSTRAINT "product_entity_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "product_actor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_provenance_edge" ADD CONSTRAINT "product_provenance_edge_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "product_actor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_provenance_input" ADD CONSTRAINT "product_provenance_input_provenance_edge_id_fkey" FOREIGN KEY ("provenance_edge_id") REFERENCES "product_provenance_edge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_provenance_input" ADD CONSTRAINT "product_provenance_input_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "product_entity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_provenance_output" ADD CONSTRAINT "product_provenance_output_provenance_edge_id_fkey" FOREIGN KEY ("provenance_edge_id") REFERENCES "product_provenance_edge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_provenance_output" ADD CONSTRAINT "product_provenance_output_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "product_entity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_classification" ADD CONSTRAINT "product_classification_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "product_entity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_classification" ADD CONSTRAINT "product_classification_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "product_actor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_classification" ADD CONSTRAINT "product_classification_supersedes_id_fkey" FOREIGN KEY ("supersedes_id") REFERENCES "product_classification"("id") ON DELETE SET NULL ON UPDATE CASCADE;
