import type { Response } from 'express'

export function sendSuccess(res: Response, data: unknown, status = 200): void {
  res.status(status).json(data)
}

export function sendError(
  res: Response,
  message: string,
  status = 500,
  fields?: Record<string, string>
): void {
  const body: { error: string; fields?: Record<string, string> } = { error: message }
  if (fields) {
    body.fields = fields
  }
  res.status(status).json(body)
}
