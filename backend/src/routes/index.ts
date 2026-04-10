import { Router } from 'express'
import { authRouter } from './auth.routes.js'
import { projectRouter } from './project.routes.js'
import { taskRouter } from './task.routes.js'

const router = Router()

router.use('/auth', authRouter)
router.use('/projects', projectRouter)
router.use('/', taskRouter)

export { router as apiRouter }
