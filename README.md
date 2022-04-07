# skies-adsb

![Screenshot](docs/screenshot.png)
_image of the skies-adsb app running in a browser showing air traffic around KMIA in Miami, FL_

# Introduction

skies-adsb is a virtual plane spotting progressive web app (PWA) / virtual aquarium (with aircraft instead of fish) / interactive real-time simulation.

Aircraft are tracked via unfiltered [ADS-B](https://mode-s.org/decode/content/ads-b/1-basics.html) transponder data in real-time and rendered in 3D.

The [ADS-B](https://mode-s.org/decode/content/ads-b/1-basics.html) data source is meant to be a [RTL-SDR receiver](https://www.rtl-sdr.com/about-rtl-sdr/) connected to a [Raspberry Pi](https://www.raspberrypi.org/) running on your home network.

Flight status data is provided by the [FlightAware AeroAPI v2](https://flightaware.com/commercial/aeroapi/).

The aircraft photos are provided by [Planespotters.net](https://www.planespotters.net/).

![Gif Recording](docs/skies-adsb-recording.gif)
_recording of the skies-adsb app running in a browser demonstrating the use of the onscreen controls_

# How To Use

## Installation Guide - How to setup skies-adsb on your local network with a Raspberry Pi

[Install Guide](docs/INSTALL-GUIDE.md)

## How to create skies-adsb GeoJSON maps

[GeoJSON Maps - How To Create/Update/Use](docs/GEOJSON-MAPS.md)

## How to securely deploy skies-adsb on the Internet

[Setup Cloudflare Tunnel to make skies-adsb available over the Internet](docs/CLOUDFLARE-TUNNEL.md)

## Flask API Server Documentation

[Information about the Flask API Server included with skies-adsb](flask/README.md)

# Development

The app is written using WebGL+HTML5+CSS+JavaScript and it works on all of the latest major browsers: Chrome (Desktop+Mobile), Firefox (Desktop), and Safari (Desktop+Mobile). The controls are design to be mobile/tablet friendly.

[Development Guide](docs/DEVELOPMENT.md)

# Contributing

Community GeoJSON maps are welcome. Please submit new maps via a pull-request.

Please report bugs via the issue tracker.

Please submit any feature requests via the issue tracker.

# Thanks

I would like to give special thanks to the following people who gave me valuable feedback and helped me debug the app:

Andre Thais CFI

[Frank E. Hernandez](https://github.com/CodeMinion)

## Fallback Aircraft Photo Attribution

**Pan Am Boeing 747-121 N732PA**

https://commons.wikimedia.org/wiki/File:Pan_Am_Boeing_747-121_N732PA_Bidini.jpg

_by Aldo Bidini_

# References

https://mode-s.org/decode/index.html

https://www.rtl-sdr.com/rtl-sdr-quick-start-guide/

https://www.raspberrypi.com/documentation/

https://www.adsbexchange.com/how-to-feed/

https://flightaware.com/commercial/aeroapi/documentation2.rvt
