# Introduction

This document describes how to setup a development environment to hack on skies-adsb.

# Table of Contents

- [Introduction](#introduction)
- [Table of Contents](#table-of-contents)
- [Prerequisites](#prerequisites)
- [Application Architecture](#application-architecture)
  - [The application consists of three main components:](#the-application-consists-of-three-main-components)
    - [Web Frontend (skies-adsb/src)](#web-frontend-skies-adbsrc)
    - [Backend Service (skies-adsb/flask)](#backend-service-skies-adbflask)
    - [Map Generator (skies-adsb/maps)](#map-generator-skies-adbmaps)
- [Tech Stack](#tech-stack)
  - [Languages](#languages)
  - [Frameworks](#frameworks)
  - [Development Tools](#development-tools)
  - [Key Libraries](#key-libraries)
  - [Assets](#assets)
- [Contributing to skies-adsb](#contributing-to-skies-adsb)
- [Development Environment Setup](#development-environment-setup)
  - [Available npm scripts](#available-npm-scripts)
- [HOWTO](#howto)
  - [Updating the Web App](#updating-the-web-app)
  - [Updating the Flask app and RPI System services](#updating-the-flask-app-and-rpi-system-services)
- [Notes](#notes)

# Prerequisites

This guide assumes that you have set up your local environment as described here:

[INSTALL.md](INSTALL.md)

Please follow the steps in the install guide above before continuing.

# Application Architecture

The primary goal of this project was to create 1980s-style 3D vector graphic visualization of ADS-B data. Think Alien, Escape From New York, Max Headroom, and WarGames.

skies-adsb focuses on simplicity and avoids replicating features of existing plane tracking web apps. Its core principles are:

- minimize complexity
- minimize dependencies
- utilize free and open-source software (FOSS) data, libraries, and tools
- provide equal support for desktop and mobile
- run on any WebGL-capable browser

## The application consists of three main components:

### Web Frontend (skies-adsb/src)

- Three.js-based 3D visualization of aircraft ADS-B data
- Interactive user controls and UI elements

### Backend Service (skies-adsb/flask)

- Flight status and summary data proxy
- METAR weather proxy

### Map Generator (skies-adsb/maps)

- Generates GeoJSON map layers from Natural Earth, FAA, and OpenStreetMap data

# Tech Stack

## Languages

- JavaScript
- HTML5
- CSS
- Python 3

## Frameworks

- [three.js](https://threejs.org/) - 3D graphics library
- [Flask](https://flask.palletsprojects.com/) - Python web framework

## Development Tools

- [VScode](https://code.visualstudio.com/) - Code editor
- [Vite](https://vite.dev/) - Build tool
- [npm](https://www.npmjs.com/) - Package manager
- [nvm](https://github.com/nvm-sh/nvm) - Node version manager

## Key Libraries

- [GeoPandas](https://geopandas.org/) - Geospatial data handling
- [GSAP](https://greensock.com/gsap/) - Animation
- [sphericalmercator](https://github.com/mapbox/sphericalmercator) - Map projections
- [dat.gui](https://github.com/dataarts/dat.gui) - UI controls
- [stats.js](https://github.com/mrdoob/stats.js/) - Performance monitoring
- [Troika Text](https://protectwise.github.io/troika/troika-three-text/) - Three.js text rendering

## Assets

- Fonts
  - [IBM Plex Mono](https://fonts.google.com/specimen/IBM+Plex+Mono)
  - [Orbitron](https://fonts.google.com/specimen/Orbitron)
- [Material Icons](https://fonts.google.com/icons)

# Contributing to skies-adsb

If you wish to contribute to skies-adsb please fork the project and submit changes via pull-requests.

# Development Environment Setup

1. Install and configure VSCode

- Recommended for JavaScript development and Python virtual environments
- Excellent integration with project tooling
- Download from: https://code.visualstudio.com/

2. Follow the Localhost+Headless Setup Guide here: [Localhost+Headless Setup Guide](LOCALHOST-HEADLESS-SETUP-GUIDE.md)

3. Once setup is complete, start the development server:

```shell
cd /path/to/skies-adsb
./use_existing_adsb.sh
```

This will launch the application in development mode with live reload enabled.

## Available npm scripts

Start the Vite development server:

```shell
npm run dev
```

Build the skies-adsb web app for distribution:

```shell
npm run build
```

Start the Flask app development server

```shell
npm run dev-flask
```

# HOWTO

## Updating the Web App

If you make local changes to the skies-adsb web app and want to deploy them to your Raspberry Pi, follow these steps:

1. Build your maps:

```shell
cd /path/to/skies-adsb
source .venv/bin/activate
cd maps
python3 build-map-layers.py
```

2. Build the web app:

```shell
cd /path/to/skies-adsb
npm run build
```

3. Deploy the web app:

```shell
cd /path/to/skies-adsb
./deploy_web_app.sh
```

## Updating the Flask app and RPI System services

To update the Flask app or services on your RPI:

1. Edit raspberrypi/install.sh and comment out these lines:

```shell
#optional_do_upgrade_rpi
#echo
#optional_install_dump1090
#echo
```

2. Deploy changes to the RPI:

```shell
cd /path/to/skies-adsb/raspberrypi
./deploy.sh
```

3. SSH to the RPI and run install:

```shell
ssh pi@raspberrypi.local
./install.sh
```

This will update the Flask app and services while preserving your existing **dump1090** installation.

# Notes

For information about working with the Flask app please see the Flask app README:

[Flask App README](/flask/README.md)
