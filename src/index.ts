/* eslint-disable @typescript-eslint/no-unused-vars */
import 'reflect-metadata';
import { Container } from 'typedi';
import { Server } from './server';

process.once('unhandledRejection', async (error) => {
  console.log(error);
  process.exit(1);
});

const main = async (): Promise<void> => {
  const server = Container.get<Server>(Server);
  const httpServer = await server.start();

  // Graceful Shutdown handler
  process.once('SIGTERM', async () => {
    await server.stop();
  });

  httpServer.on('error', (err) => {
    // @todo log the error
  });
};

export default main().catch(async (err) => {
  process.exit(1);
});
