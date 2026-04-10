import type { Request, Response } from 'express'
import { prisma } from '../config/database.js'
import { hashPassword, comparePassword } from '../helpers/password.helper.js'
import { signToken } from '../helpers/jwt.helper.js'
import { sendSuccess, sendError } from '../helpers/response.helper.js'
import { registerSchema, loginSchema } from '../validations/auth.validation.js'

export async function register(req: Request, res: Response): Promise<void> {
  const { error, value } = registerSchema.validate(req.body, { abortEarly: false })
  if (error) {
    const fields: Record<string, string> = {}
    for (const detail of error.details) {
      if (detail.context?.key) {
        fields[detail.context.key] = detail.message.replace(/['"]/g, '')
      }
    }
    sendError(res, 'validation failed', 400, fields)
    return
  }

  const existing = await prisma.user.findUnique({ where: { email: value.email } })
  if (existing) {
    sendError(res, 'email already in use', 409)
    return
  }

  const hashed = await hashPassword(value.password)
  const user = await prisma.user.create({
    data: { name: value.name, email: value.email, password: hashed },
    select: { id: true, name: true, email: true },
  })

  const token = signToken({ userId: user.id, email: user.email })
  sendSuccess(res, { token, user }, 201)
}

export async function login(req: Request, res: Response): Promise<void> {
  const { error, value } = loginSchema.validate(req.body, { abortEarly: false })
  if (error) {
    const fields: Record<string, string> = {}
    for (const detail of error.details) {
      if (detail.context?.key) {
        fields[detail.context.key] = detail.message.replace(/['"]/g, '')
      }
    }
    sendError(res, 'validation failed', 400, fields)
    return
  }

  const user = await prisma.user.findUnique({ where: { email: value.email } })
  if (!user) {
    sendError(res, 'invalid credentials', 401)
    return
  }

  const valid = await comparePassword(value.password, user.password)
  if (!valid) {
    sendError(res, 'invalid credentials', 401)
    return
  }

  const token = signToken({ userId: user.id, email: user.email })
  sendSuccess(res, {
    token,
    user: { id: user.id, name: user.name, email: user.email },
  })
}
