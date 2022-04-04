import SphericalMercator from '@mapbox/sphericalmercator'


export const DATA_HOSTS = {
  "adsb": `ws://${(process.env.NODE_ENV === "development")
    ? process.env.SKIES_ADSB_HOST_DEV
    : process.env.SKIES_ADSB_HOST}`,
  "flight_info": `http://${(process.env.NODE_ENV === "development")
    ? process.env.SKIES_FLIGHTINFO_HOST_DEV
    : process.env.SKIES_FLIGHTINFO_HOST}/flightinfo`,
  "photos": "https://api.planespotters.net/pub/photos/hex"
}


if (process.env.OPTIONAL_SKIES_CLOUDFLARE_HOSTNAME) {
  const pattern = new URLPattern({
    hostname: process.env.OPTIONAL_SKIES_CLOUDFLARE_HOSTNAME
  })
  if (pattern.test(document.location.href)) {
    DATA_HOSTS["adsb"] = process.env.OPTIONAL_SKIES_CLOUDFLARE_ADSB_HOST_URL
    DATA_HOSTS["flight_info"] = process.env.OPTIONAL_SKIES_CLOUDFLARE_FLASK_HOST_URL
  }
}

console.log(DATA_HOSTS)

//
// ADS-B sends back speed, velocity changes, and altitude in knots and feet.
//
// For display purposes all of the distance, heading, and bearing calculations
// are calculated in meters using the ADS-B lat/long data.
//
// For right now the scale of 1 unit for ever 250 meters seems to look good. 
//
export const SCALE = 1.0 / 250.0


export const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

export const INTERSECTED = {
  key: null,
  mesh: null,
  aircraft: null,
}

export const FOLLOW_CAM_DISTANCE = 24.0


export function isLandscape() {
  return sizes.width > sizes.height && sizes.height < 576
}


//
// haversine/spherical distance and bearing calculations
// source: https://www.movable-type.co.uk/scripts/latlong.html
//

export function calcHaversineDistance(from, to) {
  const R = 6371e3 // metres
  const φ1 = from.lat * Math.PI / 180 // φ, λ in radians
  const φ2 = to.lat * Math.PI / 180
  const Δφ = (to.lat - from.lat) * Math.PI / 180
  const Δλ = (to.lng - from.lng) * Math.PI / 180
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const d = R * c // in metres

  return d
}

export function calcSphericalDistance(from, to) {
  const φ1 = from.lat * Math.PI / 180
  const φ2 = to.lat * Math.PI / 180
  const Δλ = (to.lng - from.lng) * Math.PI / 180
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

const sphericalMercator = new SphericalMercator()

export const origin = {
  longitude: 0,
  latitude: 0,
  x: 0,
  y: 0
}

export function initOrigin(lngLat) {
  [origin.longitude, origin.latitude] = lngLat
  let [mx, my] = sphericalMercator.forward(lngLat)
  origin.x = Math.abs(mx)
  origin.y = Math.abs(my)
}

//
// returns lon/lat into Web Mercator coordinates centered around the UTILS.origin
//
export function getXY(lonLat) {

  let [xx, yy] = sphericalMercator.forward(lonLat)

  if (xx < 0) {
    xx += origin.x
  } else {
    xx -= origin.x
  }

  if (yy < 0) {
    yy += origin.y
  } else {
    yy -= origin.y
  }

  return [xx, -yy]
}
