#!/usr/bin/env bash

export $(grep -w VITE_DEPLOY_USER_AT_HOSTNAME ../src/.env)
echo Copying skies-adsb flask app files to Raspberry Pi...
scp skies-flask.sh skies-flask.service ../flask/{app.py,config.json} $VITE_DEPLOY_USER_AT_HOSTNAME:~/skies-adsb

ssh $VITE_DEPLOY_USER_AT_HOSTNAME 'bash -s' << EOF
cd
echo "stopping previous skies-flask service..."
sudo service skies-flask stop
echo "disabling previous skies-flask service..."
sudo systemctl disable skies-flask.service
echo "setting up new skies-flask service..."
sudo cp skies-adsb/skies-flask.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable skies-flask.service
sudo systemctl start skies-flask
sudo systemctl status skies-flask.service
EOF
echo "cleaning up..."




