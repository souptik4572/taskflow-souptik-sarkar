import type { Request, Response, NextFunction } from 'express'
import { config } from '../config/env.js'

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const logger = req.log ?? console
  logger.error({ err }, 'unhandled error')

  if (config.nodeEnv === 'development') {
    res.status(500).json({ error: err.message, stack: err.stack })
    return
  }

  res.status(500).json({ error: 'internal server error' })
}
