# skies-adsb Flask app

This document describes how to setup the skies-adsb Flask app server which acts as a local proxy to the FlightAware AeroAPI v4 and the FAA METAR api.

The FlightAware AeroAPI integration is optional. When enabled, it allows fetching flight status information for aircraft with a known callsign.

## Table of Contents

- [Dependencies](#dependencies)
- [Step 1 - Create a Flask config.json file](#step-1---create-a-flask-configjson-file)
- [Step 2 - OPTIONAL: Add the FlightAware AeroAPI v4 Key to the config.json File](#step-2---optional-add-the-flightaware-aeroapi-v4-key-to-the-configjson-file)
- [Notes](#notes)
  - [Run the Flask Server In Development Mode](#run-the-flask-server-in-development-mode)
  - [Verify Flask Server is working](#verify-flask-server-is-working)

## Dependencies

| Dependency             | Description                                                |
| ---------------------- | ---------------------------------------------------------- |
| Python 3               | Scripting language for GeoJSON layer creation              |
| flask                  | Web framework for Python                                   |
| flask-cors             | Flask extension for handling Cross Origin Resource Sharing |
| Requests               | HTTP library for Python                                    |
| GeoPandas              | Geospatial data processing library                         |
| osmtogeojson           | Converts Overpass API data to GeoJSON                      |
| Natural Earth datasets | Pre-included map data (see update instructions below)      |
| FAA airspace data      | Pre-included airspace data (see update instructions below) |
| QGIS (optional)        | GUI tool for viewing and editing GeoJSON layers            |
| VSCode (optional)      | Recommended IDE for Python development                     |

# Step 1 - Create a Flask config.json file

```shell
cd /path/to/skies-adsb
cp docs/flask-config-template.json flask/config.json
```

# Step 2 - OPTIONAL: Add the FlightAware AeroAPI v4 Key to the config.json File

### If you don't have a FlightAware AeroAPI subscription, you can skip this step. Flight status information will be unavailable.

### CAUTION: AeroAPI is a paid service. Visit the documentation link below for API key creation and billing setup.

```json
{
  "FLIGHTAWARE_API_KEY": "<YOUR API KEY>"
}
```

_note: only AeroAPI v4+ is supported_

For instructions on how to create an AeroAPI v4 key go here:

https://flightaware.com/aeroapi/portal/documentation

see section on **"Authentication"**.

# Notes

## Run the Flask Server In Development Mode

Start the Flask app in development mode:

```bash
npm run dev-flask
```

## Verify Flask Server is working

You can test that the app is working correctly by making a test request:

```bash
curl http://localhost:5000/hello
```

If everything is working as expected you will see:

```json
{ "text": "Hello, World!" }
```
