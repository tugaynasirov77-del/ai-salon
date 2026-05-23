-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "avitoChatId" TEXT,
ADD COLUMN     "avitoUserId" TEXT;

-- AlterTable
ALTER TABLE "Salon" ADD COLUMN     "avitoClientId" TEXT,
ADD COLUMN     "avitoClientSecret" TEXT,
ADD COLUMN     "avitoUserId" TEXT;

-- CreateIndex
CREATE INDEX "Client_avitoUserId_idx" ON "Client"("avitoUserId");
