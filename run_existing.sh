#!/usr/bin/env bash

export $(grep -w VITE_SKIES_ADSB_HOST_EXISTING src/.env)

if [ -z $VITE_SKIES_ADSB_HOST_EXISTING ]; then
  echo "VITE_SKIES_ADSB_HOST_EXISTING not found. Please set VITE_SKIES_ADSB_HOST_EXISTING in .env file."
  exit 1
fi

cd flask && . dev/bin/activate && export FLASK_ENV=development && flask run -h 0.0.0.0 &

websockify 30006 $VITE_SKIES_ADSB_HOST_EXISTING &

npx vite
