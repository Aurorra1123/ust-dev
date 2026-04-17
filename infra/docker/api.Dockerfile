FROM node:20-bookworm-slim

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl \
 && rm -rf /var/lib/apt/lists/*

RUN corepack enable

WORKDIR /workspace

COPY . .

RUN pnpm install --no-frozen-lockfile
RUN pnpm --filter api prisma:generate
RUN pnpm --filter api build

EXPOSE 3000

CMD ["pnpm", "--filter", "api", "start:prod"]
