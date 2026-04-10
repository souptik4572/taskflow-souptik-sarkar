import type { Request, Response } from 'express'
import { prisma } from '../config/database.js'
import { sendSuccess, sendError } from '../helpers/response.helper.js'
import { createSchema, updateSchema } from '../validations/project.validation.js'

export async function list(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id

  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { ownerId: userId },
        { tasks: { some: { assigneeId: userId } } },
      ],
    },
    include: {
      _count: { select: { tasks: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  sendSuccess(res, { projects })
}

export async function create(req: Request, res: Response): Promise<void> {
  const { error, value } = createSchema.validate(req.body, { abortEarly: false })
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

  const project = await prisma.project.create({
    data: { name: value.name, description: value.description, ownerId: req.user!.id },
  })

  sendSuccess(res, project, 201)
}

export async function getById(req: Request, res: Response): Promise<void> {
  const id = String(req.params['id'])
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      tasks: {
        include: {
          assignee: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      owner: { select: { id: true, name: true, email: true } },
    },
  })

  if (!project) {
    sendError(res, 'not found', 404)
    return
  }

  sendSuccess(res, project)
}

export async function update(req: Request, res: Response): Promise<void> {
  const id = String(req.params['id'])
  const project = await prisma.project.findUnique({ where: { id } })
  if (!project) {
    sendError(res, 'not found', 404)
    return
  }

  if (project.ownerId !== req.user!.id) {
    sendError(res, 'forbidden', 403)
    return
  }

  const { error, value } = updateSchema.validate(req.body, { abortEarly: false })
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

  const updated = await prisma.project.update({
    where: { id: project.id },
    data: value,
  })

  sendSuccess(res, updated)
}

export async function deleteProject(req: Request, res: Response): Promise<void> {
  const id = String(req.params['id'])
  const project = await prisma.project.findUnique({ where: { id } })
  if (!project) {
    sendError(res, 'not found', 404)
    return
  }

  if (project.ownerId !== req.user!.id) {
    sendError(res, 'forbidden', 403)
    return
  }

  await prisma.project.delete({ where: { id: project.id } })
  res.status(204).send()
}
