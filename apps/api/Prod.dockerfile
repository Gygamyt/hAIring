FROM node:20 AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/ai-core/package.json ./packages/ai-core/
COPY packages/ai-pipelines/package.json ./packages/ai-pipelines/
COPY packages/document-parser/package.json ./packages/document-parser/
COPY packages/google-drive/package.json ./packages/google-drive/
COPY packages/utils/package.json ./packages/utils/

RUN pnpm install --frozen-lockfile --prod=false

FROM node:20 AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx turbo build --filter=api...

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
RUN pnpm --filter=api --prod deploy ./deploy
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/package.json ./

WORKDIR /app/apps/api

EXPOSE 3001
CMD ["node", "dist/src/main.js"]
