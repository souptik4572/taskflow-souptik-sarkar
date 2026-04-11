import './config/env.js'
import express from 'express'
import cors from 'cors'
import pinoHttp from 'pino-http'
import swaggerUi from 'swagger-ui-express'
import { apiRouter } from './routes/index.js'
import { errorHandler } from './middlewares/errorHandler.middleware.js'
import { swaggerSpec } from './config/swagger.js'

const app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
// eslint-disable-next-line @typescript-eslint/no-explicit-any
app.use((pinoHttp as any)({ quiet: process.env['NODE_ENV'] === 'test' }))

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
app.get('/api-docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.send(swaggerSpec)
})

app.use('/api/v1', apiRouter)

app.use(errorHandler)

export { app }
