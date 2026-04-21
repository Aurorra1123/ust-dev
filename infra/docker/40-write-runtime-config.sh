#!/bin/sh

set -eu

escape_js() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

api_base_url="${CAMPUSBOOK_API_BASE_URL:-}"
demo_user_email="${DEMO_USER_EMAIL:-}"
demo_user_password="${DEMO_USER_PASSWORD:-}"
demo_admin_email="${DEMO_ADMIN_EMAIL:-}"
demo_admin_password="${DEMO_ADMIN_PASSWORD:-}"

escaped_api_base_url="$(escape_js "$api_base_url")"
escaped_demo_user_email="$(escape_js "$demo_user_email")"
escaped_demo_user_password="$(escape_js "$demo_user_password")"
escaped_demo_admin_email="$(escape_js "$demo_admin_email")"
escaped_demo_admin_password="$(escape_js "$demo_admin_password")"

cat > /usr/share/nginx/html/config.js <<EOF
window.__CAMPUSBOOK_CONFIG__ = Object.freeze({
  apiBaseUrl: "${escaped_api_base_url}",
  demoCredentials: Object.freeze({
    student: Object.freeze({
      email: "${escaped_demo_user_email}",
      password: "${escaped_demo_user_password}"
    }),
    admin: Object.freeze({
      email: "${escaped_demo_admin_email}",
      password: "${escaped_demo_admin_password}"
    })
  })
});
EOF
