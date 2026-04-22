#!/usr/bin/env bash

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${1:-$REPO_ROOT/.env.judge}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "[judge-up] missing env file: $ENV_FILE"
  echo "[judge-up] create it from .env.judge.example first"
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

COMPOSE_CMD=(
  docker compose
  --env-file "$ENV_FILE"
  -f "$REPO_ROOT/infra/docker-compose.yml"
  -f "$REPO_ROOT/infra/docker-compose.judge.yml"
)

BASE_URL="http://127.0.0.1:${NGINX_HTTP_PORT:-8080}"

wait_for_postgres() {
  for _ in $(seq 1 30); do
    if "${COMPOSE_CMD[@]}" exec -T postgres pg_isready \
      -U "${POSTGRES_USER:-campusbook}" \
      -d "${POSTGRES_DB:-campusbook}" >/dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done

  echo "[judge-up] postgres not ready"
  exit 1
}

wait_for_redis() {
  for _ in $(seq 1 30); do
    if "${COMPOSE_CMD[@]}" exec -T redis redis-cli ping | grep -q PONG; then
      return 0
    fi
    sleep 2
  done

  echo "[judge-up] redis not ready"
  exit 1
}

wait_for_http() {
  for _ in $(seq 1 30); do
    if "${COMPOSE_CMD[@]}" run --rm api node -e \
      "fetch('http://nginx/api/health').then((response) => { if (!response.ok) process.exit(1); }).catch(() => process.exit(1));" \
      >/dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done

  echo "[judge-up] application not ready at $BASE_URL"
  exit 1
}

mkdir -p \
  "$REPO_ROOT/infra/nginx/.runtime/certbot/www" \
  "$REPO_ROOT/infra/nginx/.runtime/certbot/conf"

echo "[judge-up] repo root: $REPO_ROOT"
echo "[judge-up] env file: $ENV_FILE"

echo "[judge-up] building api image"
"${COMPOSE_CMD[@]}" build api

echo "[judge-up] building web image"
"${COMPOSE_CMD[@]}" build web

echo "[judge-up] starting postgres and redis"
"${COMPOSE_CMD[@]}" up -d postgres redis

wait_for_postgres
wait_for_redis

echo "[judge-up] resetting judge database to keep reruns idempotent"
"${COMPOSE_CMD[@]}" run --rm api pnpm --filter api exec prisma migrate reset --force --skip-generate --skip-seed

echo "[judge-up] seeding demo data"
"${COMPOSE_CMD[@]}" run --rm api pnpm --filter api seed:demo

echo "[judge-up] starting api worker web nginx"
"${COMPOSE_CMD[@]}" up -d --remove-orphans api worker web nginx

wait_for_http

echo "[judge-up] running judge smoke checks"
"${COMPOSE_CMD[@]}" run --rm api node scripts/smoke-judge.mjs

echo "[judge-up] ready"
echo "[judge-up] open: $BASE_URL"
echo "[judge-up] student: ${DEMO_USER_EMAIL:-demo@campusbook.top} / ${DEMO_USER_PASSWORD:-demo123456}"
echo "[judge-up] admin:   ${DEMO_ADMIN_EMAIL:-admin@campusbook.top} / ${DEMO_ADMIN_PASSWORD:-admin123456}"
