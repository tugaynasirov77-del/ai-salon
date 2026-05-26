-- AlterTable
ALTER TABLE "Salon" ADD COLUMN     "yclientsCompanyId" TEXT,
ADD COLUMN     "yclientsServiceMap" JSONB,
ADD COLUMN     "yclientsStaffMap" JSONB,
ADD COLUMN     "yclientsUserToken" TEXT;
