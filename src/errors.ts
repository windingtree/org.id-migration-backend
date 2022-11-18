import { Request, Response, NextFunction } from 'express';
import Logger from './logger';

const logger = Logger('Express error');

export class ApiError extends Error {
  public status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const errorMiddleware = (
  error: ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  logger.error(error);
  res.status(error.status || 500).json({
    message: error.message || 'Unknown server error',
  });
};
