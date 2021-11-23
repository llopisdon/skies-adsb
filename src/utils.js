import * as THREE from 'three'

export const DATA_HOSTS = {
  "adsb": `ws://${(process.env.NODE_ENV === "development")
    ? process.env.SKIES_ADSB_HOST_DEV
    : process.env.SKIES_ADSB_HOST}`,
  "flightinfo": `http://${(process.env.NODE_ENV === "development")
    ? process.env.SKIES_FLASK_HOST_DEV
    : process.env.SKIES_FLASK_HOST}/flightinfo`,
  "photos": "https://api.planespotters.net/pub/photos/hex"
}

console.log(DATA_HOSTS)

//
// ADS-B sends back speed, velocity changes, and altitude in knots and feet.
//
// For display purposes all of the distance, heading, and bearing calculations
// are calculted in meters using the ADS-B lat/long data.
//
// For right now the scale of 1 unit for ever 250 meters seems to look good. 
//
export const SCALE = 1.0 / 250.0


export const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

export const origin = {
  lat: 0,
  lng: 0
}

export const INTERSECTED = {
  key: null,
  mesh: null
}


export function isLandscape() {
  return sizes.width > sizes.height && sizes.height < 576
}


//
// haversine/spherical distance and bearing calculations
// source: https://www.movable-type.co.uk/scripts/latlong.html
//

export function calcHaversineDistance(from, to) {
  const lat1 = from.lat
  const lng1 = from.lng
  const lat2 = to.lat
  const lng2 = to.lng

  const R = 6371e3 // metres
  const φ1 = lat1 * Math.PI / 180 // φ, λ in radians
  const φ2 = lat2 * Math.PI / 180
  const Δφ = (lat2 - lat1) * Math.PI / 180
  const Δλ = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const d = R * c // in metres

  return d
}

export function calcSphericalDistance(from, to) {
  const lat1 = from.lat
  const lng1 = from.lng
  const lat2 = to.lat
  const lng2 = to.lng

  const φ1 = lat1 * Math.PI / 180
  const φ2 = lat2 * Math.PI / 180
  const Δλ = (lng2 - lng1) * Math.PI / 180
  const R = 6371e3
  const d = Math.acos(Math.sin(φ1) * Math.sin(φ2) + Math.cos(φ1) * Math.cos(φ2) * Math.cos(Δλ)) * R

  return d
}

export function calcBearing(from, to) {
  const φ1 = from.lat
  const λ1 = from.lng
  const φ2 = to.lat
  const λ2 = to.lng

  const y = Math.sin(λ2 - λ1) * Math.cos(φ2)
  const x = Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1)

  const θ = Math.atan2(y, x)
  const brng = (θ * 180 / Math.PI + 360) % 360 // in degrees

  return brng
}

export function getXY(from, to) {
  const bearing = calcBearing(from, to)
  const d = calcSphericalDistance(from, to)

  const x = d * Math.cos(THREE.MathUtils.degToRad(90 - bearing))
  const y = -d * Math.sin(THREE.MathUtils.degToRad(90 - bearing))

  return { x: x, y: y }
}
