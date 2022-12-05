/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from 'express';
import { Query } from 'express-serve-static-core';
import { BufferTokenizer } from 'strtok3/lib/BufferTokenizer';
import Logger from './logger';

const logger = Logger('express');

export const asyncHandler =
  <
    Params = unknown,
    Body = unknown,
    Q = Query,
    Resp = unknown,
    Locals extends Record<string, any> = Record<string, any>
  >(
    cb: (
      req: Request<Params, Resp, Body, Q, Locals>,
      res: Response<Resp>,
      next: NextFunction
    ) => void
  ) =>
  (
    req: Request<Params, Resp, Body, Q, Locals>,
    res: Response<Resp>,
    next: NextFunction
  ) =>
    Promise.resolve(cb(req, res, next)).catch(next);

export const expressLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const startTime = process.hrtime();

  const ignoreChecks = [/api\/health/i, /api\/dids/i]
    .map((r) => r.exec(req.originalUrl))
    .find((c) => c !== null);

  if (ignoreChecks) {
    return next();
  }

  res.once('finish', () => {
    logger.info(
      [
        res.hasHeader('x-forwarded-for')
          ? res.getHeader('x-forwarded-for')
          : res.hasHeader('x-real-ip')
          ? res.getHeader('x-real-ip')
          : req.socket.remoteAddress || req.ip,
        req.method,
        req.originalUrl,
        JSON.stringify(req.params),
        res.statusCode || '',
        res.statusMessage || '',
        res.hasHeader('content-type') ? res.getHeader('content-type') : '',
        res.hasHeader('content-length') ? res.getHeader('content-length') : '',
        `${process.hrtime(startTime)}ms`,
      ].join(' ')
    );
  });

  const origJson = res.json;
  res.json = (body) => {
    res.locals.body = body;
    // logger.debug(body);
    return origJson.call(res, body);
  };

  next();
};

// Returns file type from its buffer
export const imageFileTypeFromBuffer = async (
  tokenizer: BufferTokenizer
): Promise<string> => {
  const check = (buffer: Buffer, headers: any[], options: any) => {
    options = {
      offset: 0,
      ...options,
    };
    for (const [index, header] of headers.entries()) {
      // If a bitmask is set
      if (options.mask) {
        // If header doesn't equal `buf` with bits masked off
        if (header !== (options.mask[index] & buffer[index + options.offset])) {
          return false;
        }
      } else if (header !== buffer[index + options.offset]) {
        return false;
      }
    }
    return true;
  };

  const buf = Buffer.alloc(4100);

  if (tokenizer.fileInfo.size === undefined) {
    tokenizer.fileInfo.size = Number.MAX_SAFE_INTEGER;
  }

  await tokenizer.peekBuffer(buf, { length: 12, mayBeLess: true });

  if (check(buf, [0x47, 0x49, 0x46], {})) {
    return 'gif';
  }

  if (check(buf, [0x42, 0x4d], {})) {
    return 'bmp';
  }

  if (check(buf, [0xff, 0xd8, 0xff], {})) {
    return 'jpg';
  }

  if (check(buf, [0x42, 0x50, 0x47, 0xfb], {})) {
    return 'bpg';
  }

  if (check(buf, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], {})) {
    return 'png';
  }

  if (check(buf, [0x00, 0x00, 0x01, 0x00], {})) {
    return 'ico';
  }

  if (check(buf, [0x00, 0x00, 0x02, 0x00], {})) {
    return 'cur';
  }

  throw new Error('Unknown image type');
};

// Generates simple unique Id
export const simpleUid = (length = 11): string => {
  if (length < 5 || length > 11) {
    throw new Error('length value must be between 5 and 11');
  }
  return Math.random().toString(16).substr(2, length);
};
