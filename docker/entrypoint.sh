#!/usr/bin/env bash
set -euo pipefail

BASIC_AUTH_USER="dev"
BASIC_AUTH_PASSWORD="dev"

htpasswd -bc /etc/nginx/.htpasswd "$BASIC_AUTH_USER" "$BASIC_AUTH_PASSWORD" >/dev/null

exec nginx -g 'daemon off;'
