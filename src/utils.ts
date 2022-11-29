import { Request, Response, NextFunction } from 'express';
import { Query } from 'express-serve-static-core';
import Logger from './logger';

const logger = Logger('express');

export const asyncHandler =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any

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

  if (req.originalUrl.match(/api\/health/i)) {
    return next();
  }

  res.once('finish', () => {
    logger.info(
      [
        req.ip,
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
    logger.debug(body);
    return origJson.call(res, body);
  };

  next();
};
