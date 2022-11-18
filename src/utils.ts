import { Request, Response, NextFunction } from 'express';
import { Query } from 'express-serve-static-core';

export const asyncHandler =
  <Params = unknown, Body = unknown, Q = Query, Resp = unknown>(
    cb: (
      req: Request<Params, Resp, Body, Q>,
      res: Response<Resp>,
      next: NextFunction
    ) => void
  ) =>
  (
    req: Request<Params, Resp, Body, Q>,
    res: Response<Resp>,
    next: NextFunction
  ) =>
    Promise.resolve(cb(req, res, next)).catch(next);
