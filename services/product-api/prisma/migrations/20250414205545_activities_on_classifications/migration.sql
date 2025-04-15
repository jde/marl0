-- AlterTable
ALTER TABLE "product_classification" ADD COLUMN     "activityId" TEXT;

-- AddForeignKey
ALTER TABLE "product_classification" ADD CONSTRAINT "product_classification_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "product_activity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
