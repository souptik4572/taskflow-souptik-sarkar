import './config/env.js'
import express from 'express'
import cors from 'cors'
import pinoHttp from 'pino-http'
import { apiRouter } from './routes/index.js'
import { errorHandler } from './middlewares/errorHandler.middleware.js'

const app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
// eslint-disable-next-line @typescript-eslint/no-explicit-any
app.use((pinoHttp as any)({ quiet: process.env['NODE_ENV'] === 'test' }))

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/v1', apiRouter)

app.use(errorHandler)

export { app }
