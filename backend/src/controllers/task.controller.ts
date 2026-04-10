import type { Request, Response } from 'express'
import type { TaskStatus, TaskPriority } from '@prisma/client'
import { prisma } from '../config/database.js'
import { sendSuccess, sendError } from '../helpers/response.helper.js'
import { createSchema, updateSchema, listQuerySchema } from '../validations/task.validation.js'

export async function list(req: Request, res: Response): Promise<void> {
  const { error: queryError, value: query } = listQuerySchema.validate(req.query)
  if (queryError) {
    sendError(res, 'validation failed', 400)
    return
  }

  const projectId = String(req.params['id'])
  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) {
    sendError(res, 'not found', 404)
    return
  }

  const page: number = query.page
  const limit: number = query.limit
  const skip = (page - 1) * limit

  const where: {
    projectId: string
    status?: TaskStatus
    assigneeId?: string
  } = { projectId: project.id }

  if (query.status) where.status = query.status as TaskStatus
  if (query.assignee) where.assigneeId = query.assignee

  const [tasks, total] = await prisma.$transaction([
    prisma.task.findMany({
      where,
      include: { assignee: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.task.count({ where }),
  ])

  sendSuccess(res, { data: tasks, total, page, limit })
}

export async function create(req: Request, res: Response): Promise<void> {
  const projectId = String(req.params['id'])
  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) {
    sendError(res, 'not found', 404)
    return
  }

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

  const task = await prisma.task.create({
    data: {
      title: value.title,
      description: value.description ?? null,
      priority: (value.priority as TaskPriority) ?? 'medium',
      assigneeId: value.assigneeId ?? null,
      dueDate: value.dueDate ? new Date(value.dueDate) : null,
      projectId: project.id,
      creatorId: req.user!.id,
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
    },
  })

  sendSuccess(res, task, 201)
}

export async function update(req: Request, res: Response): Promise<void> {
  const taskId = String(req.params['id'])
  const task = await prisma.task.findUnique({ where: { id: taskId } })
  if (!task) {
    sendError(res, 'not found', 404)
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

  const updated = await prisma.task.update({
    where: { id: task.id },
    data: {
      ...(value.title !== undefined && { title: value.title }),
      ...(value.description !== undefined && { description: value.description }),
      ...(value.status !== undefined && { status: value.status as TaskStatus }),
      ...(value.priority !== undefined && { priority: value.priority as TaskPriority }),
      ...('assigneeId' in value && { assigneeId: value.assigneeId }),
      ...(value.dueDate !== undefined && {
        dueDate: value.dueDate ? new Date(value.dueDate) : null,
      }),
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
    },
  })

  sendSuccess(res, updated)
}

export async function deleteTask(req: Request, res: Response): Promise<void> {
  const taskId = String(req.params['id'])
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: { select: { ownerId: true } } },
  })

  if (!task) {
    sendError(res, 'not found', 404)
    return
  }

  const userId = req.user!.id
  if (task.project.ownerId !== userId && task.creatorId !== userId) {
    sendError(res, 'forbidden', 403)
    return
  }

  await prisma.task.delete({ where: { id: task.id } })
  res.status(204).send()
}
