import Joi from 'joi'

export const createSchema = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(1000).optional().allow(''),
})

export const updateSchema = Joi.object({
  name: Joi.string().min(1).max(200).optional(),
  description: Joi.string().max(1000).optional().allow('', null),
}).min(1)
