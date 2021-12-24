echo "creating dist.tar ..."
tar cf dist.tar -C dist .
echo "copy dist.tar to raspberrypi.local"
scp dist.tar pi@raspberrypi.local:~
echo "deploying dist.tar on raspberrypi.local"
ssh pi@raspberrypi.local 'bash -s' << EOF
cd /var/www/html/skies-adsb
sudo rm -rf *
sudo tar xf ~/dist.tar .
cd
rm dist.tar
EOF
echo "cleaning up..."
rm dist.tar

