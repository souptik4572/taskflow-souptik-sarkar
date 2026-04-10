import { app } from './app.js'
import { config } from './config/env.js'
import { prisma } from './config/database.js'

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
