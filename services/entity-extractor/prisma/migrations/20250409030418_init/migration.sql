-- CreateTable
CREATE TABLE "Entity" (
    "id" SERIAL NOT NULL,
    "value" TEXT NOT NULL,
    "source" TEXT,
    "author" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Entity_pkey" PRIMARY KEY ("id")
);
