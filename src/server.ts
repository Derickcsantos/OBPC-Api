import { createApp } from './app.js';
import { env } from './config/env.js';

const startServer = async (): Promise<void> => {
  const app = await createApp();

  try {
    await app.listen({
      host: '0.0.0.0',
      port: env.PORT,
    });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

void startServer();
