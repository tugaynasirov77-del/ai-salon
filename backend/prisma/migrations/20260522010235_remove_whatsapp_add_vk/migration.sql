/*
  Warnings:

  - You are about to drop the column `whatsappId` on the `Client` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Client" DROP COLUMN "whatsappId",
ADD COLUMN     "vkId" TEXT;
