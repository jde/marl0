/*
  Warnings:

  - You are about to drop the column `actor_id` on the `product_classification` table. All the data in the column will be lost.
  - You are about to drop the column `deleted_at` on the `product_classification` table. All the data in the column will be lost.
  - You are about to drop the column `supersedes_id` on the `product_classification` table. All the data in the column will be lost.
  - You are about to drop the column `taxonomy_version_id` on the `product_classification` table. All the data in the column will be lost.
  - You are about to drop the column `timestamp` on the `product_classification` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `product_entity` table. All the data in the column will be lost.
  - You are about to drop the column `provenance_edge_id` on the `product_provenance_input` table. All the data in the column will be lost.
  - You are about to drop the column `provenance_edge_id` on the `product_provenance_output` table. All the data in the column will be lost.
  - You are about to drop the `product_actor` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `product_provenance_edge` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `agent_id` to the `product_classification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `product_classification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `product_entity` table without a default value. This is not possible if the table is not empty.
  - Added the required column `activity_id` to the `product_provenance_input` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `product_provenance_input` table without a default value. This is not possible if the table is not empty.
  - Added the required column `activity_id` to the `product_provenance_output` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `product_provenance_output` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "product_classification" DROP CONSTRAINT "product_classification_actor_id_fkey";

-- DropForeignKey
ALTER TABLE "product_classification" DROP CONSTRAINT "product_classification_supersedes_id_fkey";

-- DropForeignKey
ALTER TABLE "product_entity" DROP CONSTRAINT "product_entity_created_by_id_fkey";

-- DropForeignKey
ALTER TABLE "product_provenance_edge" DROP CONSTRAINT "product_provenance_edge_actor_id_fkey";

-- DropForeignKey
ALTER TABLE "product_provenance_input" DROP CONSTRAINT "product_provenance_input_provenance_edge_id_fkey";

-- DropForeignKey
ALTER TABLE "product_provenance_output" DROP CONSTRAINT "product_provenance_output_provenance_edge_id_fkey";

-- DropIndex
DROP INDEX "product_classification_actor_id_idx";

-- DropIndex
DROP INDEX "product_classification_deleted_at_idx";

-- DropIndex
DROP INDEX "product_classification_entity_id_name_idx";

-- DropIndex
DROP INDEX "product_provenance_input_entity_id_idx";

-- DropIndex
DROP INDEX "product_provenance_input_provenance_edge_id_entity_id_idx";

-- DropIndex
DROP INDEX "product_provenance_input_provenance_edge_id_idx";

-- DropIndex
DROP INDEX "product_provenance_output_entity_id_idx";

-- DropIndex
DROP INDEX "product_provenance_output_provenance_edge_id_entity_id_idx";

-- DropIndex
DROP INDEX "product_provenance_output_provenance_edge_id_idx";

-- AlterTable
ALTER TABLE "product_classification" DROP COLUMN "actor_id",
DROP COLUMN "deleted_at",
DROP COLUMN "supersedes_id",
DROP COLUMN "taxonomy_version_id",
DROP COLUMN "timestamp",
ADD COLUMN     "agent_id" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "product_entity" DROP COLUMN "created_at",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "product_provenance_input" DROP COLUMN "provenance_edge_id",
ADD COLUMN     "activity_id" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "product_provenance_output" DROP COLUMN "provenance_edge_id",
ADD COLUMN     "activity_id" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "product_actor";

-- DropTable
DROP TABLE "product_provenance_edge";

-- CreateTable
CREATE TABLE "product_activity" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "agent_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "product_activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_agent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "agent_kind" TEXT NOT NULL,
    "agent_method" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "product_agent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_activity_agent_id_idx" ON "product_activity"("agent_id");

-- CreateIndex
CREATE INDEX "product_agent_name_idx" ON "product_agent"("name");

-- CreateIndex
CREATE INDEX "product_agent_agent_kind_idx" ON "product_agent"("agent_kind");

-- CreateIndex
CREATE INDEX "product_agent_deletedAt_idx" ON "product_agent"("deletedAt");

-- CreateIndex
CREATE INDEX "product_classification_agent_id_idx" ON "product_classification"("agent_id");

-- CreateIndex
CREATE INDEX "product_provenance_input_activity_id_idx" ON "product_provenance_input"("activity_id");

-- CreateIndex
CREATE INDEX "product_provenance_input_activity_id_entity_id_idx" ON "product_provenance_input"("activity_id", "entity_id");

-- CreateIndex
CREATE INDEX "product_provenance_output_activity_id_idx" ON "product_provenance_output"("activity_id");

-- CreateIndex
CREATE INDEX "product_provenance_output_activity_id_entity_id_idx" ON "product_provenance_output"("activity_id", "entity_id");

-- AddForeignKey
ALTER TABLE "product_entity" ADD CONSTRAINT "product_entity_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "product_agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_activity" ADD CONSTRAINT "product_activity_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "product_agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_provenance_input" ADD CONSTRAINT "product_provenance_input_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "product_activity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_provenance_output" ADD CONSTRAINT "product_provenance_output_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "product_activity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_classification" ADD CONSTRAINT "product_classification_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "product_agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
