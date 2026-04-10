import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { app } from '../app.js'
import { prisma } from '../config/database.js'

const TEST_EMAIL = `test_${Date.now()}@example.com`
const TEST_PASSWORD = 'password123'
const TEST_NAME = 'Integration Test User'

afterAll(async () => {
  // Clean up in FK-safe order: tasks → projects → users
  const testUsers = await prisma.user.findMany({
    where: { email: { startsWith: 'test_' } },
    select: { id: true },
  })
  const testIds = testUsers.map((u) => u.id)
  if (testIds.length) {
    const testProjects = await prisma.project.findMany({
      where: { ownerId: { in: testIds } },
      select: { id: true },
    })
    const projectIds = testProjects.map((p) => p.id)
    if (projectIds.length) {
      await prisma.task.deleteMany({ where: { projectId: { in: projectIds } } })
      await prisma.project.deleteMany({ where: { id: { in: projectIds } } })
    }
    await prisma.user.deleteMany({ where: { id: { in: testIds } } })
  }
  await prisma.$disconnect()
})

describe('POST /api/v1/auth/register', () => {
  it('registers a new user and returns token + user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: TEST_NAME, email: TEST_EMAIL, password: TEST_PASSWORD })

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('token')
    expect(res.body.user).toMatchObject({ email: TEST_EMAIL, name: TEST_NAME })
    expect(res.body.user).not.toHaveProperty('password')
  })

  it('returns 409 when email is already registered', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: TEST_NAME, email: TEST_EMAIL, password: TEST_PASSWORD })

    expect(res.status).toBe(409)
    expect(res.body.error).toBe('email already in use')
  })

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'missing@example.com' })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('validation failed')
    expect(res.body.fields).toHaveProperty('name')
    expect(res.body.fields).toHaveProperty('password')
  })
})

describe('POST /api/v1/auth/login', () => {
  it('logs in with correct credentials and returns token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD })

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('token')
    expect(res.body.user).toMatchObject({ email: TEST_EMAIL })
    expect(res.body.user).not.toHaveProperty('password')
  })

  it('returns 401 with wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: TEST_EMAIL, password: 'wrongpassword' })

    expect(res.status).toBe(401)
    expect(res.body.error).toBe('invalid credentials')
  })

  it('returns 401 for non-existent email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@example.com', password: 'anything' })

    expect(res.status).toBe(401)
    expect(res.body.error).toBe('invalid credentials')
  })
})

describe('GET /api/v1/projects (protected route)', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/v1/projects')

    expect(res.status).toBe(401)
    expect(res.body.error).toBe('unauthorized')
  })

  it('returns 401 with a malformed token', async () => {
    const res = await request(app)
      .get('/api/v1/projects')
      .set('Authorization', 'Bearer not_a_real_token')

    expect(res.status).toBe(401)
  })

  it('returns 200 with a valid token', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD })

    const { token } = loginRes.body as { token: string }

    const res = await request(app)
      .get('/api/v1/projects')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('data')
    expect(Array.isArray(res.body.data)).toBe(true)
  })
})
