# Setup and Deploy the skies-adsb web app on a Raspberry Pi on your home network

This document describes how to setup and deploy the skies-adsb app to a Raspberry Pi Zero W (any recent Raspberry Pi) connected to a RTL-SDR receiver on your home network.

- [Terms Used](INSTALL-GUIDE.md#terms-used)
- [What You Will Need & Shopping List](INSTALL-GUIDE.md#hardware-and-reference-materials-used-to-build-this-project)
- [Hardware and reference materials used to build this project](https://github.com/llopisdon/skies-adsb/blob/documentation/docs/INSTALL-GUIDE.md#hardware-and-reference-materials-used-to-build-this-project)
- [Step 1 - Determine Your Geolocation Coordinates (Latitude and Longitude)](INSTALL-GUIDE.md#step-1---determine-your-geolocation-coordinates-latitude-and-longitude)
- [Step 2 - Raspberry Pi (RPI) Setup](INSTALL-GUIDE.md#step-2---raspberry-pi-rpi-setup)
- [Step 2b - Optional Setup Cloudflare Tunnel](INSTALL-GUIDE.md#step-2b---optional-setup-cloudflare-tunnel)
- [Step 3 - Clone the skies-adsb repository on your Host machine](INSTALL-GUIDE.md#step-3---clone-the-skies-adsb-repository-on-your-host-machine)
- [Step 4 - Setup .env file variables](INSTALL-GUIDE.md#step-4---setup-env-file-variables)
- [Step 4b - Setup Flask Server config.json](INSTALL-GUIDE.md#step-4b---setup-flask-server-configjson)
- [Step 5 - Deploy and run the Raspberry Pi skies-adsb setup.sh Script](INSTALL-GUIDE.md#step-5---deploy-and-run-the-raspberry-pi-skies-adsb-setupsh-script)
- [Step 6 - Install the RTL-SDR receiver](INSTALL-GUIDE.md#step-6---install-the-rtl-sdr-receiver)
- [Step 7 - Install Node.js+NPM On Your Host Machine](INSTALL-GUIDE.md#step-7---install-nodejsnpm-on-your-host-machine)
- [Step 8 - Build and Deploy the skies-adsb web app to the Raspberry Pi](INSTALL-GUIDE.md#step-8---build-and-deploy-the-skies-adsb-web-app-to-the-raspberry-pi)
- [Step 9 - Test the skies-adsb Installation](INSTALL-GUIDE.md#step-9---test-the-skies-adsb-installation)
- [Step 10 - Enjoy](INSTALL-GUIDE.md#step-10---enjoy)

## Terms Used

<!-- prettier-ignore -->
| Term | Meaning |
|------|---------|
| RPI | Raspberry Pi |
| Host or Host Machine | The Host computer used to setup the Raspberry Pi and which also serves as a development machine |
| Default RPI Username | pi |
| Default RPI Hostname | raspberrypi.local |

## What You Will Need & Shopping List

The minimum hardware needed to build this project is:

- 1 Raspberry Pi - at least a Raspberry Pi Zero W
- 1 16gb microSD card
- 1 RTL-SDR Receiver that works with [dump1090-mutability](https://github.com/adsbxchange/dump1090-mutability)
- 1 1090MHz Antenna (see below)
- A Host computer to setup the Raspberry Pi from (I'm assuming you are on a Linux or Mac machine--the app was developed on Linux machine)

**NOTE:** _If you wish to keep the costs as low as possible (and get the best reception), then I suggest using a Raspberry Pi Zero W kit combined with the ADSBexchange.com Blue R820T2 RTL2832U kit._

## Hardware and reference materials used to build this project

<!-- prettier-ignore -->
| Amount | Item |
|--------|------|
| 1 | [The Hobbyist's Guide to the RTL-SDR: Really Cheap Software Defined Radio](https://amazon.com/gp/product/B00KCDF1QI/) |
| 1 | [RTL-SDR for Everyone: Second Edition 2016 Guide including Raspberry Pi 2](https://amazon.com/gp/product/B01C9KZKAI/) |
| 1 | [CanaKit Raspberry Pi Zero W (Wireless) Complete Starter Kit - 16 GB Edition](https://www.canakit.com/raspberry-pi-zero-wireless.html) |
| 1 | [CanaKit Raspberry Pi 3 Kit with Premium Clear Case and 2.5A Power Supply (UL Listed)](https://www.canakit.com/raspberry-pi/raspberry-pi-3-kits)
| 1 | [Software Defined Radio Receiver USB Stick - RTL2832 w/R820T](https://www.adafruit.com/product/1497) |
| 1 | [Nooelec NESDR Smart v4 Bundle - Premium RTL-SDR w/Aluminum Enclosure, 0.5PPM TCXO, SMA Input & 3 Antennas. RTL2832U & R820T2-Based Software Defined Radio](https://www.nooelec.com/store/nesdr-smart.html) |
| 1 | [ADSBexchange.com Blue R820T2 RTL2832U, 0.5 PPM TCXO ADS-B SDR w/Amp and 1090 Mhz Filter, Antenna & Software on Industrial MicroSD](https://store.adsbexchange.com/) |
| 1 | [AirNav RadarBox ADS-B 1090 MHz XBoost Antenna with SMA Connector](https://www.radarbox.com/store) |
| 1 | [Proxicast 6 ft Ultra Flexible SMA Male - SMA Male Low Loss Coax Jumper Cable for 3G/4G/LTE/Ham/ADS-B/GPS/RF Radios & Antennas (Not for TV or WiFi) - 50 Ohm](https://amazon.com/gp/product/B07R2CWDPJ/) |
| 1 | [6ft Tripod](https://amazon.com/gp/product/B005I2YL7I/) |

## Step 1 - Determine Your Geolocation Coordinates (Latitude and Longitude)

Determine the Geolocation Coordinates for your RPI installation by going here:

https://www.openstreetmap.org/

Right-click on your location and select "show address". Note the Latitude and Longitude coordinates. You will need these later for setting the default origin of your RPI.

## Step 2 - Raspberry Pi (RPI) Setup

Follow the RPI OS installation instructions here:

https://www.raspberrypi.com/documentation/computers/getting-started.html#installing-the-operating-system

**NOTE: THE SETUP INSTRUCTIONS WILL ASSUME YOU ARE USING THE RASPBERRY PI IMAGER**

I strongly suggest using the [RPI Imager](https://www.raspberrypi.com/software/) to do the initial installation as this will save you time with the initial setup.

You will not need a GUI. So I recommend using the RPI OS Lite Distribution.

Use either the 32-bit or 64-bit (depending on your PI) RPI OS Lite Distribution.

For this project I am using both a RPI Zero W running RPI OS 32-bit and a RPI 3 running RPI OS 64-bit.

From the RPI Imager select your OS image and destination device then click on the gear icon to enter the advance settings.

1. Check the "Enable SSH" checkbox (use password authentication)
2. Set username/password - use the default pi user name and select a password
3. Configure your wifi
4. Set locale settings as needed (Time zone + Keyboard layout)

NOTE: For purposes of the setup tutorial I'm assuming the default RPI username and hostname are used:

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

and write down this IP address. It will be needed for setting up the skies-adsb web app.

## Step 2b - Optional Setup Cloudflare Tunnel

This step is optional. If you wish to securely deploy the skies-adsb app on the internet then I suggest using a Cloudflare Tunnel. See this documentation for instructions:

[Setup Cloudflare Tunnel Guide](CLOUDFLARE-TUNNEL.md)

## Step 3 - Clone the skies-adsb repository on your Host machine

On your host machine clone the skies-adsb GitHub repository:

```
cd /path/to/your/git/projects
git clone git@github.com:llopisdon/skies-adsb.git
```

## Step 4 - Setup .env file variables

The .env file will hold several environment variables used to build and deploy the skies-adsb web app.

First create an .env file:

```
cd /path/to/skies-adsb
touch .env
```

.env variable format is as follows:

```
DEFAULT_ORIGIN_LATITUDE=<Latitude from Step 1>
DEFAULT_ORIGIN_LONGITUDE=<Longitude from Step 1>

DEPLOY_USER_AT_HOSTNAME=<username@hostname.local>

SKIES_ADSB_HOST=<RPI IP address>:30006
SKIES_ADSB_HOST_DEV=<RPI IP address>:30006

SKIES_FLASK_HOST=<RPI IP address>:5000
SKIES_FLASK_HOST_DEV=<RPI IP address>:5000

OPTIONAL_SKIES_CLOUDFLARE_HOSTNAME=host.domain.com
OPTIONAL_SKIES_CLOUDFLARE_ADSB_HOST_URL=wss:host-ws.domain.com
OPTIONAL_SKIES_CLOUDFLARE_FLASK_HOST_URL=https:host-flask.domain.com

OPTIONAL_GEOJSON_MAP=<map name>.json
```

Explanation of the environment variables:

<!-- prettier-ignore -->
| Variable Name | Explanation | Example |
|---------------|-------------|---------|
| DEFAULT_ORIGIN_LATITUDE | this is used as a fallback for the default Latitude for the origin of where your tracker setup is setup in physical space. It is obtained [Step 1](#step-1---determine-your-geolocation-coordinates-latitude-and-longitude). | 25.794868197349306 |
| DEFAULT_ORIGIN_LONGITUDE | this is used as a fallback for the default Longitude for the origin of where your tracker setup is setup in physical space. It is obtained in [Step 1](INSTALL-GUIDE.md#step-1---determine-your-geolocation-coordinates-latitude-and-longitude).| -80.27787208557129 |
| DEPLOY_USER_AT_HOSTNAME | this is the user and hostname on the RPI which will be used to deploy the skies-adsb app. | pi@raspberrypi.local |
| SKIES_ADSB_HOST | the IP address of the RPI on your local network hosting the skies-adsb websocket service at port 30006. | 192.168.1.1:30006 |
| SKIES_ADSB_HOST_DEV | usually the same entry as the SKIES_ADSB_HOST but you can point this to your localhost for development purposes if needed. | localhost:30006 |
SKIES_FLASK_HOST | the IP address of the RPI on your local network hosting the skies-adsb Flask API service at port 5000. | 192.168.1.1:5000 |
| SKIES_FLASK_HOST_DEV | usually the same entry as the SKIES_ADSB_HOST but you can point this to your localhost for development purposes if needed. | localhost:5000 |
| OPTIONAL_SKIES_CLOUDFLARE_HOSTNAME | _OPTIONAL_ a fully qualified domain name used to serve the skies-adsb web app via a Cloudflare Tunnel on the Internet | somehost.example.com |
| OPTIONAL_SKIES_CLOUDFLARE_ADSB_HOST_URL | _OPTIONAL_ a URL used for providing skies-adsb websocket connections via the secure websocket protocol scheme: wss. | wss:somehost-ws.example.com |
| OPTIONAL_SKIES_CLOUDFLARE_FLASK_HOST_URL | _OPTIONAL_ a URL pointing to the skies-adsb Flask Flight Info app. The URL must use the _https_ scheme. | https://somehost-flask.example.com/flightinfo |
| OPTIONAL_GEOJSON_MAP | _OPTIONAL_ the name of the default map GeoJSON json file used as a reference plane in the tracker app. Included with the app is a simplified view of South Florida with aerodromes and other points of interest. The maps should be located in the geojson directory in the skies-adsb directory. You do not need to specify the full path of the GeoJSON json file. | sofla.json |

Example .env file:

```

DEFAULT_ORIGIN_LATITUDE=25.794868197349306
DEFAULT_ORIGIN_LONGITUDE=-80.27787208557129

DEPLOY_USER_AT_HOSTNAME=pi@raspberrypi.local

SKIES_ADSB_HOST=192.168.1.1:30006
SKIES_ADSB_HOST_DEV=localhost:30006

SKIES_FLASK_HOST=192.168.1.1:5000
SKIES_FLASK_HOST_DEV=localhost:5000

OPTIONAL_SKIES_CLOUDFLARE_HOSTNAME=skies.example.com
OPTIONAL_SKIES_CLOUDFLARE_ADSB_HOST=wss://skies-ws.example.com
OPTIONAL_SKIES_CLOUDFLARE_FLASK_HOST=https://skies-flask.example.com/flightinfo

OPTIONAL_GEOJSON_MAP=sofla.json

```

## Step 4b - Setup Flask Server config.json

### Create a Flask config.json file

```
cd /path/to/skies-adsb/flask
touch config.json
```

### Add the FlightAware AeroAPI v2 Key to the config.json file

```
{
  "FLIGHTAWARE_API_KEY": "<YOUR API KEY>"
}
```

note: only AeroAPI v2 is currently supported

For instructions on how to create an AeroAPI v2 key go here:

https://flightaware.com/commercial/aeroapi/documentation2.rvt

see section on **"Authentication"**.

## Step 5 - Deploy and run the Raspberry Pi skies-adsb setup.sh Script

With the .env file created you are ready to set up the RPI to host the skies-adsb app.

Make sure you set the DEPLOY_USER_AT_HOSTNAME variable in the .env file.

Copy the setup files over to the RPI as follows:

```

cd /path/to/skies-adsb/raspberrypi
chmod +x deploy_setup.sh
./deploy_setup.sh

```

SSH into the RPI and run the setup script:

```

ssh pi@raspberrypi.local
chmod +x setup.sh
./setup.sh

```

**IMPORTANT NOTE - dump1090-mutability DO NOT AUTOSTART**

**During the install of dump1090-mutability select "NO" to start dump1090-mutability automatically. We will be starting it manually later.**

When the setup script is complete it will reboot the RPI. When the RPI boots up again ssh into the RPI and verify that the flask and websocket proxy are listening on ports 5000 and 30006 respectively.

```

ssh pi@raspberrypi.local
ss -tlp

```

you should see an output similar to the one below:

```

State Recv-Q Send-Q Local Address:Port Peer Address:Port Process
LISTEN 0 128 0.0.0.0:5000 0.0.0.0:_ users:(("flask",pid=499,fd=5),("flask",pid=499,fd=3))
LISTEN 0 1024 0.0.0.0:http 0.0.0.0:_
LISTEN 0 100 0.0.0.0:30006 0.0.0.0:_ users:(("websockify",pid=572,fd=3))
LISTEN 0 128 0.0.0.0:ssh 0.0.0.0:_
LISTEN 0 1024 [::]:http [::]:_
LISTEN 0 128 [::]:ssh [::]:_
```

You can also verify the skies-adsb and skies-flask services are running as follows:

```
ssh pi@raspberrypi.local
sudo systemctl status skies-adsb
sudo systemctl status skies-flask
```

for more detailed service logs you can issue the following commands:

```
ssh pi@raspberrypi.local
sudo journalctl -u skies-adsb
sudo journalctl -u skies-flask
```

Now lets setup your RTL-SDR receiver.

## Step 6 - Install the RTL-SDR receiver

By using a R820T2 based RTL-SDR receiver everything should work out of the box thanks to the [dump1090-mutability](https://github.com/adsbxchange/dump1090-mutability) package installed on the RPI in Step 5.

Now lets verify that the receiver works.

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

Now lets setup the Host machine build environment so we can build and deploy the skies-adsb web app.

## Step 7 - Install Node.js+NPM On Your Host Machine

The skies-adsb web app is built using Node.js+NPM. So we need to install a Node.js environment on your Host machine.

If you already have Node.js and NPM installed on your Host machine then feel free to jump to Step 8.

Install Node.js + NPM on your host machine via NVM (Node Version Manager).

I strongly recommend using NVM to install and manage your Node.js installation. Even the official Node.js and NPM docs recommend using NVM.

https://github.com/nvm-sh/nvm

follow the NVM install instructions above and then run:

```
nvm install node
```

## Step 8 - Build and Deploy the skies-adsb web app to the Raspberry Pi

Once Node.js and NPM are installed now you can build the skies-adsb web app as follows:

```
cd /path/to/skies-adsb
npm install
npm run build
```

when the "npm run build" script is finished you can deploy the web app to the RPI as follows:

```
cd /path/to/skies-adsb
chmod +x deploy.sh
./deploy.sh

```

## Step 9 - Test the skies-adsb Installation

At this point from your Host machine you should be able to open a web browser to:

```
http://raspberypi.local/skies-adsb

```

**NOTE:** _The app works on all of the recent versions of the major browsers: Chrome (Desktop+Mobile), Firefox (Desktop), and Safari (Desktop+Mobile)._

and you should see either a wireframe map of South Florida (if you set the MAP variable in the .env file to: sofla.json) or a wireframe reference grid at the center of the display. You may or may not see any traffic depending on your geographic location. If you are using the South Florida map and you are in South Florida you should see aircraft.

If you see no air traffic make sure you have set the correct Latitude+Longitude coordinates for your default origin as described in [Step 1](INSTALL-GUIDE.md#step-1---determine-your-geolocation-coordinates-latitude-and-longitude).

You can override the default origin lat/lng coordinates from the skies-adsb web app.

Click on the "gear" icon on the upper left side of the screen. This will pop up a gui dialog.
The first two text fields are: latitude and longitude. Enter your default origin coordinates there. To set them click on the 3rd line called: "set origin".

## Step 10 - Enjoy

At this point feel free to take your setup outside, enjoy the outdoors, and do some plane spotting.

I hope you enjoy using the app.
