import './config/env.js'
import express from 'express'
import cors from 'cors'
import pinoHttp from 'pino-http'
import { config } from './config/env.js'
import { prisma } from './config/database.js'
import { apiRouter } from './routes/index.js'
import { errorHandler } from './middlewares/errorHandler.middleware.js'

const app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
// eslint-disable-next-line @typescript-eslint/no-explicit-any
app.use((pinoHttp as any)())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/v1', apiRouter)

app.use(errorHandler)

const server = app.listen(config.port, () => {
  process.stdout.write(`Server running on port ${config.port}\n`)
})

process.on('SIGTERM', () => {
  server.close(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
})

export { app }
