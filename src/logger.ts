// eslint-disable no-console
import { inspect } from 'util';
import { LOG_LEVEL } from './config';
import kleur from 'kleur';

export interface LoggerApi {
  error: (...message: unknown[]) => void;
  debug: (...message: unknown[]) => void;
  info: (...message: unknown[]) => void;
}

export const parseLogLevel = (level: string): number => {
  switch (level) {
    case 'error':
      return 1;
    case 'info':
      return 3;
    case 'debug':
      return 3;
    case 'none':
    default:
      return 0;
  }
};

export const logLevel = parseLogLevel(LOG_LEVEL);

export const withPrettyObjects = (args: unknown[]): unknown[] =>
  args.map((a) =>
    typeof a === 'object'
      ? inspect(a, {
          depth: Infinity,
          colors: true,
        })
      : a
  );

const Logger = (subject: string): LoggerApi => ({
  error: (...args) => {
    if (logLevel >= 1) {
      console.log(...[kleur.red(`${subject}:`), ...withPrettyObjects(args)]);
    }
  },
  info: (...args) => {
    if (logLevel >= 2) {
      console.log(...[kleur.green(`${subject}:`), ...withPrettyObjects(args)]);
    }
  },
  debug: (...args) => {
    if (logLevel >= 3) {
      console.log(...[kleur.blue(`${subject}:`), ...withPrettyObjects(args)]);
    }
  },
});

export default Logger;
