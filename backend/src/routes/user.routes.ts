import { Router } from 'express'
import { authenticate } from '../middlewares/auth.middleware.js'
import { listUsers } from '../controllers/user.controller.js'

const router = Router()

router.use(authenticate)

router.get('/', listUsers)

export { router as userRouter }
