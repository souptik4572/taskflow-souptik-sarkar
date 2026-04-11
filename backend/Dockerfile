# Stage 1: builder
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

RUN npx prisma generate

COPY tsconfig.json tsconfig.seed.json ./
COPY src ./src/

RUN npm run build

# Stage 2: runtime
FROM node:20-alpine AS runtime

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma/
COPY scripts ./scripts/

RUN chmod +x scripts/migrate-and-start.sh

EXPOSE 8000

CMD ["sh", "scripts/migrate-and-start.sh"]
