#!/usr/bin/env bash

source ../.venv/bin/activate

ENV_FILE=../src/.env

source $ENV_FILE

if [ -z "$VITE_DEFAULT_ORIGIN_LATITUDE" ] || [ -z "$VITE_DEFAULT_ORIGIN_LONGITUDE" ]; then
  echo "Error: Required environment variables are not set"
  echo "Please set VITE_DEFAULT_ORIGIN_LATITUDE and VITE_DEFAULT_ORIGIN_LONGITUDE"
  exit 1
fi

export $(grep '^VITE_DEFAULT_ORIGIN' $ENV_FILE | xargs)

# forward all command line arguments
python3 build-map-layers.py "$@"
