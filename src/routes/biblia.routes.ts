import { FastifyInstance } from 'fastify';
import { BibleController } from '../controllers/bible.controller.js';
import { bibleApiExamples } from '../docs/bible-api-examples.js';
import { BibleServiceContract } from '../types/crud.types.js';

export const bibliaRoutes = (app: FastifyInstance, service: BibleServiceContract): void => {
  const controller = new BibleController(service);

  app.get('/biblia/testaments', controller.getTestaments);
  app.get('/biblia/examples', async () => ({ data: bibleApiExamples }));
  app.get('/biblia/versions', controller.getVersions);
  app.get('/biblia/books', controller.getBooks);
  app.get('/biblia/chapters', controller.getChapters);
  app.get('/biblia/verses', controller.getVerses);
  app.get('/biblia/search', controller.searchExactWords);
};
