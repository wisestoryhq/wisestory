# ---- Base ----
FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.20.0 --activate

# ---- Install ----
FROM base AS install
WORKDIR /app

# Copy everything needed (node_modules excluded via .dockerignore)
COPY . .

# Install all dependencies
RUN pnpm install --frozen-lockfile

# ---- Build ----
FROM install AS build
WORKDIR /app

# Generate Prisma client, then build agent-service and its dependencies
RUN pnpm --filter @wisestory/db exec prisma generate
RUN pnpm turbo build --filter=@wisestory/agent-service

# ---- Runner ----
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy the full workspace — agent-service needs node_modules for runtime
# imports of workspace packages (contracts, db, prompts, types)
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
COPY --from=build /app/apps/agent-service/dist ./apps/agent-service/dist
COPY --from=build /app/apps/agent-service/package.json ./apps/agent-service/
COPY --from=build /app/apps/agent-service/node_modules ./apps/agent-service/node_modules
COPY --from=build /app/packages ./packages

EXPOSE 3001
ENV PORT=3001

CMD ["node", "apps/agent-service/dist/index.js"]
