#!/usr/bin/env bash

#
# This script is used to run the application locally in development mode
# and it will establish a connection to an existing ADS-B receiver
# via websockify.
#

source src/.env

if [ -z $VITE_USE_EXISTING_ADSB ]; then
  echo "VITE_USE_EXISTING_ADSB not found. Please set VITE_USE_EXISTING_ADSB in .env file."
  exit 1
fi

#
# kill previous Flask server and websockify instances
#
pkill -f "flask run" || true
pkill -f websockify || true

#
# activate Python virtual environment so we can run Flask + websockify
#
source .venv/bin/activate

#
# start Flask server and websockify
#
export FLASK_ENV=development && cd flask && flask run -h 0.0.0.0 &

sleep 1

websockify 30006 $VITE_USE_EXISTING_ADSB &

sleep 1

#
# start the application local HTTP development server
#
npx vite --host
