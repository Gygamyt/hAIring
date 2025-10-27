FROM node:20-alpine AS base
RUN apk add --no-cache ffmpeg

WORKDIR /app
RUN npm install -g pnpm

FROM base AS development

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/worker/package.json ./apps/worker/
COPY apps/api/package.json ./apps/api/
COPY packages/ai-pipelines/package.json ./packages/ai-pipelines/
COPY packages/nest-ai/package.json ./packages/nest-ai/
COPY packages/google-drive/package.json ./packages/google-drive/
COPY packages/transcription/package.json ./packages/transcription/
COPY packages/document-parser/package.json ./packages/document-parser/
COPY packages/utils/package.json ./packages/utils/
RUN pnpm install --frozen-lockfile --prod=false
COPY . .
WORKDIR /app/apps/worker
# EXPOSE 9229
CMD ["pnpm", "run", "start:dev"]