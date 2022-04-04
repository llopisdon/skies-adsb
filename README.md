# skies-adsb

A virtual aircraft aquarium for the 21st century.

# Terms Used

RPI - Raspberry Pi

Host - Host computer used to setup the Raspberry Pi and as a development machine

Default Username: pi

Default Hostname: raspberrypi.local

# What You Will Need

- 1 Raspberry Pi - at least a Raspberry Pi Zero W
- 1 RTL-SDR Receiver that works with dump1090 (pretty much all of them these days)
- 1 1090mhz Antenna (see notes below)
- A Host computer to setup the Raspberry Pi from (I'm assuming you are on a Linux or Mac machine--this entire app was developed on Linux machine)

# Bill of Materials

- 1 Raspberry Pi Zero W
- 1 Raspberry Pi Zero W Case
- 1 Raspberry Pi Compatible Power Supply
- 1 1090mhx Antenna
- 1 tripod

The Hobbyist's Guide to the RTL-SDR: Really Cheap Software Defined Radio

https://amazon.com/gp/product/B00KCDF1QI/

5.00

RTL-SDR for Everyone: Second Edition 2016 Guide including Raspberry Pi 2

https://amazon.com/gp/product/B01C9KZKAI/

9.95

CanaKit Raspberry Pi Zero W (Wireless) Complete Starter Kit - 16 GB Edition

https://amazon.com/gp/product/B072N3X39J/

34.99

CanaKit Raspberry Pi 3 Kit with Premium Clear Case and 2.5A Power Supply (UL Listed)

https://amazon.com/gp/product/B01C6EQNNK/

49.99

Nooelec NESDR Smart v4 Bundle - Premium RTL-SDR w/Aluminum Enclosure, 0.5PPM TCXO, SMA Input & 3 Antennas. RTL2832U & R820T2-Based Software Defined Radio.

https://www.nooelec.com/store/nesdr-smart.html

https://www.nooelec.com/store/qs

https://amazon.com/gp/product/B01GDN1T4S/

45.95

ADSBexchange.com Blue R820T2 RTL2832U, 0.5 PPM TCXO ADS-B SDR w/Amp and 1090 Mhz Filter, Antenna & Software on Industrial MicroSD

https://store.adsbexchange.com/

https://amazon.com/gp/product/B09F2ND4R6/

39.95

AirNav RadarBox ADS-B 1090 MHz XBoost Antenna with SMA Connector

https://amazon.com/gp/product/B08HSQC5RW/

49.95

Proxicast 6 ft Ultra Flexible SMA Male - SMA Male Low Loss Coax Jumper Cable for 3G/4G/LTE/Ham/ADS-B/GPS/RF Radios & Antennas (Not for TV or WiFi) - 50 Ohm

https://amazon.com/gp/product/B07R2CWDPJ/

15.95

6ft Tripod

https://amazon.com/gp/product/B005I2YL7I/

32.49

# Step 0 - Determine Your Geolocation Coordinates (Latitude and Longitude)

Determine the Geolocation Coordinates for your RPI installation by going here:

https://www.openstreetmap.org/

Right-click on your location and select "show address". Note the Latitude and Longitude coordinates. You will need these later for setting the default origin of your RPI.

# Step 1 - Raspberry Pi (RPI) Setup

Follow the RPI OS installation instructions here:

https://www.raspberrypi.com/documentation/computers/getting-started.html#installing-the-operating-system

I strongly suggest using the RPI Imager to do the initial installation as this will save you time with the initial setup.

You will not need a GUI. So I recommend using the RPI OS Lite Distribution.

Use either the 32-bit or 64-bit (depending on your PI) RPI OS Lite Distribution.

I use both a RPI Zero W running RPI OS 32-bit and a RPI 3 running RPI OS 64-bit.

**NOTE: THE SETUP TUTORIAL WILL ASSUME YOU ARE USING THE RASPBERRY PI IMAGER**

From the RPI Imager select your OS image and destination device then click on the gear icon to enter the advance settings.

1. Check the "Enable SSH" checkbox (use password authentication)
2. Set username/password - use the default pi user name and select a password
3. Configure your wifi
4. Set locale settings as needed (Time zone + Keyboard layout)

NOTE: For purposes of the setup tutorial I'm assuming the default raspberrypi user and hostname are used:

```
username: pi
hostname: raspberrypi.local
```

Once you have written your image then boot and log into your RPI.

Boot your RPI. Verify that you can ssh into your RPI:

```
ssh pi@raspberrypi.local

```

Once you login determine which IP address has been assigned to your RPI using the hostname command as follows:

```
hostname -I
```

and write down this IP address. It will be needed for setting up the skies-adsb webapp.

# Step 2 - Clone the skies-adsb repository

Clone the skies-adsb repository off GitHub onto your Host machine:

```
cd /path/to/your/git/projects
git clone git@github.com:llopisdon/skies-adsb.git
```

# Step 3 - Setup .env file variables

```
cd /path/to/skies-adsb
touch .env
```

The .env file will hold several environment variables used to deploy the skies-adsb app.

.env variable format is as follows:

```
DEFAULT_ORIGIN_LATITUDE=<Latitude from Step 0>
DEFAULT_ORIGIN_LONGITUDE=<Longitude from Step 0>

DEPLOY_USER_AT_HOSTNAME=<username@hostname.local>

SKIES_ADSB_HOST=<RPI IP address>:30006
SKIES_ADSB_HOST_DEV=<RPI IP address>:30006

SKIES_FLASK_HOST=<RPI IP address>:5000
SKIES_FLASK_HOST_DEV=<RPI IP address>:5000

OPTIONAL_SKIES_CLOUDFLARE_HOSTNAME=host.domain.com
OPTIONAL_SKIES_CLOUDFLARE_ADSB_HOST_URL=wss:host-ws.domain.com
OPTIONAL_SKIES_CLOUDFLARE_FLASK_HOST_URL=https:host-flask.domain.com

OPTIONAL_MAP=<map name>.json
```

Below is an explanation of the environment variables:

```
DEFAULT_ORIGIN_LATITUDE - this is used as a fallback for the default Latitude for the origin of where your tracker setup is setup in physical space. It is obtained in Step 0.


DEFAULT_ORIGIN_LONGITUDE - this is used as a fallback for the default Longitude for the origin of where your tracker setup is setup in physical space. It is obtained in Step 0.


DEPLOY_USER_AT_HOSTNAME - this is the user and hostname on the RPI which will be used to deploy the skies-adsb app. For example: pi@raspberrypi.local


SKIES_ADSB_HOST - the IP address of the RPI on your local network hosting the skies-adsb
websocket service at port 30006.

For example: 192.168.1.1:30006


SKIES_ADSB_HOST_DEV - usually the same entry as the SKIES_ADSB_HOST but you can point this to your localhost for development purposes if needed.

For example: localhost:30006


SKIES_FLASK_HOST - the IP address of the RPI on your local network hosting the skies-adsb Flask API service at port 5000.

For example: 192.168.1.1:5000


SKIES_FLASK_HOST_DEV - usually the same entry as the SKIES_ADSB_HOST but you can point this to your localhost for development purposes if needed.

For example: localhost:5000


OPTIONAL_SKIES_CLOUDFLARE_HOSTNAME - *OPTIONAL* a fully qualified domain name used to serve the skies-adsb webapp via a Cloudflare Tunnel on the Internet.

For example: somehost.example.com


OPTIONAL_SKIES_CLOUDFLARE_ADSB_HOST_URL - *OPTIONAL* a URL used for providing skies-adsb websocket connections via the secure websocket protocol scheme: wss.

For example: wss:somehost-ws.example.com


OPTIONAL_SKIES_CLOUDFLARE_FLASK_HOST_URL - *OPTIONAL* a URL pointing to the skies-adsb Flask Flight Info app. The URL must use the *https* scheme.

For example: https://somehost-flask.example.com/flightinfo

OPTIONAL_MAP - *OPTIONAL* the name of the default map GeoJSON json file used as a reference plane in the tracker app. Included with the app is a simplified view of South Florida with aerodromes and other points of interest.
```

Example .env file:

```
DEFAULT_ORIGIN_LATITUDE=25.794868197349306
DEFAULT_ORIGIN_LONGITUDE=-80.27787208557129

DEPLOY_USER_AT_HOSTNAME=<pi@raspberrypi.local>

SKIES_ADSB_HOST=192.168.1.1:30006
SKIES_ADSB_HOST_DEV=localhost:30006

SKIES_FLASK_HOST=192.168.1.1:5000
SKIES_FLASK_HOST_DEV=localhost:5000

OPTIONAL_SKIES_CLOUDFLARE_HOSTNAME=skies.example.com
OPTIONAL_SKIES_CLOUDFLARE_ADSB_HOST=wss://skies-ws.example.com
OPTIONAL_SKIES_CLOUDFLARE_FLASK_HOST=https://skies-flask.example.com/flightinfo

OPTIONAL_MAP=sofla.json
```

# Step 4 - Deploy and run the Raspberry Pi skies-adsb setup.sh Script

Once you have created your .env file you are ready to set up the RPI to host the skies-adsb app.

Make sure you set the DEPLOY_USER_AT_HOSTNAME variable in the .env file.

Now copy the setup files over to the RPI as follows:

```
cd /path/to/skies-adsb/raspberrypi
chmod +x deploy_setup.sh
./deploy_setup.sh
```

Now ssh into the RPI and run the setup script:

```
ssh pi@raspberrypi.local
chmod +x setup.sh
./setup.sh
```

**IMPORTANT NOTE - dump1090-mutability DO NOT AUTOSTART**

```
During the install of dump1090-mutability select "NO" to start dump1090-mutability automatically. We will be starting it manually later.
```

When the setup script is complete it will reboot the RPI. When the RPI boots up again ssh into the RPI and verify that the flask and websocket proxy are listening on ports 5000 and 30006 respectively.

```
ssh pi@raspberrypi.local
ss -tlp
```

you should see an output similar to the one below:

```
State   Recv-Q  Send-Q   Local Address:Port     Peer Address:Port  Process
LISTEN  0       128            0.0.0.0:5000          0.0.0.0:*      users:(("flask",pid=499,fd=5),("flask",pid=499,fd=3))
LISTEN  0       1024           0.0.0.0:http          0.0.0.0:*
LISTEN  0       100            0.0.0.0:30006         0.0.0.0:*      users:(("websockify",pid=572,fd=3))
LISTEN  0       128            0.0.0.0:ssh           0.0.0.0:*
LISTEN  0       1024              [::]:http             [::]:*
LISTEN  0       128               [::]:ssh              [::]:*
p
```

at this point you are ready to deploy the skies-adsb webapp.

# Step 5 - Install the RTL-SDR receiver

Shutdown the RPI:

```
ssh pi@raspberrypi.local
sudo shutdown -h now
```

once the RPI is shutdown:

1. disconnected the power
2. plug in your RTL-SDR device to any of the available USB ports on the RPI.
3. reconnect the power

Once the RPI boots up you can verify that the RLT-SDR receiver ADSB data is being decoded using netcat:

```
ssh pi@raspberrypi.local
sudo apt install -y netcat
nc localhost 30003
```

you should see a stream of raw ADSB data. Press CTRL-C to stop.

# Step 6 - Install Node.js+NPM On Your Host Machine

First install Node.js + NPM on your host machine.

I strongly recommend using NVM (Node Version Manager) to install and manage your Node.js installation. Even the official Node.js and NPM docs recommend using NVM.

https://github.com/nvm-sh/nvm

follow the NVM install instructions above and then run:

```
nvm install node
```

NOTE: You can also install Node.js by following the instructions here:

https://nodejs.dev/learn/how-to-install-nodejs

# Step 7 - Deploy the skies-adsb webapp to the Raspberry Pi

```
cd /path/to/skies-adsb/raspberrypi
chmod +x deploy.sh
npm install
npm run build
./deploy.sh
```

# Step 8 - Test the skies-adsb Installation

At this point you should be able to open a web browser to:

```
http://raspberypi.local/skies-adsb
```

and you should see either a wireframe map of South Florida (if you set the MAP variable in the .env file) or a wireframe reference grid at the center of the display. You may or may not see any traffic depending on your geographic location. If you are using the South Florida map and you are in South Florida you should see aircraft.

If you see no air traffic make sure you have set the correct Latitude+Longitude coordinates for your default origin as described in **Step 0**.

You can override the default origin lat/lng coordinates from the skies-adsb webapp.

Click on the "gear" icon on the upper left side of the screen. This will pop up a gui dialog.
The first two text fields are: latitude and longitude. Enter your default origin coordinates there. To set them click on the 3rd line called: "set origin".

# Step 9 - Enjoy

At this point feel free to take your setup outside, enjoy the outdoors with a nice drink, and do some plane spotting.

I hope you enjoy using the app.

# Default GeoJSON Map

By default the skies-adsb app comes with a hand crafted GeoJSON map of South Florida (SOFLA) in the United States.

# Creating Custom GeoJSON Maps

The skies-adsb app can display a GeoJSON 2D ground map to the user in order to aid visualization of boundaries and points of reference in order to enhance the plane watching experience.

I was unable to determine a visually satisfactory way to automate the creation of GeoJSON maps for a user's particular geolocation.

Since user's know their local geography best I figured it would just be easiest to let
user's create their own customized maps.

The level of detail is up to the map creator. You can go as simple or as complex as you like.

For example, the original map of SOFLA that I created had rather rough boundaries. Most of the Eastern coastline was represented by a handful of very long lines. This was sufficient and visual pleasing. Later I created a more detailed map because I wanted to see more geographic boundary reference areas on the map.

## Creating GeoJSON Map For Your Geolocation

The included map with skies-adsb was created using this webapp:

http://geojson.io/

If you prefer using a native app I suggest using QGIS:

https://qgis.org/

## Supported GeoJSON Geometry

Only two types of GeoJSON Geometry Objects are supported:

```
Point

and

Polygon
```

## Point

Point is used to display Points-Of-Interest (POI). POI are labeled using an custom "id" property. This can be input via the geojson.io editor. See the data/sofla.json map for
reference. An additional property called "origin" can also be specified to indicate that the point should be used as the origin for the scene.

### Custom Point Feature Properties:

```
"id": "<SOME STRING LABEL>"
"origin": true
```

Example Custom Point for KMIA Aerodrome with KMIA set to the origin for the map:

```
{
      "type": "Feature",
      "properties": {
        "marker-color": "#7e7e7e",
        "marker-size": "medium",
        "marker-symbol": "",
        "id": "KMIA",
        "origin": "true"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          -80.27787208557129,
          25.794868197349306
        ]
      }
    },
```

## Polygon

Only convex 2D Polygons are supported. All Polygons are only drawn as wireframe on the XZ plane.

# Default Reference Grid and Default Origin Explained

A default reference grid is displayed if there is no map specified in the .env file.

The GeoJSON map is optional but it does make the aircraft watching experience more interesting and meaningful.

If no map or origin is given then the default origin lat/long value given in the .env file is used.

### Default of the Default Origin

If the default values are not found in the .env file or via a loaded GeoJSON map then the default origin lat/long is:

```
Latitude: 0
Longitude: 0
```

otherwise known as [Null Island](https://en.wikipedia.org/wiki/Null_Island)

### Manually Updating the Default Origin

The default origin can be manually entered from the skies-adsb webapp by clicking on the gears icon on the left hand side of the screen and then entering valid lat/long values
in the settings text fields that is displayed. Once entered press the "set origin" button to set and enable the origin for the scene.

# Thanks

TODO

# Libraries

Material Icons
https://fonts.google.com/icons

IBM Plex Mono
https://fonts.google.com/specimen/IBM+Plex+Mono

To manage build environment variables
https://www.npmjs.com/package/dotenv-webpack

GSAP
https://greensock.com/gsap/

sphericalmercator
https://github.com/mapbox/sphericalmercator

dat.gui
https://github.com/dataarts/dat.gui

three.js
https://threejs.org/

stats.js
https://github.com/mrdoob/stats.js/

Troika Text for Three.js
https://protectwise.github.io/troika/troika-three-text/
