#!/usr/bin/env bash

export $(grep -w SKIES_ADSB_HOST_EXISTING .env)

if [ -z $SKIES_ADSB_HOST_EXISTING ]; then
  echo "SKIES_ADSB_HOST_EXISTING not found. Please set SKIES_ADSB_HOST_EXISTING in .env file."
  exit 1
fi

cd flask && . dev/bin/activate && export FLASK_ENV=development && flask run -h 0.0.0.0 &

websockify 30006 $SKIES_ADSB_HOST_EXISTING &

npx webpack serve --mode development
