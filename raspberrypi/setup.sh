#!/usr/bin/env bash

do_opt_upgrade_rpi() {
  echo "running update and upgrade..."
  sudo apt update
  sudo apt -y upgrade
}

do_opt_install_dependencies() {
  echo "installing skies-adsb dependencies..."
  sudo apt -y install python3-pip
  sudo pip install websockify
}

do_opt_install_dump1090_mutability() {
  echo "installing dump1090-mutability"
  sudo apt -y install dump1090-mutability
  echo "adding dump1090 to plugdev group..."
  sudo adduser dump1090 plugdev
}

do_opt_install_flask_and_dependencies() {
  echo "installing flask and flask dependencies..."
  sudo pip install flask
  sudo pip install flask-cors
  sudo pip install requests
  sudo pip install xmltodict
}

do_req_setup_app() {
  echo "setting up skies-adsb environment..."
  cd
  mkdir -p skies-adsb
  mv skies-*.{service,sh} skies-adsb
  mv {app.py,config.json} skies-adsb

  echo "setting up skies-adsb system services..."
  sudo cp skies-adsb/*.service /etc/systemd/system/
  sudo systemctl daemon-reload
  sudo systemctl enable skies-adsb.service
  sudo systemctl enable skies-flask.service

  sudo systemctl status skies-adsb
  sudo systemctl status skies-flask

  echo "setting up skies-adsb webroot..."
  sudo mkdir -p /var/www/html/skies-adsb
}

do_req_cleanup() {
  echo "Rebooting Raspberry Pi to complete setup..."
  rm setup.sh
  sudo reboot
}

#
# Comment Sections Not needed. Order is important!
#
# optional:
#   do_opt_upgrade
#   do_opt_install_dependencies
#   do_opt_install_dump1090_mutability
#   do_opt_install_flask_and_dependencies
# required:
#   do_req_setup_app
#   do_req_cleanup
#

do_opt_upgrade_rpi
do_opt_install_dependencies
do_opt_install_dump1090_mutability
do_opt_install_flask_and_dependencies
do_req_setup_app
do_req_cleanup
