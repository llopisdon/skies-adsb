# skies-flask

A Python3+Flask app which acts as a local proxy to the FlightAware AeroAPI v2 and the FAA METAR api.

# Dependencies:

```
Python 3
flask
flask-cors
requests
xmltodict
```

# Development Environment Setup

## Create a Flask config.json file

```
cd /path/to/skies-adsb/flask
touch config.json
```

## Add the FlightAware AeroAPI v2 Key to the config.json file

```
{
  "FLIGHTAWARE_API_KEY": "<YOUR API KEY>"
}
```

note: only AeroAPI v2 is currently supported

For instructions on how to create an AeroAPI v2 key go here:

https://flightaware.com/commercial/aeroapi/documentation2.rvt

see section on **"Authentication"**.

## Install dependencies

```
python3 -m venv dev
. dev/bin/activate
pip3 install flask flask-cors requests xmltodict
```

## Run the Flask server:

```
cd /path/to/skies-adsb/flask
. dev/bin/activate
export FLASK_ENV=development
flask run -h 0.0.0.0
```
