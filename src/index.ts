/* eslint-disable @typescript-eslint/no-unused-vars */
import 'reflect-metadata';
import { Container } from 'typedi';
import { Server } from './server';
import Logger from './logger';

const logger = Logger('index');

process.once('unhandledRejection', async (error) => {
  logger.error(error);
  process.exit(1);
});

const main = async (): Promise<void> => {
  const server = Container.get<Server>(Server);
  const httpServer = await server.start();

  // Graceful Shutdown handler
  const shutdown = async () => {
    await server.stop();
    process.exit(0);
  };

  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);

  httpServer.on('error', (error) => {
    logger.error(error);
  });
};

export default main().catch(async (err) => {
  logger.info('Application exit');
  process.exit(1);
});
