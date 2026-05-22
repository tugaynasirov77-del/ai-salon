-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "webchatId" TEXT;

-- CreateIndex
CREATE INDEX "Client_webchatId_idx" ON "Client"("webchatId");
