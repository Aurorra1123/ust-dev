FROM node:20-alpine AS builder

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /workspace

COPY . .

RUN pnpm install --no-frozen-lockfile
RUN pnpm --filter web build

FROM nginx:1.27-alpine

COPY infra/docker/web-default.conf /etc/nginx/conf.d/default.conf
COPY infra/docker/40-write-runtime-config.sh /docker-entrypoint.d/40-write-runtime-config.sh
RUN chmod +x /docker-entrypoint.d/40-write-runtime-config.sh
COPY --from=builder /workspace/apps/web/dist /usr/share/nginx/html

EXPOSE 80
