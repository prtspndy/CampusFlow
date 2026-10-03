import { PrismaClient } from '@prisma/client';
import { installDevMemoryStore } from './memory-db.js';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// In local development, activate in-memory database store if USE_MEMORY_DB=true or DATABASE_URL is not a live cloud URL
const isDev = process.env.NODE_ENV === 'development';
const isMemoryForced = process.env.USE_MEMORY_DB === 'true';
const isLocalOrUnset = !process.env.DATABASE_URL || process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL === 'memory';

if (isMemoryForced || (isDev && isLocalOrUnset)) {
  installDevMemoryStore(prisma);
}
