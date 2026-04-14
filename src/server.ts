import { createApp } from './app.js';
import { env } from './config/env.js';

const startServer = async (): Promise<void> => {
  const app = await createApp();

  const listenOnPort = async (port: number): Promise<void> => {
    try {
      await app.listen({
        host: '0.0.0.0',
        port,
      });
    } catch (error) {
      if (error instanceof Error && 'code' in error && (error as NodeJS.ErrnoException).code === 'EADDRINUSE') {
        const fallbackPort = port + 1;
        app.log.warn(`Porta ${port} em uso. Tentando na porta ${fallbackPort}.`);
        await app.listen({
          host: '0.0.0.0',
          port: fallbackPort,
        });
        return;
      }

      throw error;
    }
  };

  try {
    await listenOnPort(env.PORT);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

void startServer();
