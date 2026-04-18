#!/usr/bin/env bash

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_ARGS=(
  -f "$REPO_ROOT/infra/docker-compose.yml"
  -f "$REPO_ROOT/infra/docker-compose.https.yml"
)
CERTBOT_CONF_DIR="$REPO_ROOT/infra/nginx/.runtime/certbot/conf"
CERTBOT_WWW_DIR="$REPO_ROOT/infra/nginx/.runtime/certbot/www"

dry_run=false
extra_args=()

for arg in "$@"; do
  if [[ "$arg" == "--dry-run" ]]; then
    dry_run=true
  fi
  extra_args+=("$arg")
done

mkdir -p "$CERTBOT_CONF_DIR" "$CERTBOT_WWW_DIR"

echo "[renew] repo root: $REPO_ROOT"
echo "[renew] certbot renew starting"

docker run --rm \
  -v "$CERTBOT_CONF_DIR:/etc/letsencrypt" \
  -v "$CERTBOT_WWW_DIR:/var/www/certbot" \
  certbot/certbot renew \
  --webroot \
  -w /var/www/certbot \
  "${extra_args[@]}"

if [[ "$dry_run" == true ]]; then
  echo "[renew] dry-run completed, skip nginx reload"
  exit 0
fi

echo "[renew] reloading nginx"
docker compose "${COMPOSE_ARGS[@]}" exec -T nginx nginx -s reload
echo "[renew] completed"
