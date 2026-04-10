import { Router } from 'express'
import { authenticate } from '../middlewares/auth.middleware.js'
import {
  list,
  create,
  getById,
  update,
  deleteProject,
} from '../controllers/project.controller.js'

const router = Router()

router.use(authenticate)

router.get('/', list)
router.post('/', create)
router.get('/:id', getById)
router.patch('/:id', update)
router.delete('/:id', deleteProject)

export { router as projectRouter }
