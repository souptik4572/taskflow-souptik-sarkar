import Joi from 'joi'

export const createSchema = Joi.object({
  title: Joi.string().min(1).max(300).required(),
  description: Joi.string().max(2000).optional().allow(''),
  priority: Joi.string().valid('low', 'medium', 'high').optional(),
  assigneeId: Joi.string().uuid().optional().allow(null),
  dueDate: Joi.string().isoDate().optional().allow(null),
})

export const updateSchema = Joi.object({
  title: Joi.string().min(1).max(300).optional(),
  description: Joi.string().max(2000).optional().allow('', null),
  status: Joi.string().valid('todo', 'in_progress', 'done').optional(),
  priority: Joi.string().valid('low', 'medium', 'high').optional(),
  assigneeId: Joi.string().uuid().optional().allow(null),
  dueDate: Joi.string().isoDate().optional().allow(null),
}).min(1)

export const listQuerySchema = Joi.object({
  status: Joi.string().valid('todo', 'in_progress', 'done').optional(),
  assignee: Joi.string().uuid().optional(),
})
