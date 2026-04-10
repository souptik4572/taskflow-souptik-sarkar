import bcrypt from 'bcryptjs'
import { config } from '../config/env.js'

export async function hashPassword(plain: string): Promise<string> {
  const rounds = Math.max(config.bcryptRounds, 12)
  return bcrypt.hash(plain, rounds)
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}
