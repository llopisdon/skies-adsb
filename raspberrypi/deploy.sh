#!/usr/bin/env bash

#
# this script is used to deploy the skies-adsb flask app and system services to the Raspberry Pi server
#

source ../src/.env

if [ -z "$VITE_SKIES_ADSB_RPI_USERNAME" ] || [ -z "$VITE_SKIES_ADSB_RPI_HOST" ]; then
  echo "Error: Required environment variables are not set"
  echo "Please set VITE_SKIES_ADSB_RPI_USERNAME and VITE_SKIES_ADSB_RPI_HOST"
  exit 1
fi

RPI_TARGET=$VITE_SKIES_ADSB_RPI_USERNAME@$VITE_SKIES_ADSB_RPI_HOST

#
# create tar files for flask app
#

# create tar file for flask app, excluding unnecessary files
tar -czvf skies-adsb-flask-app.tar.gz \
  --exclude='__pycache__' \
  --exclude='README.md' \
  --exclude='*.zip' \
  --exclude='*.log' \
  ../flask

# copy files to Raspberry Pi
echo "Copying skies-adsb files to Raspberry Pi..."
scp install.sh skies-* "$RPI_TARGET:~"

# Cleanup
rm skies-adsb-flask-app.tar.gz
