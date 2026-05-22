import { IncomingMessage, ServerResponse } from 'node:http';
import { createApp } from '../src/app.js';

const appPromise = createApp().then(async (app) => {
  await app.ready();
  return app;
});

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const app = await appPromise;
  app.server.emit('request', req, res);
}
