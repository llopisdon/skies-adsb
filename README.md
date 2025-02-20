# skies-adsb

### ✈️ [Current Version: 2.1.4](CHANGELOG.md) 🚁

![Screenshot](docs/screenshot.png)

_Image of the skies-adsb app running in a browser showing air traffic around KMIA in Miami, FL_

# Introduction

skies-adsb transforms your browser into a real-time 3D air traffic display. Using ADS-B data from an RTL-SDR receiver, you can explore local air traffic, surrounding airspace, and geography with customizable 3D maps.

Built with:

- JavaScript
- HTML5
- CSS
- Python 3
- WebGL (Three.js)

Runs on all major modern browsers (Chrome, Firefox, Safari).

## Features

- Real-time aircraft tracking and rendering using unfiltered [ADS-B](https://mode-s.org/decode/content/ads-b/1-basics.html) data
- Deployable on a [Raspberry Pi](https://www.raspberrypi.org/) on your local network
- Compatible with existing ADS-B installations on separate hosts
- Enhanced flight data via [FlightAware AeroAPI v4](https://flightaware.com/commercial/aeroapi/)
- Aircraft photos integration from [Planespotters.net](https://www.planespotters.net/)
- Custom map layers powered by [Natural Earth Data](https://www.naturalearthdata.com/), [FAA Aeronautical Data Delivery Service](https://adds-faa.opendata.arcgis.com/), and [OpenStreetMap](https://www.openstreetmap.org/)

- Touch-friendly mobile web interface
- Install as PWA on mobile or desktop

![Gif Recording](docs/skies-adsb-v2-recording.gif)

_Recording of the skies-adsb app running in a browser demonstrating the use of the onscreen controls_

![Custom Map Layers](docs/custom-map-layers.png)

_Examples of custom map layers: Miami International (KMIA), LaGuardia (KLGA), and Mexico City International (MMMX) airports_

# Build and Installation

skies-adsb requires a build process prior to deployment and cannot be run directly from source code.

For complete build and installation instructions, see [INSTALL.md](docs/INSTALL.md).

### NOTE: Version 2.x Release

There were breaking changes from **1.x** to **2.x.** You will need to reinstall the app if you were running the 1.x version.

Please see the [CHANGELOG.md](CHANGELOG.md) for details.

# Contributing

## Development

For development setup and guidelines, see [DEVELOPMENT.md](docs/DEVELOPMENT.md).

## Issues

Use the issue tracker to:

- Report bugs
- Request features (Please no requests for Docker containers--see below)
- Suggest improvements

Please include relevant details and steps to reproduce when submitting issues.

### NOTE: I'm not currently accepting requests for Docker containers. While I appreciate the interest in Docker containers, I've chosen to focus my development efforts in other areas. See: [Issue #6](https://github.com/machineinteractive/skies-adsb/issues/6)

## Community Screenshots

Please share screenshots of your skies-adsb installation in action! To submit a screenshot please open an issue, attach a screenshot, and label it:

```
screenshot
```

# Support This Project

<a href="https://www.buymeacoffee.com/machineinteractive"><img src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=&slug=machineinteractive&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff" /></a>

# Thanks

I would like to give special thanks to the following people who gave me valuable feedback and helped me debug the app:

Andre Thais CFI

[Frank E. Hernandez](https://github.com/CodeMinion)

# Attribution

## Natural Earth Data

High-quality public domain map datasets are provided by [Natural Earth](https://www.naturalearthdata.com/).

![Natural Earth Logo](docs/NEV-Logo-Black.png)

## OpenStreetMap Data

Additional map data provided by [OpenStreetMap](https://www.openstreetmap.org/copyright) via the Overpass API.

## Fallback Aircraft Photo

Pan Am Boeing 747-121 N732PA image by Aldo Bidini  
Source: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Pan_Am_Boeing_747-121_N732PA_Bidini.jpg)

# References

## Raspberry Pi

[Raspberry Pi Documentation](https://www.raspberrypi.com/documentation/)

## RTL-SDR + ADS-B

[The 1090 Megahertz Riddle (second edition) A Guide to Decoding Mode S and ADS-B Signals](https://mode-s.org/1090mhz/)

[RTL-SDR Quick Start Guide](https://www.rtl-sdr.com/rtl-sdr-quick-start-guide/)

[Gqrx is an open source software defined radio receiver ](https://www.gqrx.dk/)

[FlightAware PiAware](https://www.flightaware.com/adsb/piaware/)

[FlightAware AeroAPI](https://www.flightaware.com/commercial/aeroapi/)

## GIS

[PyGIS - Open Source Spatial Programming & Remote Sensing](https://pygis.io/)

https://geopandas.org/

## Datasets

[Natural Earth Data](https://www.naturalearthdata.com/)

[FAA Aeronautical Data Delivery Service](https://adds-faa.opendata.arcgis.com/)

[OpenStreetMap](https://www.openstreetmap.org/)
