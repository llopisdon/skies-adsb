import { SphericalMercator } from '@mapbox/sphericalmercator'

const ADSB_LOCALHOST = window.location.hostname

const ADSB_HOST = import.meta.env.VITE_USE_EXISTING_ADSB ?
  `${ADSB_LOCALHOST}:30006` :
  `${import.meta.env.VITE_SKIES_ADSB_RPI_HOST}:30006`

const FLASK_HOST = import.meta.env.VITE_USE_EXISTING_ADSB ?
  `${ADSB_LOCALHOST}:5000` :
  `${import.meta.env.VITE_SKIES_ADSB_RPI_HOST}:5000`

export const DATA_HOSTS = {
  "adsb": `ws://${ADSB_HOST}`,
  "flight_info": `http://${FLASK_HOST}/flightinfo`,
  "metar": `http://${FLASK_HOST}/metar`,
  "photos": "https://api.planespotters.net/pub/photos/hex"
}

console.log("DATA_HOSTS:")
console.table(DATA_HOSTS)
// Object.entries(DATA_HOSTS).forEach(([key, value]) => {
//   console.log(`\t${key}: ${value}`)
// })

//
// ADS-B sends back speed, velocity changes, and altitude in knots and feet.
//
// For display purposes all of the distance, heading, and bearing calculations
// are calculated in meters using the ADS-B lat/long data.
//
// For right now the scale of 1 unit over 250 unit seems to look good. 
//
// TODO improve documentation about how DEFAULT_SCALE works
//
export const DEFAULT_SCALE = 1.0 / 250.0

//
// Camera Default Settings
//
// NOTE:
// CAMERA_FAR should always be at least double the SKYBOX_RADIUS
//
export const CAMERA_FOV = 75
export const CAMERA_NEAR = 0.1
export const CAMERA_FAR = 10000.0

//
// Skybox Radius
//
// NOTE:
// SKYBOX_RADIUS should be less than or equal to half of the camera far plane
//
export const SKYBOX_RADIUS = 3000.0

//
// Follow Camera Default Settings
//
// NOTE:
// min polar angle: 45 degrees
// max polar angle: 135 degrees
//
export const FOLLOW_CAM_DISTANCE = 24.0
export const FOLLOW_CAM_DAMPING_FACTOR = 0.95
export const FOLLOW_CAM_VELOCITY_THRESHOLD = 0.001
export const FOLLOW_CAM_DIRECTION_CHANGE_RESISTANCE = 0.7
export const FOLLOW_CAM_VELOCITY_SMOOTHING = 0.3
export const FOLLOW_CAM_MIN_POLAR_ANGLE = Math.PI / 4
export const FOLLOW_CAM_MAX_POLAR_ANGLE = (3 * Math.PI) / 4


//
// Polar Grid Default Settings
//
// NOTE: 
// Polar Grid Radius should ideally match the SKYBOX_RADIUS
//
export const POLAR_GRID_RADIUS = 3000.0
export const POLAR_GRID_RADIALS = 16
export const POLAR_GRID_CIRCLES = 5
export const POLAR_DIVISIONS = 64
export const POLAR_GRID_COLOR_1 = "#81efff"
export const POLAR_GRID_COLOR_2 = "#81efff"

//
// Aircraft Default Settings
//

//
// Aircraft time-to-live in seconds
//
// NOTE: 
// Adjust this value as needed. Use increments of +/- 5 seconds. 
// If you find that aircraft are disappearing too quickly try increasing this value. 
// If you find that aircraft are not disappearing quickly enough try decreasing this value. 
// The best value is dependent on how much traffic you have in your area.
//
export const AIRCRAFT_TTL = 15.0
// trail update frequency is based on number of valid telemetry updates that have occurred
export const AIRCRAFT_TRAIL_UPDATE_FREQUENCY = 75
export const AIRCRAFT_MAX_TRAIL_POINTS = 5000
// guards against sudden jumps tail in altitude due to bad ADS-B data
export const AIRCRAFT_TRAIL_UPDATE_Y_POS_THRESHOLD = 1000.0 * DEFAULT_SCALE




export const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

export const INTERSECTED = {
  key: null,
  mesh: null,
  aircraft: null,
}


export function parseViteEnvBooleanSetting(value) {
  if (value === undefined) return undefined
  const setting = value.toLowerCase()
  if (setting === "true") return true
  if (setting === "false") return false
  return undefined
}

export const settings = {
  show_all_trails: parseViteEnvBooleanSetting(import.meta.env.VITE_SETTINGS_SHOW_ALL_TRAILS) ?? true,
  show_aerodromes: parseViteEnvBooleanSetting(import.meta.env.VITE_SETTINGS_SHOW_AERODROMES) ?? true,
  show_origin_labels: parseViteEnvBooleanSetting(import.meta.env.VITE_SETTINGS_SHOW_ORIGINS) ?? true,
  show_runways: parseViteEnvBooleanSetting(import.meta.env.VITE_SETTINGS_SHOW_AERODROMES) ?? true,
  show_airspace_class_b: parseViteEnvBooleanSetting(import.meta.env.VITE_SETTINGS_SHOW_AIRSPACE_CLASS_B) ?? true,
  show_airspace_class_c: parseViteEnvBooleanSetting(import.meta.env.VITE_SETTINGS_SHOW_AIRSPACE_CLASS_C) ?? true,
  show_airspace_class_d: parseViteEnvBooleanSetting(import.meta.env.VITE_SETTINGS_SHOW_AIRSPACE_CLASS_D) ?? true,
  show_urban_areas: parseViteEnvBooleanSetting(import.meta.env.VITE_SETTINGS_SHOW_URBAN_AREAS) ?? true,
  show_roads: parseViteEnvBooleanSetting(import.meta.env.VITE_SETTINGS_SHOW_ROADS) ?? true,
  show_lakes: parseViteEnvBooleanSetting(import.meta.env.VITE_SETTINGS_SHOW_LAKES) ?? true,
  show_rivers: parseViteEnvBooleanSetting(import.meta.env.VITE_SETTINGS_SHOW_RIVERS) ?? true,
  show_states_provinces: parseViteEnvBooleanSetting(import.meta.env.VITE_SETTINGS_SHOW_STATES_PROVINCES) ?? true,
  show_counties: parseViteEnvBooleanSetting(import.meta.env.VITE_SETTINGS_SHOW_COUNTIES) ?? true,
}

console.log("UTIL SETTINGS: ")
console.table(settings)

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
  const bearing = (θ * 180 / Math.PI + 360) % 360 // in degrees

  return bearing
}

const sphericalMercator = new SphericalMercator()

let originX = undefined
let originY = undefined

export async function setOrigin(lonLat) {
  let [mx, my] = sphericalMercator.forward(lonLat)
  originX = Math.abs(mx)
  originY = Math.abs(my)
  console.log("[UTIL] setOrigin:", lonLat, mx, my, originX, originY)
}

//
// convert lon/lat into Web Mercator XY coordinates centered around the UTILS.origin
//
export function getXY(lonLat) {
  let [xx, yy] = sphericalMercator.forward(lonLat)

  if (xx < 0) {
    xx += originX
  } else {
    xx -= originY
  }

  if (yy < 0) {
    yy += originX
  } else {
    yy -= originY
  }

  return [xx, -yy]
}
