import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

export function notFound(req, _res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(error, _req, res, _next) {
  if (error instanceof ZodError) {
    return res.status(400).json({
      message: 'Validation failed',
      details: error.flatten()
    });
  }

  const statusCode = error instanceof ApiError ? error.statusCode : 500;
  const message = statusCode === 500 ? 'Internal server error' : error.message;

  if (statusCode >= 500) {
    logger.error(error);
  }

  return res.status(statusCode).json({
    message,
    details: error.details,
    stack: env.NODE_ENV === 'development' ? error.stack : undefined
  });
}

