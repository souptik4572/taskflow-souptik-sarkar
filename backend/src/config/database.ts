import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

process.on('SIGTERM', async () => {
  await prisma.$disconnect()
})

process.on('SIGINT', async () => {
  await prisma.$disconnect()
})

export { prisma }
