// ============================================
// FlowForge — Prisma Database Client
// ============================================
// This file creates a single database connection that is reused everywhere.
// In development, we store it on `globalThis` to prevent too many connections
// (hot-reloading creates a new connection each time without this trick).

import { PrismaClient } from '@prisma/client';

// Declare a global variable to hold the Prisma client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Reuse existing client or create a new one
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

// In development, save the client globally so it's reused on hot-reload
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
