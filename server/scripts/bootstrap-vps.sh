#!/usr/bin/env bash

set -euo pipefail

DEPLOY_ROOT="${DEPLOY_ROOT:-/root/pixtooth-backend}"
API_DOMAIN="${API_DOMAIN:-api.pixtooth.com}"
BACKEND_PORT="${BACKEND_PORT:-3100}"
BACKEND_HOST="${BACKEND_HOST:-127.0.0.1}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NGINX_TEMPLATE="$SCRIPT_DIR/../deploy/nginx/api.pixtooth.com.conf"
NGINX_SITE_PATH="/etc/nginx/sites-available/${API_DOMAIN}"
NGINX_ENABLED_PATH="/etc/nginx/sites-enabled/${API_DOMAIN}"

require_root() {
    if [ "${EUID}" -ne 0 ]; then
        echo "bootstrap-vps.sh must run as root."
        exit 1
    fi
}

install_base_packages() {
    local packages=()

    for package in curl ca-certificates gnupg nginx rsync; do
        if ! dpkg -s "$package" >/dev/null 2>&1; then
            packages+=("$package")
        fi
    done

    if [ "${#packages[@]}" -gt 0 ]; then
        apt-get update -y
        apt-get install -y "${packages[@]}"
    fi
}

install_node_if_missing() {
    if command -v node >/dev/null 2>&1; then
        return
    fi

    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs
}

install_pm2_if_missing() {
    if command -v pm2 >/dev/null 2>&1; then
        return
    fi

    npm install -g pm2
    pm2 startup systemd -u root --hp /root >/dev/null || true
}

ensure_deploy_layout() {
    mkdir -p "$DEPLOY_ROOT/incoming" "$DEPLOY_ROOT/releases" "$DEPLOY_ROOT/shared/logs"
    touch "$DEPLOY_ROOT/shared/.env"
}

render_nginx_config() {
    sed \
        -e "s#__API_DOMAIN__#${API_DOMAIN}#g" \
        -e "s#__BACKEND_HOST__#${BACKEND_HOST}#g" \
        -e "s#__BACKEND_PORT__#${BACKEND_PORT}#g" \
        "$NGINX_TEMPLATE" > "$NGINX_SITE_PATH"

    ln -sfn "$NGINX_SITE_PATH" "$NGINX_ENABLED_PATH"
    nginx -t
    systemctl enable nginx >/dev/null 2>&1 || true
    systemctl reload nginx >/dev/null 2>&1 || systemctl start nginx
}

require_root
install_base_packages
install_node_if_missing
install_pm2_if_missing
ensure_deploy_layout
render_nginx_config
