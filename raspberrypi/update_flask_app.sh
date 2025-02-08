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

# Create a tarball of the Flask app, excluding unnecessary files
tar --exclude='__pycache__' \
  --exclude='README.md' \
  --exclude='*.zip' \
  --exclude='*.log' \
  -czvf skies-adsb-flask-app.tar.gz ../flask

echo "Copying skies-adsb files to Raspberry Pi..."
scp skies-adsb-flask-app.tar.gz "$RPI_TARGET":~

# Execute remote commands on Raspberry Pi
ssh "$RPI_TARGET" 'bash -s' <<'EOF'
  # Stop the Flask service
  sudo systemctl stop skies-adsb-flask

  # Move and extract files
  mv skies-adsb-flask-app.tar.gz skies-adsb
  echo "Setting up skies-adsb flask app..."
  cd ~/skies-adsb
  mv skies-*.tar.gz skies-adsb
  tar zxvf skies-adsb-flask-app.tar.gz
  rm skies-adsb-flask-app.tar.gz
  cd

  # Restart the Flask service
  sudo systemctl start skies-adsb-flask
  sudo systemctl status skies-adsb-flask
EOF

echo "Cleaning up local files..."
rm skies-adsb-flask-app.tar.gz
