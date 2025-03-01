#!/usr/bin/env bash

#
# this script is used to deploy the skies-adsb flask app and system services to the Raspberry Pi server
#

source ../src/.env

if [ -z "$SKIES_ADSB_RPI_USERNAME" ] || [ -z "$SKIES_ADSB_RPI_HOST" ]; then
  echo "Error: Required environment variables are not set"
  echo "Please set SKIES_ADSB_RPI_USERNAME and SKIES_ADSB_RPI_HOST"
  exit 1
fi

if [ -z "$SKIES_ADSB_DEFAULT_ORIGIN_LATITUDE" ] || [ -z "$SKIES_ADSB_DEFAULT_ORIGIN_LONGITUDE" ]; then
  echo "Error: Required environment variables are not set"
  echo "Please set SKIES_ADSB_DEFAULT_ORIGIN_LATITUDE and SKIES_ADSB_DEFAULT_ORIGIN_LONGITUDE"
  exit 1
fi

RPI_TARGET=$SKIES_ADSB_RPI_USERNAME@$SKIES_ADSB_RPI_HOST

#
# create tar files for flask app
#

# create tar file for flask app, excluding unnecessary files
tar -czvf skies-adsb-app.tar.gz \
  --exclude='__pycache__' \
  --exclude='README.md' \
  --exclude='*.zip' \
  --exclude='*.log' \
  ../flask ../src/.env skies-*.service skies-*.sh

# copy files to Raspberry Pi
echo "Copying skies-adsb files to Raspberry Pi..."
scp install-skies-adsb.sh skies-adsb-app.tar.gz "$RPI_TARGET:~"

# Cleanup
rm skies-adsb-app.tar.gz
