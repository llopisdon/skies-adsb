#!/usr/bin/env bash
#
# Websocket proxy for ADS-B SBS data
#

# Define constants
LISTEN_HOST="0.0.0.0"
LISTEN_PORT=30006
TARGET_HOST="0.0.0.0"
TARGET_PORT=30003

# Check if websockify is installed
if ! command -v websockify >/dev/null 2>&1; then
  echo "Error: websockify is not installed"
  exit 1
fi

# Start websockify
echo "Starting websocket proxy on ${LISTEN_HOST}:${LISTEN_PORT}"
websockify "${LISTEN_HOST}:${LISTEN_PORT}" "${TARGET_HOST}:${TARGET_PORT}"
