import 'dotenv/config'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export const config = {
  databaseUrl: requireEnv('DATABASE_URL'),
  accessSecretToken: requireEnv('ACCESS_SECRET_TOKEN'),
  jwtExpiresIn: process.env['JWT_EXPIRES_IN'] ?? '24h',
  port: parseInt(process.env['PORT'] ?? '8000', 10),
  nodeEnv: process.env['NODE_ENV'] ?? 'development',
  bcryptRounds: parseInt(process.env['BCRYPT_ROUNDS'] ?? '12', 10),
} as const

if (config.bcryptRounds < 12) {
  throw new Error('BCRYPT_ROUNDS must be at least 12')
}
