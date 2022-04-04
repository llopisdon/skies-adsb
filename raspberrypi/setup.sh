#!/usr/bin/env bash

echo running update and upgrade...
sudo apt update
sudo apt -y upgrade

echo installing app dependencies...
sudo apt -y install tmux
sudo apt -y install dump1090-mutability
sudo apt -y install python3-pip
sudo pip install websockify

echo setting up skies-adsb environment...
cd
mkdir -p skies-adsb
mv skies-*.{service,sh} skies-adsb
mv {app.py,config.json} skies-adsb

sudo pip install flask
sudo pip install flask-cors
sudo pip install requests
sudo pip install xmltodict

echo setting up skies-adsb system services...
sudo cp skies-adsb/*.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable skies-adsb.service
sudo systemctl enable skies-flask.service

sudo systemctl status skies-adsb
sudo systemctl status skies-flask

echo setting up skies-adsb webroot...
sudo mkdir -p /var/www/html/skies-adsb

echo Rebooting Raspberry Pi to complete setup...
rm setup.sh
sudo reboot
