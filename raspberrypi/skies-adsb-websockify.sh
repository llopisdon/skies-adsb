#!/usr/bin/env bash
#
# Websocket proxy for ADS-B SBS data
#

LISTEN_HOST_PORT="0.0.0.0:30006"
ADSB_HOST_PORT="#ADSB_HOST_PORT#"

# Check if websockify is installed
if ! command -v websockify >/dev/null 2>&1; then
  echo "Error: websockify is not installed"
  exit 1
fi

# Start websockify
echo "Starting websocket proxy on ${LISTEN_HOST_PORT}"
websockify "${LISTEN_HOST_PORT}" "${ADSB_HOST_PORT}"
