-- AlterTable
ALTER TABLE "product_classification" ADD COLUMN     "supersedesId" TEXT;

-- AddForeignKey
ALTER TABLE "product_classification" ADD CONSTRAINT "product_classification_supersedesId_fkey" FOREIGN KEY ("supersedesId") REFERENCES "product_classification"("id") ON DELETE SET NULL ON UPDATE CASCADE;
