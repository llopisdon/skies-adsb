#!/usr/bin/env bash

export $(grep -w DEPLOY_USER_AT_HOSTNAME ../.env)
echo Copying skies-adsb files to Raspberry Pi...
scp setup.sh skies-* ../flask/{app.py,config.json} $DEPLOY_USER_AT_HOSTNAME:~
