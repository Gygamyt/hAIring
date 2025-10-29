FROM node:20
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile --prod=false
COPY . .
WORKDIR /app/apps/web
EXPOSE 5173
CMD ["pnpm", "run", "dev", "--", "--host", "0.0.0.0"]