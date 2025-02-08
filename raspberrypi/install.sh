#!/usr/bin/env bash

#
# this is the skies-adsb install script for the Raspberry Pi
#

if ! grep -q "Raspberry Pi" /proc/cpuinfo; then
  echo "This script must be run on a Raspberry Pi"
  exit 1
fi

optional_do_upgrade_rpi() {
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

optional_install_dump1090() {
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

do_setup_python_environment() {
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

do_setup_app() {
  echo "###############################################"
  echo "Setting up skies-adsb..."

  # Setup initial directory structure
  cd
  rm -rf skies-adsb
  mkdir -p skies-adsb
  mv skies-*.{sh,service,tar.gz} skies-adsb/

  # Setup Python environment
  do_setup_python_environment

  # Extract and setup Flask application
  echo "Setting up skies-adsb flask app..."
  cd ~/skies-adsb
  tar zxvf skies-adsb-flask-app.tar.gz
  rm skies-adsb-flask-app.tar.gz
  cd

  # Clean up existing services
  echo "Stopping and removing any running skies-adsb services..."
  for service in websockify flask; do
    sudo systemctl stop skies-adsb-${service}
    sudo rm -f /etc/systemd/system/skies-adsb-${service}.service
  done

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
  rm install.sh
  sudo reboot
}

#
# Main Installation Steps
# ----------------------
# Comment out any optional functions you don't want to run
#

echo "Starting skies-adsb installation..."
echo "===================================="

optional_do_upgrade_rpi
echo

optional_install_dump1090
echo

do_setup_app
echo "Installation complete!"
