#!/usr/bin/env bash

# Set Flask application path
export FLASK_APP=~/skies-adsb/flask/app

# Activate virtual environment
source ~/skies-adsb/.venv/bin/activate

# Change to Flask application directory
cd ~/skies-adsb/flask

# Start Flask server, listening on all interfaces
flask run -h 0.0.0.0
