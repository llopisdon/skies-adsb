# Introduction

This guide provides step-by-step instructions for installing skies-adsb. The instructions outlined here apply to both:

- [Raspberry Pi Installation Guide](RPI-INSTALL-GUIDE.md)
- [localhost Setup Guide](LOCALHOST-SETUP-GUIDE.md)

Follow each step carefully to set up the core dependencies and configuration needed to deploy and run the application.

# Table of Contents

- [Introduction](#introduction)
- [Table of Contents](#table-of-contents)
- [Prerequisites](#prerequisites)
  - [Important Notes](#important-notes)
  - [Required Software](#required-software)
  - [Development Environment](#development-environment)
- [Step 1 - Clone the skies-adsb repository](#step-1---clone-the-skies-adsb-repository)
- [Step 2 - Create src/.env File](#step-2---create-srcenv-file)
- [Step 3 - Setup Flask Server](#step-3---setup-flask-server)
- [Step 4 - Set Your Geolocation Coordinates](#step-4---set-your-geolocation-coordinates)
- [Step 5 - Setup Python environment](#step-5---setup-python-environment)
- [Step 6 - Install Node.js and npm](#step-6---install-nodejs-and-npm)
- [Step 7 - Initialize the Node.js Dependencies](#step-7---initialize-the-nodejs-dependencies)
- [Step 8 - Download Natural Earth Datasets](#step-8---download-natural-earth-datasets)
- [Step 9 - Download FAA Airspace Shapefile](#step-9---download-faa-airspace-shapefile)
- [Step 10 - Extract the Datasets](#step-10---extract-the-datasets)
- [Next Steps](#next-steps)

# Prerequisites

## Important Notes

- Unix command line experience is required to build and deploy skies-adsb
- Follow all installation steps in sequence unless explicitly noted as optional
- Installation process has been streamlined but requires careful attention to detail

## Required Software

- Git
- Python 3.x or higher
- QGIS (for map working with map layers)
- VSCode recommended for Python/JavaScript development
- Modern web browser with WebGL support (Chrome/Firefox recommended)

## Development Environment

Recommended workstation requirements:

- Operating System: Linux (Ubuntu/Fedora) or macOS
- Storage: 5GB free disk space
- Memory: 8GB RAM minimum
- CPU: Quad-core processor

Note: Development and testing was done on Ubuntu and Fedora workstations

# Step 1 - Clone the skies-adsb repository

On your workstation clone the skies-adsb GitHub repository:

```shell
cd /path/to/your/git/projects
git clone https://github.com/llopisdon/skies-adsb.git
```

# Step 2 - Create src/.env File

The src/.env file is used to store numerous environment variables which are necessary for building and running skies-adsb.

```shell
cd /path/to/skies-adsb
cp docs/dot-env-template src/.env
```

# Step 3 - Setup Flask Server

The Flask server acts as a proxy for aviation-related APIs to fetch realtime aircraft and weather information.

Configure the Flask server by following the detailed instructions in the [Flask README](/flask/README.md).

# Step 4 - Set Your Geolocation Coordinates

The skies-adsb app uses geolocation coordinates as a reference point for:

- Map layer rendering
- Aircraft position tracking relative to your ADS-B receiver
- Distance and bearing calculations

The app does not automatically detect location. You must set these coordinates manually.

To get your coordinates:

1. Visit [OpenStreetMap](https://www.openstreetmap.org/)
2. Search for your location
3. Right-click on your exact position
4. Select "Show address"
5. Note the latitude and longitude values

Add these coordinates to your **/path/to/skies-adsb/src/.env** file:

```shell
VITE_DEFAULT_ORIGIN_LATITUDE=<DEFAULT ORIGIN LATITUDE>
VITE_DEFAULT_ORIGIN_LONGITUDE=<DEFAULT ORIGIN LONGITUDE>
```

Example using Miami International Airport (KMIA):

```shell
VITE_DEFAULT_ORIGIN_LATITUDE=25.7955406
VITE_DEFAULT_ORIGIN_LONGITUDE=-80.2918816
```

# Step 5 - Setup Python environment

This step setups up a Python Virtual Environment with all the dependencies needed to run the Python scripts included with the app.

```shell
cd /path/to/skies-adsb
python3 -m venv .venv
source .venv/bin/activate
pip3 install flask
pip3 install flask-cors
pip3 install geopandas
pip3 install osmtogeojson
pip3 install requests
pip3 install websockify
```

# Step 6 - Install Node.js and npm

The skies-adsb web app requires Node.js and npm. If you already have these installed, you can skip to Step 6.

For a clean Node.js installation, use nvm (Node Version Manager) - the recommended way to install and manage Node.js:

1. Install nvm by following the official instructions at:

https://github.com/nvm-sh/nvm

2. Once nvm is installed, install the latest Node.js version:

```shell
nvm install node
```

# Step 7 - Initialize the Node.js Dependencies

Install required node modules by running:

```shell
cd /path/to/skies-adsb
npm install
```

This will install all dependencies specified in package.json.

# Step 8 - Download Natural Earth Datasets

skies-adsb uses Natural Earth datasets and FAA Airspace Shapefiles for building map layers. Due to GitHub file size limitations, you must download and install these data files separately by following the steps below.

## 1:10m Scale Datasets

From https://www.naturalearthdata.com/downloads/10m-cultural-vectors/

- Click "Download all 10m cultural themes"

From https://www.naturalearthdata.com/downloads/10m-physical-vectors/

- Click "Download all 10m physical themes"

## 1:110m Scale Datasets

From https://www.naturalearthdata.com/downloads/110m-cultural-vectors/

- Click "Download all 110m cultural themes"

From https://www.naturalearthdata.com/downloads/110m-physical-vectors/

- Click "Download all 110m physical themes"

Copy the files:

- **10m_cultural.zip**
- **10m_physical.zip**
- **110m_cultural.zip**
- **110m_physical.zip**

to the directory:

```shell
/path/to/skies-adsb/maps/data
```

# Step 9 - Download FAA Airspace Shapefile

Download the FAA Airspace Shapefile:

1. Go to [FAA Airspace Data](https://adds-faa.opendata.arcgis.com/datasets/faa::class-airspace)
2. Click "Download"
3. Choose "Shapefile" format

Save the downloaded **Class_Airspace.zip** file.

Copy the **Class_Airspace.zip** file to:

```shell
/path/to/skies-adsb/maps/data
```

# Step 10 - Extract the Datasets

The install-datasets.sh script will extract the Natural Earth and FAA Airspace datasets to their required locations for use by the build-map-layers.py script.

```shell
cd /path/to/skies-adsb/maps/data
./install-datasets.sh
```

# Next Steps

At this point, choose one of the following guides to complete your installation:

- [Raspberry Pi Installation Guide](RPI-INSTALL-GUIDE.md) - For setting up skies-adsb on a new or existing ADS-B receiver
- [localhost Setup Guide](LOCALHOST-SETUP-GUIDE.md) - For running skies-adsb locally without modifying your ADS-B receiver

Select the guide that matches your intended setup.
