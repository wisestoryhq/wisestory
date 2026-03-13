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

# Generate Prisma client, then build agent-service and its dependencies
RUN pnpm --filter @wisestory/db exec prisma generate
RUN pnpm turbo build --filter=@wisestory/agent-service

# ---- Runner ----
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy the full workspace — agent-service needs node_modules for runtime imports
# of workspace packages (contracts, db, prompts, types) which are TS source
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
COPY --from=build /app/apps/agent-service/dist ./apps/agent-service/dist
COPY --from=build /app/apps/agent-service/package.json ./apps/agent-service/
COPY --from=build /app/apps/agent-service/node_modules ./apps/agent-service/node_modules
COPY --from=build /app/packages ./packages

EXPOSE 3001
ENV PORT=3001

CMD ["node", "apps/agent-service/dist/index.js"]
