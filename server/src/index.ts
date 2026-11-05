import app from './app';
import { env } from './config/env';

const start = async () => {
  try {
    app.listen(env.PORT, () => {
      console.log(`
╔══════════════════════════════════════════╗
║          🍽️  BTMeals Server              ║
║──────────────────────────────────────────║
║  Status:  Running                        ║
║  Port:    ${String(env.PORT).padEnd(30)}║
║  Env:     ${env.NODE_ENV.padEnd(30)}║
║  Time:    ${new Date().toISOString().padEnd(30)}║
╚══════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();
