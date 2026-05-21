import { PrismaClient } from '@prisma/client';

// Singleton Prisma клиент
export const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

export default prisma;
