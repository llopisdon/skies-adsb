from flask import Flask
from flask import jsonify
from flask_cors import CORS
import json
import pprint
import requests
import xmltodict


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

@app.route('/flightinfo/<callsign>')
def flightinfo(callsign):
  AERO_API_BASE_URL = 'https://aeroapi.flightaware.com/aeroapi/'

  FLIGHTAWARE_HEADERS = {
    'x-apikey': app.config["FLIGHTAWARE_API_KEY"]
    }

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
  
  print(f'~~~ FLIGHT INFO FOR: {callsign} ~~~~')

  flight = EMPTY_FLIGHT
  
  FlightInfoExUrl = f'{AERO_API_BASE_URL}/flights/{callsign}'
  r = requests.get(FlightInfoExUrl, headers=FLIGHTAWARE_HEADERS)
  flightsJson = r.json()

  print("@#@@")
  

  if KEY_FLIGHTS in flightsJson and len(flightsJson[KEY_FLIGHTS]) > 0   :
    flight = flightsJson[KEY_FLIGHTS][0]
    if KEY_ORIGIN not in flight or flight[KEY_ORIGIN] == None:
      flight[KEY_ORIGIN] = EMPTY_LOCATION
    if KEY_DESTINATION not in flight or flight[KEY_DESTINATION] == None:
      flight[KEY_DESTINATION] = EMPTY_LOCATION


  print("FLIGHT: ")
  print(flight)

  print("==============================")

  aircraftType = flight['aircraft_type'] if 'aircraft_type' in flight else None

  EMPTY_AIRCRAFT_TYPE = {
    'manufacturer': '',
    'type': '',
    'description': ''
  }
  
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

  print("==============================")


  EMPTY_AIRLINE = {
    'name': '',
    'callsign': '',
  }

  airlineInfoResult = EMPTY_AIRLINE

  if (len(AIRLINE_CODE) == 3):
    AirlineInfoUrl = f'{AERO_API_BASE_URL}/operators/{AIRLINE_CODE}'
    r = requests.get(AirlineInfoUrl, headers=FLIGHTAWARE_HEADERS)
    airlineInfoJson = r.json()
    print(airlineInfoJson)
    if 'status' not in airlineInfoJson:    
      airlineInfoResult = airlineInfoJson

  print(airlineInfoResult)

  print("==============================")

  NOT_AVAILABLE = "n/a"

  data = {
    'ident': flight[KEY_IDENT] or NOT_AVAILABLE,
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

  print(data)

  return jsonify(data)

@app.route('/metar/<station>')
def metar(station):
  METAR_URL = f'https://www.aviationweather.gov/adds/dataserver_current/httpparam?dataSource=metars&requestType=retrieve&hoursBeforeNow=1&format=xml&stationString={station}'
  print(METAR_URL)
  r = requests.get(METAR_URL)
  data = xmltodict.parse(r.text)
  pp.pprint(data)
  num_results = int(data['response']['data']['@num_results'])
  if num_results == 0:
    print("NO METAR")
    return jsonify({})
  elif num_results == 1:
    print("ONE METAR")
    metar = data['response']['data']['METAR']
    print('###################')
    pp.pprint(metar)
    print('###################')
    return jsonify(metar)
  else:
    print("MORE THAN ONE METAR")
    metar = data['response']['data']['METAR'][0]
    print('###################')
    pp.pprint(metar)
    print('###################')
    return jsonify(metar)



