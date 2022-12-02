import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { Level } from 'level';
import { SRC_CONTRACT, REDIS_OPTIONS } from './config';

export interface OrgId {
  orgId: string;
  orgIdNorm: string;
  orgJsonUri: string;
  parentOrgId: string;
  owner: string;
  isActive: boolean;
  orgJson: Record<string, unknown> | null;
}

export const queueName = 'migration';

export const redisDb = new IORedis({
  ...REDIS_OPTIONS,
  maxRetriesPerRequest: null,
});

export const requestKey = (did: string): string => `request_${did}`;

export const migrationQueue = new Queue(queueName, {
  connection: redisDb,
  defaultJobOptions: {
    attempts: 30,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});

export const source = new Level<string, OrgId>(`${SRC_CONTRACT}.level`, {
  valueEncoding: 'json',
});
