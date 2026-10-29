#!/usr/bin/env bash

set -euo pipefail

DEPLOY_ROOT="${DEPLOY_ROOT:-/root/pixtooth-backend}"
RELEASE_ID="${RELEASE_ID:-}"
BACKEND_PORT="${BACKEND_PORT:-3100}"
BACKEND_HOST="${BACKEND_HOST:-127.0.0.1}"

if [ -z "$RELEASE_ID" ]; then
    echo "RELEASE_ID is required."
    exit 1
fi

INCOMING_DIR="$DEPLOY_ROOT/incoming/$RELEASE_ID"
RELEASE_DIR="$DEPLOY_ROOT/releases/$RELEASE_ID"
CURRENT_LINK="$DEPLOY_ROOT/current"
SHARED_DIR="$DEPLOY_ROOT/shared"
SHARED_LOG_DIR="$SHARED_DIR/logs"

if [ ! -d "$INCOMING_DIR" ]; then
    echo "Incoming release directory not found: $INCOMING_DIR"
    exit 1
fi

healthcheck() {
    local attempt

    for attempt in $(seq 1 15); do
        if curl --silent --show-error --fail "http://${BACKEND_HOST}:${BACKEND_PORT}/health" >/dev/null; then
            return 0
        fi

        sleep 2
    done

    return 1
}

reload_current_release() {
    pm2 delete pixtooth-api >/dev/null 2>&1 || true
    PIXTOOTH_CURRENT_DIR="$CURRENT_LINK" \
    PIXTOOTH_SHARED_LOG_DIR="$SHARED_LOG_DIR" \
    HOST="$BACKEND_HOST" \
    PORT="$BACKEND_PORT" \
    pm2 startOrReload "$CURRENT_LINK/ecosystem.config.js" --env production --update-env

    pm2 save >/dev/null
}

mkdir -p "$DEPLOY_ROOT/releases" "$SHARED_LOG_DIR"
touch "$SHARED_DIR/.env"

rm -rf "$RELEASE_DIR"
mv "$INCOMING_DIR" "$RELEASE_DIR"

rm -rf "$RELEASE_DIR/logs"
ln -sfn "$SHARED_DIR/.env" "$RELEASE_DIR/.env"
ln -sfn "$SHARED_LOG_DIR" "$RELEASE_DIR/logs"

npm ci --omit=dev --prefix "$RELEASE_DIR"

PREVIOUS_TARGET=""
if [ -L "$CURRENT_LINK" ]; then
    PREVIOUS_TARGET="$(readlink "$CURRENT_LINK")"
fi

ln -sfn "$RELEASE_DIR" "$CURRENT_LINK"

if ! reload_current_release || ! healthcheck; then
    if [ -n "$PREVIOUS_TARGET" ] && [ -f "$PREVIOUS_TARGET/ecosystem.config.js" ]; then
        ln -sfn "$PREVIOUS_TARGET" "$CURRENT_LINK"
        reload_current_release || true
        healthcheck || true
    fi

    echo "Deployment failed. Previous working release was restored."
    exit 1
fi

ls -1dt "$DEPLOY_ROOT"/releases/* 2>/dev/null | tail -n +6 | xargs -r rm -rf || true
