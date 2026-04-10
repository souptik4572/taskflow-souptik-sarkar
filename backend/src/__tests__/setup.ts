import { config } from 'dotenv'

// Load test env — falls back to .env if .env.test is absent
config({ path: '.env.test', override: false })
config({ path: '.env', override: false })
