import path from 'path';
import { readFile } from 'fs';
import { DateTime } from 'luxon';
import { Health } from '../types';
import { redisDb } from '../connection';

export const getCommitHash = (): Promise<string> =>
  new Promise((resolve) => {
    try {
      readFile(
        path.resolve(process.cwd(), './.git/ORIG_HEAD'),
        'utf8',
        (error, data) => {
          if (error) {
            return resolve('');
          }
          resolve(data.trim());
        }
      );
    } catch {
      resolve('');
    }
  });

export const getRedisStatus = (): string =>
  redisDb ? redisDb.status : 'disconnected';

export const getHealthReport = async (): Promise<Health> => ({
  commit: await getCommitHash(),
  time: DateTime.now().toISO(),
  redis: getRedisStatus(),
});
