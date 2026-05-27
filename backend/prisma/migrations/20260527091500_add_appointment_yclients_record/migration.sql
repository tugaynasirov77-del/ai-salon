-- Двусторонняя синхронизация с YClients: храним их recordId и источник записи.
ALTER TABLE "Appointment" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'ai';
ALTER TABLE "Appointment" ADD COLUMN "yclientsRecordId" TEXT;
CREATE UNIQUE INDEX "Appointment_yclientsRecordId_key" ON "Appointment"("yclientsRecordId");
