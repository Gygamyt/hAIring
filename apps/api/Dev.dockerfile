FROM node:20

WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/ packages/
RUN pnpm install --frozen-lockfile --prod=false
COPY . .
WORKDIR /app/apps/api
EXPOSE 3001
#RUN chown -R node:node /app
#USER node
CMD ["pnpm", "run", "start:dev"]