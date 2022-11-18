import { Request, Response, NextFunction } from 'express';

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
  console.log(error);
  res.status(error.status || 500).json({
    message: error.message || 'Unknown server error',
  });
};
