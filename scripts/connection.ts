import { resolve } from 'path';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { Level } from 'level';
import { REDIS_OPTIONS } from '../src/config';

const queueName = 'migration';

export const connection = new IORedis({
  ...REDIS_OPTIONS,
  maxRetriesPerRequest: null,
});

export const migrationQueue = new Queue(queueName, {
  connection,
});

export const requests = new Level<string, string>(resolve('../requests.level'));
