#!/usr/bin/env bash

#
# this script deploys the dist folder to the RPI server
#

WEBROOT="/var/www/html/skies-adsb"

source src/.env

if [ -z "$VITE_SKIES_ADSB_RPI_USERNAME" ] || [ -z "$VITE_SKIES_ADSB_RPI_HOST" ]; then
  echo "Error: Required environment variables are not set"
  echo "Please set VITE_SKIES_ADSB_RPI_USERNAME and VITE_SKIES_ADSB_RPI_HOST"
  exit 1
fi

RPI_TARGET=$VITE_SKIES_ADSB_RPI_USERNAME@$VITE_SKIES_ADSB_RPI_HOST

echo "Deploy to: $RPI_TARGET"
echo "Creating dist.tar..."
tar cf dist.tar -C dist .

echo "Copying dist.tar to $RPI_TARGET:~"
scp dist.tar $RPI_TARGET:~

echo "Deploying dist.tar to $RPI_TARGET:$WEBROOT"
ssh $RPI_TARGET "
  echo '    Removing old webroot...' &&
  sudo rm -rf $WEBROOT || true &&
  echo '    Creating new webroot...' &&
  sudo mkdir -p $WEBROOT &&
  echo '    Changing to webroot...' &&
  cd $WEBROOT &&
  echo '    Extracting new files...' &&
  sudo tar xf ~/dist.tar . &&
  echo '    Cleaning up temporary files...' &&
  cd &&
  rm dist.tar &&
  echo '    Restarting web server...' &&
  sudo service lighttpd restart
  "

echo "Cleaning up local files..."
rm dist.tar
