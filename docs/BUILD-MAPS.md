# Introduction

This document describes how to build custom GeoJSON map layers for skies-adsb.

skies-adsb centers map layers on a point of origin you specify, such as:

- Your ADS-B installation location
- A nearby aerodrome
- Any point of interest

![Custom Map Layers](custom-map-layers.png)

_Examples: Custom map layers for Miami International (KMIA), LaGuardia (KLGA), and Mexico City International (MMMX) airports_

The project uses data from:

- Natural Earth datasets (boundaries, roads, points of interest)
- FAA airspace data (Class B, C, D controlled airspace)
- OpenStreetMap via Overpass API (aerodrome boundaries, origins, runways)

A script at `maps/build-map-layers.py` automates building these GeoJSON layers.

Custom map layers are also supported. Please review the automated process before consulting the appendix for custom layer instructions.

## Table of Contents

- [Introduction](#introduction)
- [Dependencies](#dependencies)
- [Step 1 - Prerequisites](#step-1---prerequisites)
- [Step 2 - Build Map Layers for Your Location](#step-2---build-map-layers-for-your-location)
- [Appendix](#appendix)
  - [Map Layer Output Files](#map-layer-output-files)
    - [Natural Earth Layers](#natural-earth-layers)
    - [FAA Airspace Boundaries](#faa-airspace-boundaries)
    - [OpenStreetMap Data](#openstreetmap-data)
  - [Creating Custom Map Layers With QGIS](#creating-custom-map-layers-with-qgis)
    - [Importing custom GeoJSON layers](#importing-custom-geojson-layers)
    - [How to define custom origins](#how-to-define-custom-origins)
    - [Dataset Update Frequency](#dataset-update-frequency)

## Dependencies

| Dependency             | Description                                     |
| ---------------------- | ----------------------------------------------- |
| Python 3               | Scripting language for GeoJSON layer creation   |
| GeoPandas              | Geospatial data processing library              |
| osmtogeojson           | Converts Overpass API data to GeoJSON           |
| Natural Earth datasets | map data (see INSTALL.md)                       |
| FAA airspace data      | airspace data (see INSTALL.md)                  |
| QGIS (optional)        | GUI tool for viewing and editing GeoJSON layers |
| VSCode (optional)      | Recommended IDE for Python development          |

## Step 1 - Prerequisites

This guide assumes that you have set up your local environment as described here:

[INSTALL.md](INSTALL.md)

Please follow the steps in the install guide above before continuing.

## Step 2 - Build Map Layers for Your Location

Map layers are built using the `build-map-layers.py` script. By default, it generates map layers covering a square area of ±2 degrees latitude/longitude around your default origin.

Example for your default origin:

```shell
cd /path/to/skies-adsb
cd maps
chmod +x build-map-layers.sh
./build-map-layers.sh
```

To adjust the coverage area:

```shell
cd /path/to/skies-adsb
cd maps
chmod +x build-map-layers.sh
./build-map-layers.sh --default-origin-distance 5
```

**Important:**

- Coverage areas >2 degrees may hit Overpass API rate limits or timeout
- For larger areas, use QGIS to:
  1. Generate multiple 2x2 degree sections
  2. Combine them into unified layers

After building the layers, you can run the skies-adsb simulation.

## Appendix

### Map Layer Output Files

The map layers will be placed into:

```shell
/path/to/skies-adsb/public/map-data
```

See below for a description of the generated files.

#### Natural Earth Layers

| File                     | Description                               |
| ------------------------ | ----------------------------------------- |
| airports.geojson         | Airports at 1:10m scale                   |
| counties.geojson         | Counties at 1:10m scale                   |
| lakes.geojson            | Lakes at 1:10m or 1:110m scale            |
| rivers.geojson           | Rivers at 1:10m or 1:110m scale           |
| roads.geojson            | Roads at 1:10m scale                      |
| states_provinces.geojson | States/provinces at 1:10m or 1:110m scale |
| urban_areas.geojson      | Urban areas at 1:10m scale                |

#### FAA Airspace Boundaries

| File                     | Description                 |
| ------------------------ | --------------------------- |
| airspace_class_b.geojson | Class B airspace boundaries |
| airspace_class_c.geojson | Class C airspace boundaries |
| airspace_class_d.geojson | Class D airspace boundaries |

#### OpenStreetMap Data

| File               | Description                              |
| ------------------ | ---------------------------------------- |
| aerodromes.geojson | Aerodrome geometry data                  |
| origins.json       | Aerodrome origins as lat/lon coordinates |
| runways.geojson    | Runway data                              |

### Creating Custom Map Layers With QGIS

To create custom GeoJSON map layers using QGIS:

1. Install QGIS from https://www.qgis.org
2. Install the QuickOSM plugin within QGIS
3. Load your base layers and data sources
4. Use QGIS tools to:

- Select features
- Filter data
- Edit geometries
- Combine layers

5. Export your work as GeoJSON files

Recommended tutorials:

- Working with Vector Data
- Creating and Editing GeoJSON
- Using the QuickOSM Plugin

For detailed instructions, refer to the official QGIS documentation and tutorials at https://www.qgis.org/en/docs/

#### Importing custom GeoJSON layers

To import your GeoJSON files into skies-adsb make sure to follow the layer filename conventions in the tables above.

NOTE: The skies-adsb map will render all GeoJSON Polygons or MultiPolygons as LineStrings. Solid polygonal rendering is not currently supported and probably never will be as skies-adsb is going for a mostly vector graphics aesthetic.

#### How to define custom origins

Origins are defined using JSON objects with this format:

```json
    {
      "center": {
        "lat": <YOUR LATITUDE GOES HERE>,
        "lon": <YOUR LONGITUDE GOES HERE>
      },
      "tags": {
        "ref": "<YOUR LABEL GOES HERE>"
      }
    }
```

Create a file called origins.json and create a JSON object with an array property called "elements":

```json
{
  "elements": []
}
```

Place each Origin object into the element array. For example:

```json
{
  "elements": [
    {
      "center": {
        "lat": 25.7955406,
        "lon": -80.2918816
      },
      "tags": {
        "ref": "KMIA"
      }
    },
    {
      "center": {
        "lat": 26.0723139,
        "lon": -80.1497953
      },
      "tags": {
        "ref": "KFLL"
      }
    }
  ]
}
```

NOTE: An origin can be any location on Earth - it does not have to be an aerodrome. You can define origins for:

- Cities
- Points of interest
- Geographic features
- Or any other location you want to track aircraft relative to

#### Dataset Update Frequency

- **Natural Earth datasets**: Change infrequently, update as needed
- **FAA VFR sectional charts**: Updated every 56 days

Always rebuild map layers after updating any datasets to ensure your visualizations reflect the latest data.
