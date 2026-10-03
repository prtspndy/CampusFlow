import { app } from './app.js';
import { env } from './config/env.js';
import { prisma } from './lib/prisma.js';

const server = app.listen(env.PORT, () => {
  console.log(`🚀 CampusFlow Backend running in [${env.NODE_ENV}] mode`);
  console.log(`📡 Server listening at http://localhost:${env.PORT}`);
  console.log(`📚 Swagger documentation: http://localhost:${env.PORT}${env.API_PREFIX}/docs`);
  console.log(`💓 Liveness probe: http://localhost:${env.PORT}${env.API_PREFIX}/health`);
  console.log(`🔍 Readiness probe: http://localhost:${env.PORT}${env.API_PREFIX}/health/ready`);
});

const gracefulShutdown = (signal: string): void => {
  console.log(`\n🛑 Received ${signal}. Initiating graceful shutdown...`);

  server.close(async () => {
    console.log('🔒 HTTP server closed.');
    try {
      await prisma.$disconnect();
      console.log('📦 Prisma database connections closed.');
      process.exit(0);
    } catch (err) {
      console.error('❌ Error during Prisma disconnection:', err);
      process.exit(1);
    }
  });

  // Force exit if hanging connections prevent clean shutdown within 10s
  setTimeout(() => {
    console.error('⚠️ Forcefully terminating process after shutdown timeout');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[FATAL] Uncaught Exception:', error);
  process.exit(1);
});
