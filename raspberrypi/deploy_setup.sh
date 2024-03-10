#!/usr/bin/env bash

export $(grep -w VITE_DEPLOY_USER_AT_HOSTNAME ../src/.env)
echo Copying skies-adsb files to Raspberry Pi...
scp setup.sh skies-* ../flask/{app.py,config.json} $VITE_DEPLOY_USER_AT_HOSTNAME:~
