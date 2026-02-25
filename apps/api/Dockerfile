FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY apps/api/package.json apps/api/
COPY packages/shared-types/package.json packages/shared-types/

RUN pnpm install --frozen-lockfile || pnpm install

COPY packages/shared-types/ packages/shared-types/
COPY apps/api/ apps/api/

WORKDIR /app/apps/api
RUN pnpm build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/node_modules ./node_modules
COPY --from=builder /app/apps/api/package.json ./

EXPOSE 3001

CMD ["node", "dist/main"]
