import app from './app';
import { config } from './config/env';
import { prisma } from './config/database';

const server = app.listen(config.port, () => {
  console.log('==================================================');
  console.log(`🚀 TaskFlow Backend Server running on port ${config.port}`);
  console.log(`🌐 Environment: ${config.nodeEnv}`);
  console.log(`📡 API Base URL: http://localhost:${config.port}/api`);
  console.log('==================================================');
});

// Graceful shutdown
async function gracefulShutdown(signal: string) {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    console.log('🔌 HTTP server closed.');
    await prisma.$disconnect();
    console.log('📦 Database connection disconnected.');
    process.exit(0);
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
