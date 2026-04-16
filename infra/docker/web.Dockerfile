FROM node:20-alpine AS builder

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /workspace

COPY . .

RUN pnpm install --no-frozen-lockfile
RUN pnpm --filter web build

FROM nginx:1.27-alpine

COPY --from=builder /workspace/apps/web/dist /usr/share/nginx/html

EXPOSE 80
