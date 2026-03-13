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
