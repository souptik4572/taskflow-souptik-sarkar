import { Router } from 'express'
import { authenticate } from '../middlewares/auth.middleware.js'
import { list, create, getById, update, deleteTask } from '../controllers/task.controller.js'

const router = Router()

router.use(authenticate)

router.get('/projects/:id/tasks', list)
router.post('/projects/:id/tasks', create)
router.get('/tasks/:id', getById)
router.patch('/tasks/:id', update)
router.delete('/tasks/:id', deleteTask)

export { router as taskRouter }
