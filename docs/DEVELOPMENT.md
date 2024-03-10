# Development Guide

This document describes how to setup a development environment to hack on skies-adsb.

I highly suggest using [VScode](https://code.visualstudio.com/) but you can use any IDE or text editor of your choice.

## Contributing to skies-adsb

If you wish to contribute to skies-adsb please fork the project and submit changes via pull-requests.

## Setting up development environment

### 1. Fork the skies-adsb project found here:

https://github.com/llopisdon/skies-adsb

#### 2. Install nvm and node.js

make sure you have installed the Node Version Manager(nvm) from here:

https://github.com/nvm-sh/nvm

once installed install node.js:

```
nvm install node
```

### 3. Initialize the skies-adsb node modules

```
cd /path/to/skies-adsb
npm install
```

### 4. Edit the .env file to include your local dev hosts

```
cd /path/to/skies-adsb
touch src/.env
```

edit the .env file as described in the install guide here:

[Step 4](RPI-INSTALL-GUIDE.md#step-4---setup-env-file-variables)

example src/.env file:

```
VITE_DEFAULT_ORIGIN_LATITUDE=25.794868197349306
VITE_DEFAULT_ORIGIN_LONGITUDE=-80.27787208557129

VITE_DEPLOY_USER_AT_HOSTNAME=pi@raspberrypi.local

VITE_SKIES_ADSB_HOST=192.168.1.1:30006
VITE_SKIES_ADSB_HOST_DEV=localhost:30006

VITE_SKIES_FLASK_HOST=192.168.1.1:5000
VITE_SKIES_FLASK_HOST_DEV=localhost:5000

VITE_OPTIONAL_SKIES_CLOUDFLARE_HOSTNAME=skies.example.com
VITE_OPTIONAL_SKIES_CLOUDFLARE_ADSB_HOST=wss://skies-ws.example.com
VITE_OPTIONAL_SKIES_CLOUDFLARE_FLASK_HOST=https://skies-flask.example.com/flightinfo

VITE_OPTIONAL_GEOJSON_MAP=sofla.json
```

if you have an external or existing ADS-B decoder you can modify the VITE_SKIES_ADSB_HOST and VITE_SKIES_ADSB_HOST_DEV values to point to it as described in this document:

[LOCALHOST-INTSALL-GUIDE](LOCALHOST-INSTALL-GUIDE.md)

### 5. Run dev server

now you are ready to run the webpack dev server to serve the app locally:

```
npm run start
```

if you wish to run the flask server locally you can do this with:

```
npm run start-flask-dev
```

## Languages

JavaScript, HTML5, CSS, Python 3

## Frameworks

[three.js](https://threejs.org/), [Flask](https://flask.palletsprojects.com/)

## Tools

[npm](https://www.npmjs.com/), [webpack](https://webpack.js.org/), [nvm](https://github.com/nvm-sh/nvm)

## Libraries

[GSAP](https://greensock.com/gsap/), [sphericalmercator](https://github.com/mapbox/sphericalmercator), [dat.gui](https://github.com/dataarts/dat.gui), [stats.js](https://github.com/mrdoob/stats.js/), [Troika Text for Three.js](https://protectwise.github.io/troika/troika-three-text/)

## Fonts and Icons

[IBM Plex Mono](https://fonts.google.com/specimen/IBM+Plex+Mono), [Orbitron](https://fonts.google.com/specimen/Orbitron)

[Material Icons](https://fonts.google.com/icons)
