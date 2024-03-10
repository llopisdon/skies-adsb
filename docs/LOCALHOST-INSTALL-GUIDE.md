# localhost Installation Guide

The skies-adsb app works with any ADS-B decoder which outputs [SBS1 BaseStation formatted data](http://woodair.net/sbs/article/barebones42_socket_data.htm).

skies-adsb uses websockets to receive the adsb data [SBS1 BaseStation formatted data](http://woodair.net/sbs/article/barebones42_socket_data.htm) from port 30003 via a websockify proxy. The app is designed to use any proxy on a local network even your localhost.

# 1. install websockify on your localhost

see:
https://github.com/novnc/websockify

if you have Python 3 on your localhost you can install it via pip.

```
sudo pip install websockify
```

I have only used the latest version of websockify obtained via pip.

If you are on an Ubuntu machine you can use apt to install websockify but I have not tested this version.

# 2. clone app to your localhost

```
cd /your/projects/dir
git clone https://github.com/llopisdon/skies-adsb.git
```

# 3. create a .env file on your localhost

```
cd /path/to/skies-adsb
touch src/.env
```

add the following variables to the .env file -- these are the minimum variables you must define:

```
VITE_SKIES_ADSB_HOST_EXISTING=<ip address of existing ADS-B decoder host>:30003
VITE_SKIES_FLIGHTINFO_HOST_DEV=localhost:5000
VITE_DEFAULT_ORIGIN_LATITUDE=25.794868197349306
VITE_DEFAULT_ORIGIN_LONGITUDE=-80.27787208557129
```

be sure to change the origin lat/long to match your location or nearest airport acting as the origin for the simulation.

If you wish to enable flight status with FlightAware AeroAPI then please follow the setup instructions here:

[Flask Server Setup](flask/README.md)

**note: skip the last part called "Run the Flask Server".\***

# 4. start skies-adsb in development mode

open a terminal and install the skies-adsb dependencies if needed:

```
cd /path/to/skies-adsb
npm install
```

note: you can omit the "npm install" step if you already did this.

```
cd /path/to/skies-adsb
./run_existing.sh
```

this script will start the app in development mode on your localhost and open a browser window automatically.

At this point you should see your local aircraft traffic.

# Notes

If you are using an existing dump1090-mutability installation on a RPI running a newer version of Raspberry Pi OS then port 30003 will not allow connections except from localhost. The Interface address to bind to can be changed via:

```
sudo dpkg-reconfigure dump1090-mutability
```

Alternatively you can also control this using ufw. See:

https://www.raspberrypi.com/documentation/computers/configuration.html#install-a-firewall

https://www.digitalocean.com/community/tutorials/how-to-set-up-a-firewall-with-ufw-on-ubuntu-20-04
