# ---- Base ----
FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.20.0 --activate

# ---- Dependencies ----
FROM base AS deps
WORKDIR /app

# Copy workspace root configs + all package.json files for install
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json tsconfig.base.json ./
COPY apps/web/package.json apps/web/
COPY apps/agent-service/package.json apps/agent-service/
COPY packages/db/package.json packages/db/
COPY packages/auth/package.json packages/auth/
COPY packages/contracts/package.json packages/contracts/
COPY packages/prompts/package.json packages/prompts/
COPY packages/types/package.json packages/types/
COPY packages/ui/package.json packages/ui/

RUN pnpm install --frozen-lockfile

# ---- Build ----
FROM deps AS build
WORKDIR /app

# Copy all source code
COPY . .

# Generate Prisma client, then build web and its dependencies
RUN pnpm --filter @wisestory/db exec prisma generate
RUN pnpm turbo build --filter=@wisestory/web

# ---- Runner ----
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy standalone output (includes node_modules and internal packages)
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]
