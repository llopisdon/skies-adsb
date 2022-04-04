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

```
cd /path/to/skies-adsb/flask
touch config.json
python3 -m venv dev
. dev/bin/activate
pip3 install flask flask-cors requests xmltodict
```

Run flask server:

```
cd /path/to/skies-adsb/flask
. dev/bin/activate
export FLASK_ENV=development
flash run -h 0.0.0.0
```
