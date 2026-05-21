-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "cacheCreateTokens" INTEGER,
ADD COLUMN     "cacheReadTokens" INTEGER,
ADD COLUMN     "inputTokens" INTEGER,
ADD COLUMN     "outputTokens" INTEGER;
