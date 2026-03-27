import { logger } from '../../utils/logger.js';

export function errorHandler(err, req, res, next) {
  logger.error(`API Error: ${err.message}`, {
    path: req.path,
    method: req.method,
    stack: err.stack,
  });

  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500,
    },
  });
}