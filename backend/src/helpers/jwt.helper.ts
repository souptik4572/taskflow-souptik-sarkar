import jwt from 'jsonwebtoken'
import { config } from '../config/env.js'

export interface JwtPayload {
  userId: string
  email: string
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.accessSecretToken, { expiresIn: '24h' })
}

export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, config.accessSecretToken)
  if (typeof decoded === 'string' || !('userId' in decoded)) {
    throw new Error('invalid token payload')
  }
  return decoded as JwtPayload
}
