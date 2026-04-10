import type { Response } from 'express'

/**
 * Sends a successful JSON response.
 * The `message` is always included. If `data` is a plain object its keys are
 * merged at the top level so existing response shapes are preserved; arrays
 * and primitives are placed under a `data` key.
 */
export function sendSuccess(res: Response, data: unknown, status = 200, message?: string): void {
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
  message: string,
  status = 500,
  fields?: Record<string, string>
): void {
  const body: { message: string; fields?: Record<string, string> } = { message }
  if (fields) {
    body.fields = fields
  }
  res.status(status).json(body)
}
