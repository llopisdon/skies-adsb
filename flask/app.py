from flask import Flask
from flask import jsonify
from flask_cors import CORS
import json
import pprint
import requests


KEY_IDENT = 'ident'
KEY_FLIGHTS = 'flights'
KEY_ORIGIN = 'origin'
KEY_DESTINATION = 'destination'
KEY_CODE = 'code'
KEY_NAME = 'name'
KEY_CITY = 'city'

app = Flask(__name__)
app.config.from_file("config.json", load=json.load)
CORS(app)

pp = pprint.PrettyPrinter(indent=2)

def create_flight_data(flight, aircraftTypeResult, airlineInfoResult):
  return {
    'ident': flight[KEY_IDENT],
    'origin': flight[KEY_ORIGIN][KEY_CODE],    
    'originName': flight[KEY_ORIGIN][KEY_NAME],
    'originCity': flight[KEY_ORIGIN][KEY_CITY],
    'destination': flight[KEY_DESTINATION][KEY_CODE],
    'destinationName': flight[KEY_DESTINATION][KEY_NAME],
    'destinationCity': flight[KEY_DESTINATION][KEY_CITY],
    'manufacturer': aircraftTypeResult['manufacturer'],
    'type': aircraftTypeResult['type'],
    'description': aircraftTypeResult['description'],
    'airline': airlineInfoResult['name'],
    'airlineCallsign': airlineInfoResult['callsign']
  }

@app.route('/flightinfo/<callsign>')
def flightinfo(callsign):

  AIRLINE_CODE = callsign[0:3] if len(callsign) > 2 else ""

  EMPTY_LOCATION = {
    KEY_CODE: '',
    KEY_NAME: '',
    KEY_CITY: '',
  }

  EMPTY_FLIGHT = {
        KEY_IDENT: callsign,
        KEY_ORIGIN: EMPTY_LOCATION,
        KEY_DESTINATION:EMPTY_LOCATION,
  }

  EMPTY_AIRCRAFT_TYPE = {
    'manufacturer': '',
    'type': '',
    'description': ''
  }
  
  EMPTY_AIRLINE = {
    'name': '',
    'callsign': '',
  }

  if "FLIGHTAWARE_API_KEY" not in app.config or not app.config["FLIGHTAWARE_API_KEY"]:
    print("WARNING: FlightAware API key not found or empty in configuration")
    data = create_flight_data(EMPTY_FLIGHT, EMPTY_AIRCRAFT_TYPE, EMPTY_AIRLINE)
    return jsonify(data)
  
  AERO_API_BASE_URL = 'https://aeroapi.flightaware.com/aeroapi/'

  FLIGHTAWARE_HEADERS = {
    'x-apikey': app.config["FLIGHTAWARE_API_KEY"]
    }

  print("##############################")

  print(f"Fetching Flight Info for: {callsign}")

  flight = EMPTY_FLIGHT
  
  FlightInfoExUrl = f"{AERO_API_BASE_URL}/flights/{callsign}"
  r = requests.get(FlightInfoExUrl, headers=FLIGHTAWARE_HEADERS)
  flightsJson = r.json()

  if KEY_FLIGHTS in flightsJson and len(flightsJson[KEY_FLIGHTS]) > 0   :
    flight = flightsJson[KEY_FLIGHTS][0]
    if KEY_ORIGIN not in flight or flight[KEY_ORIGIN] == None:
      flight[KEY_ORIGIN] = EMPTY_LOCATION
    if KEY_DESTINATION not in flight or flight[KEY_DESTINATION] == None:
      flight[KEY_DESTINATION] = EMPTY_LOCATION

  print(f"FLIGHT:\n{flight}")

  print("==============================")

  aircraftType = flight['aircraft_type'] if 'aircraft_type' in flight else None

  aircraftTypeResult = EMPTY_AIRCRAFT_TYPE

  if aircraftType != None:
    AircraftTypeUrl = f'{AERO_API_BASE_URL}/aircraft/types/{aircraftType}'
    print(AircraftTypeUrl)
    r = requests.get(AircraftTypeUrl, headers=FLIGHTAWARE_HEADERS)
    aircraftTypeJson = r.json()
    
    print(aircraftTypeJson)
    if 'status' not in aircraftTypeJson:
        aircraftTypeResult = aircraftTypeJson
    
  print(aircraftTypeResult)

  print("------------------------------")

  airlineInfoResult = EMPTY_AIRLINE

  if (len(AIRLINE_CODE) == 3):
    AirlineInfoUrl = f'{AERO_API_BASE_URL}/operators/{AIRLINE_CODE}'
    r = requests.get(AirlineInfoUrl, headers=FLIGHTAWARE_HEADERS)
    airlineInfoJson = r.json()
    print(airlineInfoJson)
    if 'status' not in airlineInfoJson:    
      airlineInfoResult = airlineInfoJson

  print(airlineInfoResult)

  print("******************************")
  
  data = create_flight_data(flight, aircraftTypeResult, airlineInfoResult)
  print(data)
  return jsonify(data)

@app.route('/metar/<station>')
def metar(station):
  METAR_URL = f"https://aviationweather.gov/api/data/metar?ids={station}&format=geojson"  
  r = requests.get(METAR_URL)
  return r.json()


@app.route('/hello')
def hello():
  return jsonify({"text": "Hello, World!"})
