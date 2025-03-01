#!/usr/bin/env bash

source ../.venv/bin/activate

ENV_FILE=../src/.env

source $ENV_FILE

if [ -z "$SKIES_ADSB_DEFAULT_ORIGIN_LATITUDE" ] || [ -z "$SKIES_ADSB_DEFAULT_ORIGIN_LONGITUDE" ]; then
  echo "Error: Required environment variables are not set"
  echo "Please set SKIES_ADSB_DEFAULT_ORIGIN_LATITUDE and SKIES_ADSB_DEFAULT_ORIGIN_LONGITUDE"
  exit 1
fi

export $(grep '^VITE_DEFAULT_ORIGIN' $ENV_FILE | xargs)

# forward all command line arguments
python3 build-map-layers.py "$@"
