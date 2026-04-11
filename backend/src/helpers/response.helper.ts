import type { Response } from 'express'
import type { ValidationError } from 'joi'
import { StatusCodes } from 'http-status-codes'

/**
 * Sends a successful JSON response.
 * The `message` is always included. If `data` is a plain object its keys are
 * merged at the top level so existing response shapes are preserved; arrays
 * and primitives are placed under a `data` key.
 */
export function sendSuccess(
  res: Response,
  data: unknown,
  status = StatusCodes.OK,
  message?: string
): void {
  let body: Record<string, unknown> =
    typeof data === 'object' && data !== null && !Array.isArray(data)
      ? { ...(data as Record<string, unknown>) }
      : { data }

  if (message !== undefined) {
    body = { message, ...body }
  }

  res.status(status).json(body)
}

export function sendError(
  res: Response,
  error: string,
  status = StatusCodes.INTERNAL_SERVER_ERROR,
  fields?: Record<string, string>
): void {
  const body: { error: string; fields?: Record<string, string> } = { error }
  if (fields) {
    body.fields = fields
  }
  res.status(status).json(body)
}

/**
 * Extracts per-field validation messages from a Joi ValidationError.
 * Keys are the field names; values are human-readable messages with quotes stripped.
 */
export function formatJoiErrors(error: ValidationError): Record<string, string> {
  const fields: Record<string, string> = {}
  for (const detail of error.details) {
    if (detail.context?.key) {
      fields[detail.context.key] = detail.message.replace(/['"]/g, '')
    }
  }
  return fields
}
