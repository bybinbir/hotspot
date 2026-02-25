FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY apps/admin/package.json apps/admin/
COPY packages/shared-types/package.json packages/shared-types/

RUN pnpm install --frozen-lockfile || pnpm install

COPY packages/shared-types/ packages/shared-types/
COPY apps/admin/ apps/admin/

WORKDIR /app/apps/admin
RUN pnpm build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/apps/admin/.next/standalone ./
COPY --from=builder /app/apps/admin/.next/static ./.next/static
COPY --from=builder /app/apps/admin/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
