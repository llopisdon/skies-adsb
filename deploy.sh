#!/usr/bin/env bash

export $(grep -w VITE_DEPLOY_USER_AT_HOSTNAME src/.env)
echo deploy with username: $VITE_DEPLOY_USER_AT_HOSTNAME
echo "creating dist.tar ..."
tar cf dist.tar -C dist .
echo "copy dist.tar to $VITE_DEPLOY_USER_AT_HOSTNAME:~"
scp dist.tar $VITE_DEPLOY_USER_AT_HOSTNAME:~
echo "deploying dist.tar to $VITE_DEPLOY_USER_AT_HOSTNAME:/var/www/html/skies-adsb"
ssh $VITE_DEPLOY_USER_AT_HOSTNAME 'bash -s' << EOF
cd /var/www/html/skies-adsb
sudo rm -rf *
sudo tar xf ~/dist.tar .
cd
rm dist.tar
sudo service lighttpd restart
EOF
echo "cleaning up..."
rm dist.tar

