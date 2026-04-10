import type { Request, Response } from 'express'
import { prisma } from '../config/database.js'
import { sendSuccess, sendError } from '../helpers/response.helper.js'
import { createSchema, updateSchema, listQuerySchema } from '../validations/project.validation.js'
import { messages } from '../config/messages.js'

export async function list(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id

  const { error: queryError, value: query } = listQuerySchema.validate(req.query)
  if (queryError) {
    sendError(res, messages.common.validationFailed, 400)
    return
  }

  const page: number = query.page
  const limit: number = query.limit
  const skip = (page - 1) * limit

  const where = {
    OR: [
      { ownerId: userId },
      { tasks: { some: { assigneeId: userId } } },
    ],
  }

  const [projects, total] = await prisma.$transaction([
    prisma.project.findMany({
      where,
      include: { _count: { select: { tasks: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.project.count({ where }),
  ])

  sendSuccess(res, { data: projects, total, page, limit }, 200, messages.project.listed)
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
    sendError(res, messages.common.validationFailed, 400, fields)
    return
  }

  const project = await prisma.project.create({
    data: { name: value.name, description: value.description, ownerId: req.user!.id },
  })

  sendSuccess(res, project, 201, messages.project.created)
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
    sendError(res, messages.common.notFound, 404)
    return
  }

  sendSuccess(res, project, 200, messages.project.fetched)
}

export async function update(req: Request, res: Response): Promise<void> {
  const id = String(req.params['id'])
  const project = await prisma.project.findUnique({ where: { id } })
  if (!project) {
    sendError(res, messages.common.notFound, 404)
    return
  }

  if (project.ownerId !== req.user!.id) {
    sendError(res, messages.common.forbidden, 403)
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
    sendError(res, messages.common.validationFailed, 400, fields)
    return
  }

  const updated = await prisma.project.update({
    where: { id: project.id },
    data: value,
  })

  sendSuccess(res, updated, 200, messages.project.updated)
}

export async function deleteProject(req: Request, res: Response): Promise<void> {
  const id = String(req.params['id'])
  const project = await prisma.project.findUnique({ where: { id } })
  if (!project) {
    sendError(res, messages.common.notFound, 404)
    return
  }

  if (project.ownerId !== req.user!.id) {
    sendError(res, messages.common.forbidden, 403)
    return
  }

  await prisma.project.delete({ where: { id: project.id } })
  sendSuccess(res, null, 200, messages.project.deleted)
}

export async function getStats(req: Request, res: Response): Promise<void> {
  const id = String(req.params['id'])
  const project = await prisma.project.findUnique({ where: { id } })
  if (!project) {
    sendError(res, messages.common.notFound, 404)
    return
  }

  const [todo, in_progress, done, tasks] = await prisma.$transaction([
    prisma.task.count({ where: { projectId: id, status: 'todo' } }),
    prisma.task.count({ where: { projectId: id, status: 'in_progress' } }),
    prisma.task.count({ where: { projectId: id, status: 'done' } }),
    prisma.task.findMany({
      where: { projectId: id, assigneeId: { not: null } },
      select: { assigneeId: true, assignee: { select: { id: true, name: true } } },
    }),
  ])

  const byStatus = { todo, in_progress, done }

  const countMap = new Map<string, { name: string; count: number }>()
  for (const t of tasks) {
    if (!t.assigneeId || !t.assignee) continue
    const entry = countMap.get(t.assigneeId)
    if (entry) {
      entry.count += 1
    } else {
      countMap.set(t.assigneeId, { name: t.assignee.name, count: 1 })
    }
  }

  const byAssignee = Array.from(countMap.entries()).map(([userId, { name, count }]) => ({
    userId,
    name,
    count,
  }))

  sendSuccess(res, { byStatus, byAssignee }, 200, messages.project.statsRetrieved)
}
