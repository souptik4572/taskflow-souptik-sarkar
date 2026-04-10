import type { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../helpers/jwt.helper.js'
import { prisma } from '../config/database.js'
import { sendError } from '../helpers/response.helper.js'

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers['authorization']
  if (!authHeader?.startsWith('Bearer ')) {
    sendError(res, 'unauthorized', 401)
    return
  }

  const token = authHeader.slice(7)
  try {
    const payload = verifyToken(token)
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true },
    })

    if (!user) {
      sendError(res, 'unauthorized', 401)
      return
    }

    req.user = user
    next()
  } catch {
    sendError(res, 'unauthorized', 401)
  }
}
