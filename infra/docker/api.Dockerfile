FROM node:20-bookworm-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl \
 && rm -rf /var/lib/apt/lists/*

RUN corepack enable

WORKDIR /workspace

FROM base AS deps

COPY . .

RUN pnpm install --no-frozen-lockfile

FROM deps AS builder

RUN pnpm --filter api prisma:generate
RUN pnpm --filter api build

FROM base AS runner

COPY --from=builder /workspace/package.json /workspace/pnpm-lock.yaml /workspace/pnpm-workspace.yaml /workspace/
COPY --from=builder /workspace/apps /workspace/apps
COPY --from=builder /workspace/packages /workspace/packages
COPY --from=builder /workspace/node_modules /workspace/node_modules
COPY --from=builder /workspace/apps/api/dist /workspace/apps/api/dist

EXPOSE 3000

CMD ["pnpm", "--filter", "api", "start:prod"]
