from flask import Flask
from flask import jsonify
from flask_cors import CORS
import json
import pprint
import requests
import xmltodict

app = Flask(__name__)
app.config.from_file("config.json", load=json.load)
CORS(app)

pp = pprint.PrettyPrinter(indent=2)

@app.route('/flightinfo/<callsign>')
def flightinfo(callsign):
  FLIGHTINFO_BASE_URL = 'http://flightxml.flightaware.com/json/FlightXML2'

  FLIGHTAWARE_HEADERS = {
    'Authorization': 'Basic ' + app.config["FLIGHTAWARE_API_KEY"]
    }

  AIRLINE_CODE = callsign[0:3] if len(callsign) > 2 else ""
  
  print(f'~~~ FLIGHT INFO FOR: {callsign} ~~~~')
  
  FlightInfoExUrl = f'{FLIGHTINFO_BASE_URL}/FlightInfoEx?ident={callsign}&howMany=1'
  r = requests.get(FlightInfoExUrl, headers=FLIGHTAWARE_HEADERS)
  flightInfoExJson = r.json()
  if 'error' in flightInfoExJson:
    flight = {
        'ident': callsign,
        'origin': '',
        'destination': '',
        'originName': '',
        'originCity': '',
        'destinationName': '',
        'destinationCity': '',
      }
  else:
    flight = flightInfoExJson['FlightInfoExResult']['flights'][0]
  print(flight)


  aircraftType = flight['aircrafttype'] if 'aircrafttype' in flight else ""
  AircraftTypeUrl = f'{FLIGHTINFO_BASE_URL}/AircraftType?type={aircraftType}'
  r = requests.get(AircraftTypeUrl, headers=FLIGHTAWARE_HEADERS)
  aircraftTypeJson = r.json()
  if 'error' in aircraftTypeJson:
      aircraftTypeResult = {
        'type': '',
        'description': ''
      }
  else:
      aircraftTypeResult = aircraftTypeJson['AircraftTypeResult']
  print(aircraftTypeResult)

  if (len(AIRLINE_CODE) == 3):
    AirlineInfoUrl = f'{FLIGHTINFO_BASE_URL}/AirlineInfo?airlineCode={AIRLINE_CODE}'
    r = requests.get(AirlineInfoUrl, headers=FLIGHTAWARE_HEADERS)
    airlineInfoJson = r.json()
    if 'error' in airlineInfoJson:
      airlineInfoResult = {
        'name': '',
        'callsign': ''
      }
    else:
      airlineInfoResult = airlineInfoJson['AirlineInfoResult']
  else:
    airlineInfoResult = {
      'name': '',
      'callsign': ''
    }
  print(airlineInfoResult)

  data = {
    'ident': flight['ident'],
    'origin': flight['origin'],
    'destination': flight['destination'],
    'originName': flight['originName'],
    'originCity': flight['originCity'],
    'destinationName': flight['destinationName'],
    'destinationCity': flight['destinationCity'],
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



