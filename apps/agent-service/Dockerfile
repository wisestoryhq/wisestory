# ---- Base ----
FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.20.0 --activate

# ---- Install ----
FROM base AS install
WORKDIR /app

COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @wisestory/db exec prisma generate

# ---- Runner ----
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=install /app ./

EXPOSE 3001
ENV PORT=3001

CMD ["pnpm", "--filter", "@wisestory/agent-service", "exec", "tsx", "src/index.ts"]
