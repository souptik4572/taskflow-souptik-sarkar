import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('password123', 12)

  // ── Users ────────────────────────────────────────────────────────────────

  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      name: 'Test User',
      email: 'test@example.com',
      password: passwordHash,
    },
  })

  const alternateUser = await prisma.user.upsert({
    where: { email: 'testAlternate@example.com' },
    update: {},
    create: {
      name: 'Test Alternate',
      email: 'testAlternate@example.com',
      password: passwordHash,
    },
  })

  // ── Project owned by Test User ───────────────────────────────────────────

  const testUserProject = await prisma.project.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: '[Test User] Website Redesign',
      description: 'Q2 redesign project — owned and managed by Test User',
      ownerId: testUser.id,
    },
  })

  // Task 1 — created by Test User, assigned to Test User
  await prisma.task.upsert({
    where: { id: '00000000-0000-0000-0000-000000000010' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000010',
      title: '[Test User → Test User] Design homepage mockups',
      description: 'Created by Test User, assigned to self',
      status: 'todo',
      priority: 'high',
      projectId: testUserProject.id,
      creatorId: testUser.id,
      assigneeId: testUser.id,
      dueDate: new Date('2026-04-20'),
    },
  })

  // Task 2 — created by Test User, assigned to Test Alternate
  await prisma.task.upsert({
    where: { id: '00000000-0000-0000-0000-000000000011' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000011',
      title: '[Test User → Test Alternate] Implement auth flow',
      description: 'Created by Test User, assigned to Test Alternate',
      status: 'in_progress',
      priority: 'high',
      projectId: testUserProject.id,
      creatorId: testUser.id,
      assigneeId: alternateUser.id,
      dueDate: new Date('2026-04-25'),
    },
  })

  // Task 3 — created by Test User, assigned to Test Alternate
  await prisma.task.upsert({
    where: { id: '00000000-0000-0000-0000-000000000012' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000012',
      title: '[Test User → Test Alternate] Write API documentation',
      description: 'Created by Test User, assigned to Test Alternate',
      status: 'done',
      priority: 'low',
      projectId: testUserProject.id,
      creatorId: testUser.id,
      assigneeId: alternateUser.id,
    },
  })

  // ── Project owned by Test Alternate ─────────────────────────────────────

  const alternateUserProject = await prisma.project.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      name: '[Test Alternate] Mobile App Launch',
      description: 'Mobile launch project — owned and managed by Test Alternate',
      ownerId: alternateUser.id,
    },
  })

  // Task 4 — created by Test Alternate, assigned to Test Alternate
  await prisma.task.upsert({
    where: { id: '00000000-0000-0000-0000-000000000013' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000013',
      title: '[Test Alternate → Test Alternate] Set up CI/CD pipeline',
      description: 'Created by Test Alternate, assigned to self',
      status: 'todo',
      priority: 'medium',
      projectId: alternateUserProject.id,
      creatorId: alternateUser.id,
      assigneeId: alternateUser.id,
      dueDate: new Date('2026-05-01'),
    },
  })

  // Task 5 — created by Test Alternate, assigned to Test User
  await prisma.task.upsert({
    where: { id: '00000000-0000-0000-0000-000000000014' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000014',
      title: '[Test Alternate → Test User] Configure push notifications',
      description: 'Created by Test Alternate, assigned to Test User',
      status: 'in_progress',
      priority: 'medium',
      projectId: alternateUserProject.id,
      creatorId: alternateUser.id,
      assigneeId: testUser.id,
      dueDate: new Date('2026-05-10'),
    },
  })

  console.log('Seed complete')
  console.log(`  Users:    ${testUser.email}, ${alternateUser.email}`)
  console.log(`  Projects: "${testUserProject.name}", "${alternateUserProject.name}"`)
  console.log(`  Tasks:    3 by Test User (in ${testUserProject.name}), 2 by Test Alternate (in ${alternateUserProject.name})`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
