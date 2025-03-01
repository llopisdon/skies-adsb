# Localhost & Headless Setup Guide

This guide describes how to set up skies-adsb to connect to an existing ADS-B receiver, either on your local machine or a headless system. The setup:

- Runs locally as a web app and Flask application
- Creates a local websocket proxy to forward ADS-B data
- Compatible with ADS-B receivers using SBS format
- Doesn't modify your existing ADS-B receiver installation

This has been tested on a Linux workstation and a headless Raspberry Pi Zero 2 W.

**Note:** skies-adsb was developed under Linux. This document assumes your workstation is running Linux or macOS.

## Table of Contents

- [Step 1 - Prerequisites](#step-1---prerequisites)
- [Step 2 - Setup src/.env file variables](#step-2---setup-srcenv-file-variables)
  - [Required Environment Variables](#required-environment-variables)
  - [Example .env file](#example-env-file)
  - [Check ADS-B SBS Port 30003 Connection](#check-ads-b-sbs-port-30003-connection)
  - [Enable Flight Status](#enable-flight-status)
- [Step 3 - Start skies-adsb](#step-3---start-skies-adsb)

# Step 1 - Prerequisites

This guide assumes that you have set up your local environment as described here:

[INSTALL.md](INSTALL.md)

Please follow the steps in the install guide above before continuing.

# Step 2 - Setup src/.env file variables

## Required Environment Variables

<!-- prettier-ignore -->
| Variable Name | Explanation | Value | Default |
| ------------- | ----------- | ------| ------- |
| SKIES_ADSB_USE_EXISTING_ADSB | Specifies the IP address and port of your ADS-B receiver | `<ADS-B RECEIVER IP ADDRESS>:<SBS PORT>` | None    |

**NOTE: typically SBS port is on 30003**

```shell
cd /path/to/skies-adsb/src
```

add the following variables to the **.env** file:

```shells
SKIES_ADSB_USE_EXISTING_ADSB=<ADS-B RECEIVER IP ADDRESS>:<SBS PORT>
```

## Example .env file

### NOTE: When SKIES_ADSB_USE_EXISTING_ADSB is defined, skies-adsb defaults to using localhost for both websocket and flask connections.

Example **.env** file with default origin centered on **KMIA** and ADS-B receiver at **192.168.1.123:30003**:

```shell
SKIES_ADSB_DEFAULT_ORIGIN_LATITUDE=25.7955406
SKIES_ADSB_DEFAULT_ORIGIN_LONGITUDE=-80.2918816

SKIES_ADSB_USE_EXISTING_ADSB=192.168.1.123:30003
```

Example **.env** file with default origin centered on **KMIA** and ADS-B receiver at **localhost:30003**:

```shell
SKIES_ADSB_DEFAULT_ORIGIN_LATITUDE=25.7955406
SKIES_ADSB_DEFAULT_ORIGIN_LONGITUDE=-80.2918816

SKIES_ADSB_USE_EXISTING_ADSB=localhost:30003
```

## Check ADS-B SBS Port 30003 Connection

Before proceeding, verify that your ADS-B receiver allows connections on port 30003:

```shell
nmap -p 30003 <YOUR-ADSB-IP-ADDRESS>
```

Example:

```shell
nmap -p 30003 192.168.1.123
```

You should see something like:

```shell

PORT      STATE SERVICE
30003/tcp open  amicon-fpsu-ra

```

**Note:** Some ADS-B receivers only allow connections from localhost by default. You may need to configure your receiver to accept external connections.

## Enable Flight Status

If you wish to enable flight status with FlightAware AeroAPI then please follow the **OPTIONAL** section in the Flask Server setup instructions here:

[flask/README.md](/flask/README.md)

**note: skip the last part called "Run the Flask Server".\***

# Step 3 - Start skies-adsb

```shell
cd /path/to/skies-adsb
./use_existing_adsb.sh
```

**NOTE: To exit press CTRL+C.**

The script will:

<!-- prettier-ignore -->
| Action | Description |
| -------| ----------- |
| Start web app          | In development mode on localhost:5173 and `<LOCALHOST-NETWORK-IP>:5173`                                |
| Start Flask app        | In development mode on localhost:5000 and `<LOCALHOST-NETWORK-IP>:5000`                                |
| Create websocket proxy | Sets up on localhost:30006 and `<LOCALHOST-NETWORK-IP>:30006` to forward ADS-B data from your receiver |

For example, if your localhost IP address is 192.168.1.123 you should see an output similar to below:

```shell
  VITE v5.4.14  ready in 1888 ms
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.123:5173/
  ➜  press h + enter to show help
```

Once running, you should see live aircraft traffic in your local area.
