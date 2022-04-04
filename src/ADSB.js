import * as AIRCRAFT from './aircraft.js'
import * as UTILS from './utils.js'


//
// dump1090 ADB-S protocol 
//

export const MSG_TYPE = 0
export const TRANSMISSION_TYPE = 1
export const AIRCRAFT_ID = 3
export const HEX_IDENT = 4
export const FLIGHT_ID = 5
export const CALLSIGN = 10
export const ALTITUDE = 11
export const GROUND_SPEED = 12
export const TRACK = 13
export const LATITUDE = 14
export const LONGITUDE = 15
export const SQUAWK = 17
export const IS_ON_GROUND = 21


//
// websocket - handles ADSB messages coming from RTL-SDR/RPI
//
let websocket = null
let scene = null
let clock = null

const handleADSBMessage = (event) => {
  const reader = new FileReader()
  reader.onload = () => {
    const result = reader.result

    // parse SBS data here...

    let data = result.split(",")
    let hexIdent = data[HEX_IDENT]

    if (!(hexIdent in AIRCRAFT.aircraft)) {
      const aircraft = new AIRCRAFT.Aircraft(scene)
      aircraft.hex = hexIdent
      AIRCRAFT.aircraft[hexIdent] = aircraft
    }

    AIRCRAFT.aircraft[hexIdent].update(data, clock.getElapsedTime())
  }
  reader.readAsText(event.data)
}

export function start(threeJsScene, threeJsClock) {
  console.log("[start WebSocket connection...]")
  scene = threeJsScene
  clock = threeJsClock
  websocket = new WebSocket(UTILS.DATA_HOSTS["adsb"])
  websocket.addEventListener('error', (event) => {
    console.log('Error Message from server ', event.data)
  })
  websocket.addEventListener('message', handleADSBMessage)
}

export function close() {
  console.log("[close WebSocket connection...]")
  websocket.removeEventListener('message', handleADSBMessage)
  websocket.close(1000)
}



