# ---- Base ----
FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.20.0 --activate

# ---- Install & Build ----
FROM base AS build
WORKDIR /app

COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @wisestory/db exec prisma generate
RUN pnpm turbo build --filter=@wisestory/agent-service

# Remove dev dependencies to shrink image
RUN CI=true pnpm prune --prod

# ---- Runner ----
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy workspace structure needed at runtime
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
COPY --from=build /app/pnpm-workspace.yaml ./
COPY --from=build /app/apps/agent-service/dist ./apps/agent-service/dist
COPY --from=build /app/apps/agent-service/package.json ./apps/agent-service/
COPY --from=build /app/apps/agent-service/node_modules ./apps/agent-service/node_modules
COPY --from=build /app/packages/db ./packages/db
COPY --from=build /app/packages/contracts ./packages/contracts
COPY --from=build /app/packages/prompts ./packages/prompts
COPY --from=build /app/packages/types ./packages/types

EXPOSE 3001
ENV PORT=3001

CMD ["node", "apps/agent-service/dist/index.js"]
