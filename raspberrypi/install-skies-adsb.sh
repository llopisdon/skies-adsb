#!/usr/bin/env bash

#
# this is the skies-adsb install script for the Raspberry Pi
#

# if ! grep -q "Raspberry Pi" /proc/cpuinfo; then
#   echo "This script must be run on a Raspberry Pi"
#   exit 1
# fi

# Process command line options
while getopts ":srde:" opt; do
  case $opt in
  s)
    SKIP_RPI_UPGRADE=1
    ;;
  r)
    ADSB_DRIVER="readsb"
    ;;
  d)
    ADSB_DRIVER="dump1090"
    ;;
  e)
    ADSB_DRIVER="existing"
    ADSB_HOST_PORT="$OPTARG"
    # Validate IP:port format
    if ! echo "$ADSB_HOST_PORT" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+:[0-9]+$'; then
      echo "Error: -e requires valid IP:port format (e.g. 192.168.1.123:30003)"
      exit 1
    fi
    ;;
  \?)
    echo "Invalid option: -$OPTARG"
    exit 1
    ;;
  :)
    echo "Option -$OPTARG requires an argument"
    exit 1
    ;;
  esac
done

if [ -z "$ADSB_DRIVER" ]; then
  echo "Error: ADSB driver not specified. Use -r for readsb or -d for dump1090 or -e for using existing ADS-B receiver"
  exit 1
fi

if [ -z "$ADSB_HOST_PORT" ]; then
  ADSB_HOST_PORT="0.0.0.0:30003"
fi

upgrade_rpi() {
  echo "###############################################"
  echo "Updating and upgrading Raspberry Pi system..."
  echo "-----------------------------------------------"

  echo "Running apt update..."
  sudo apt update

  echo "Running apt upgrade..."
  sudo apt -y upgrade

  echo "Cleaning up packages..."
  sudo apt -y autoremove

  echo "System update complete!"
  echo "**********************************************"
}

install_readsb() {
  echo "###############################################"
  echo "Installing readsb..."
  echo "-----------------------------------------------"

  sudo bash -c "$(wget -O - https://github.com/wiedehopf/adsb-scripts/raw/master/readsb-install.sh)"

  source ~/skies-adsb/src/.env

  sudo readsb-set-location $VITE_DEFAULT_ORIGIN_LATITUDE $VITE_DEFAULT_ORIGIN_LONGITUDE

  echo
  echo "readsb installation complete!"
  echo "**********************************************"
}

install_dump1090() {
  echo "###############################################"
  echo "Installing dump1090-mutability..."
  echo "-----------------------------------------------"

  # Install dump1090 package (includes lighttpd dependency)
  sudo apt -y install dump1090-mutability

  # Add dump1090 user to plugdev group for USB device access
  echo "Adding dump1090 user to plugdev group..."
  sudo adduser dump1090 plugdev

  echo "dump1090 installation complete!"
  echo "**********************************************"
}

setup_python_environment() {
  echo "###############################################"
  echo "Setup Python environment..."
  echo "-----------------------------------------------"

  if ! dpkg -l | grep -q "python3-websockify"; then
    echo "Installing python3-websockify..."
    sudo apt -y install python3-websockify
  else
    echo "Skipping: python3-websockify is already installed"
  fi

  echo "Setting up Python virtual environment..."
  cd ~/skies-adsb
  python -m venv .venv
  source .venv/bin/activate

  echo "Installing Flask and dependencies..."
  pip install flask flask-cors requests

  deactivate
  echo "-----------------------------------------------"
  echo "Setup Python environment complete!"
  echo "**********************************************"
}

setup_app_start() {
  echo "###############################################"
  echo "Setting up skies-adsb..."

  # Setup initial directory structure
  cd
  rm -rf skies-adsb
  mkdir -p skies-adsb

  echo "Extracting skies-adsb app..."
  tar zxvf skies-adsb-app.tar.gz -C skies-adsb
  rm skies-adsb-app.tar.gz

  # Setup Python environment
  setup_python_environment
}

setup_app_finish() {
  cd

  # Clean up existing services
  echo "Stopping and removing any running skies-adsb services..."
  for service in websockify flask; do
    sudo systemctl stop skies-adsb-${service}
    sudo rm -f /etc/systemd/system/skies-adsb-${service}.service
  done

  echo "Replacing ADSB_HOST_PORT in websockify service script..."
  sed -i "s/#ADSB_HOST_PORT#/${ADSB_HOST_PORT}/g" skies-adsb/skies-adsb-websockify.sh

  # Setup new system services
  echo "Setting up skies-adsb system services..."
  sudo cp skies-adsb/*.service /etc/systemd/system/
  sudo systemctl daemon-reload

  # Enable and check services
  for service in websockify flask; do
    sudo systemctl enable skies-adsb-${service}
    sudo systemctl status skies-adsb-${service}
  done

  echo "**********************************************"
  echo "Cleaning up and rebooting Raspberry Pi to complete setup..."
  rm install-skies-adsb.sh
  sudo reboot
}

#
# Main Installation Steps
# ----------------------
# Comment out any optional functions you don't want to run
#

echo "Starting skies-adsb installation..."
echo "===================================="

if [ -z "$SKIP_RPI_UPGRADE" ]; then
  upgrade_rpi
  echo
fi

setup_app_start
echo

case "$ADSB_DRIVER" in
"readsb")
  install_readsb
  ;;
"dump1090")
  install_dump1090
  ;;
"existing")
  echo "###############################################"
  echo "Using existing ADS-B receiver..."
  echo "**********************************************"
  ;;
esac
echo

setup_app_finish
echo

echo "Installation complete!"
