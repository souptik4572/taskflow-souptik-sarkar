import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('password123', 12)

  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      name: 'Test User',
      email: 'test@example.com',
      password: passwordHash,
    },
  })

  const project = await prisma.project.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Website Redesign',
      description: 'Q2 redesign project',
      ownerId: user.id,
    },
  })

  await prisma.task.upsert({
    where: { id: '00000000-0000-0000-0000-000000000010' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000010',
      title: 'Design homepage',
      status: 'todo',
      priority: 'high',
      projectId: project.id,
      assigneeId: user.id,
      creatorId: user.id,
      dueDate: new Date('2026-04-20'),
    },
  })

  await prisma.task.upsert({
    where: { id: '00000000-0000-0000-0000-000000000011' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000011',
      title: 'Implement auth flow',
      status: 'in_progress',
      priority: 'medium',
      projectId: project.id,
      assigneeId: null,
      creatorId: user.id,
    },
  })

  await prisma.task.upsert({
    where: { id: '00000000-0000-0000-0000-000000000012' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000012',
      title: 'Write API documentation',
      status: 'done',
      priority: 'low',
      projectId: project.id,
      assigneeId: user.id,
      creatorId: user.id,
    },
  })

  console.log('Seed complete')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
