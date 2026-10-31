# Stage 1: Base image
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl

# Stage 2: Dependencies
FROM base AS dependencies
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Stage 3: Production Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/prisma ./prisma
COPY src ./src

EXPOSE 5000

USER node

CMD ["node", "src/server.js"]
