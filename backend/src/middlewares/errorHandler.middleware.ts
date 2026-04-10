import type { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import { config } from '../config/env.js'
import { messages } from '../config/messages.js'

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const logger = req.log ?? console
  logger.error({ err }, 'unhandled error')

  if (config.nodeEnv === 'development') {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: err.message, stack: err.stack })
    return
  }

  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: messages.common.internalError })
}
