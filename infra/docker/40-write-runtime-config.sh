#!/bin/sh

set -eu

escape_js() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

api_base_url="${CAMPUSBOOK_API_BASE_URL:-}"
demo_user_email="${DEMO_USER_EMAIL:-}"
demo_admin_email="${DEMO_ADMIN_EMAIL:-}"

escaped_api_base_url="$(escape_js "$api_base_url")"
escaped_demo_user_email="$(escape_js "$demo_user_email")"
escaped_demo_admin_email="$(escape_js "$demo_admin_email")"

cat > /usr/share/nginx/html/config.js <<EOF
window.__CAMPUSBOOK_CONFIG__ = Object.freeze({
  apiBaseUrl: "${escaped_api_base_url}",
  demoAccounts: Object.freeze({
    student: Object.freeze({
      email: "${escaped_demo_user_email}"
    }),
    admin: Object.freeze({
      email: "${escaped_demo_admin_email}"
    })
  })
});
EOF
