import type { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { prisma } from '../config/database.js'
import { sendSuccess } from '../helpers/response.helper.js'

export async function listUsers(_req: Request, res: Response): Promise<void> {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true },
    orderBy: { name: 'asc' },
  })
  sendSuccess(res, { data: users }, StatusCodes.OK)
}
