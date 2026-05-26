-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "readByOwner" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sentByOwner" BOOLEAN NOT NULL DEFAULT false;
