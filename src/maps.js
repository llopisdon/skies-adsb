import * as THREE from 'three'
import { Text } from 'troika-three-text'
import * as UTILS from './utils.js'

const AERODROME_LABEL_HEIGHT = 2.0
const AERODROME_LABEL_FONT_SIZE = 2

const TEXT_COLOR = new THREE.Color(0xed225d)
const TEXT_FONT = "./static/Orbitron-VariableFont_wght.ttf"

export const LAYER_AERODROMES = "aerodromes"
export const LAYER_ORIGINS = "origins"
export const LAYER_RUNWAYS = "runways"
export const LAYER_AIRSPACE_CLASS_B = "airspace_class_b"
export const LAYER_AIRSPACE_CLASS_C = "airspace_class_c"
export const LAYER_AIRSPACE_CLASS_D = "airspace_class_d"
export const LAYER_URBAN_AREAS = "urban_areas"
export const LAYER_ROADS = "roads"
export const LAYER_LAKES = "lakes"
export const LAYER_RIVERS = "rivers"
export const LAYER_STATES_PROVINCES = "states_provinces"
export const LAYER_COUNTIES = "counties"

export const LAYER_NAMES = [
  LAYER_AERODROMES,
  LAYER_ORIGINS,
  LAYER_RUNWAYS,
  LAYER_AIRSPACE_CLASS_B,
  LAYER_AIRSPACE_CLASS_C,
  LAYER_AIRSPACE_CLASS_D,
  LAYER_URBAN_AREAS,
  LAYER_ROADS,
  LAYER_LAKES,
  LAYER_RIVERS,
  LAYER_STATES_PROVINCES,
  LAYER_COUNTIES,
]

const MAP_DATA_DIR = "map-data"

const LAYERS_GEOJSON = {}

// setup geojson data layers
LAYER_NAMES.forEach((layerName) => {
  // skip aerodrome label layer as it is not geojson data layer
  if (layerName === LAYER_ORIGINS) {
    return
  }
  LAYERS_GEOJSON[layerName] = `${MAP_DATA_DIR}/${layerName}.geojson`
})

export const LAYER_GROUPS = {}

export const ORIGINS = {}
export const DEFAULT_ORIGIN = "Default Origin"


export function isLayerVisible(layerName) {
  switch (layerName) {
    case LAYER_AERODROMES:
      return UTILS.settings.show_aerodromes
    case LAYER_ORIGINS:
      return UTILS.settings.show_aerodromes
    case LAYER_RUNWAYS:
      return UTILS.settings.show_aerodromes
    case LAYER_AIRSPACE_CLASS_B:
      return UTILS.settings.show_airspace_class_b
    case LAYER_AIRSPACE_CLASS_C:
      return UTILS.settings.show_airspace_class_c
    case LAYER_AIRSPACE_CLASS_D:
      return UTILS.settings.show_airspace_class_d
    case LAYER_URBAN_AREAS:
      return UTILS.settings.show_urban_areas
    case LAYER_ROADS:
      return UTILS.settings.show_roads
    case LAYER_LAKES:
      return UTILS.settings.show_lakes
    case LAYER_RIVERS:
      return UTILS.settings.show_rivers
    case LAYER_STATES_PROVINCES:
      return UTILS.settings.show_states_provinces
    case LAYER_COUNTIES:
      return UTILS.settings.show_counties
    default:
      return false
  }
}


let ORIGINS_DATA = null

export async function init() {
  console.log("MAPS: init...")

  ORIGINS_DATA = await getOriginsData()
  const hasValidOrigins = await buildOrigins(ORIGINS_DATA)

  LAYER_NAMES.forEach((layerName) => {
    LAYER_GROUPS[layerName] = null
  })

  console.log("MAPS: init done...")
  return hasValidOrigins
}

export async function buildMapLayers(scene) {
  try {
    console.log("MAPS: building map layers...")

    // build map layers
    Object.entries(LAYERS_GEOJSON).forEach(async ([layerName, fileName]) => {
      const group = await buildMapLayer(scene, layerName, fileName)
      scene.add(group)
      LAYER_GROUPS[layerName] = group
      group.visible = isLayerVisible(layerName)
      group.needsUpdate = true
    })

    // build map labels layer separately as we need to get the origin data from another json file
    console.log("\tbuilding layer: origin labels")
    const originLabelsLayerGroup = await buildOriginLabelsLayer(scene, ORIGINS_DATA)
    scene.add(originLabelsLayerGroup)
    LAYER_GROUPS[LAYER_ORIGINS] = originLabelsLayerGroup
    originLabelsLayerGroup.visible = isLayerVisible(LAYER_ORIGINS)
    originLabelsLayerGroup.needsUpdate = true

    console.log("MAPS: map layers built...")
  } catch (e) {
    console.error(e)
  }
}

const mapDefaultLineMaterial = new THREE.LineBasicMaterial({
  color: 0x81efff
})

const airspaceBLineMaterial = new THREE.LineBasicMaterial({
  color: 0x0000ff,
})
const airspaceCLineMaterial = new THREE.LineBasicMaterial({
  color: 0xff00ff,
})
const airspaceDLineMaterial = new THREE.LineBasicMaterial({
  color: 0x0000cc,
})
const roadsLineMaterial = new THREE.LineBasicMaterial({
  color: 0xf39900,
})
const urbanAreasLineMaterial = new THREE.LineBasicMaterial({
  color: 0x708090,
})

async function buildMapLayer(scene, layerName, fileName) {

  console.log(`\tbuilding layer: ${fileName}`)

  const parentGroup = new THREE.Group()
  parentGroup.userData.name = layerName

  const geoJson = await fetchData(fileName)

  if (geoJson?.features === undefined || geoJson.features.length === 0) {
    console.warn("\t\tNo features found in geojson file: ", fileName)
    return parentGroup
  }

  let material
  switch (geoJson.name) {
    case LAYER_AIRSPACE_CLASS_B:
      material = airspaceBLineMaterial
      break
    case LAYER_AIRSPACE_CLASS_C:
      material = airspaceCLineMaterial
      break
    case LAYER_AIRSPACE_CLASS_D:
      material = airspaceDLineMaterial
      break
    case LAYER_URBAN_AREAS:
      material = urbanAreasLineMaterial
      break
    case LAYER_ROADS:
      material = roadsLineMaterial
      break
    default:
      material = mapDefaultLineMaterial
      break
  }

  geoJson.features.forEach((feature) => {
    const childGroup = parseGeoJsonFeature(feature, material)

    childGroup.userData.type = geoJson.name

    switch (geoJson.name) {
      case LAYER_AERODROMES:
        childGroup.userData.id = feature.properties.icao ?? feature.properties.iata ?? feature.properties.faa ?? feature.properties.ref
        break

      case LAYER_AIRSPACE_CLASS_B:
      case LAYER_AIRSPACE_CLASS_C:
      case LAYER_AIRSPACE_CLASS_D:
        childGroup.userData.id = feature.properties.ICAO_ID ?? feature.properties.IDENT
        childGroup.userData.upper = feature.properties.UPPER_VAL
        childGroup.userData.lower = feature.properties.LOWER_VAL
        break
    }

    switch (geoJson.name) {
      case LAYER_AIRSPACE_CLASS_B:
        childGroup.position.set(0, 0, 0)
        break
      case LAYER_AIRSPACE_CLASS_C:
        childGroup.position.set(0, -1, 0)
        break
      case LAYER_AIRSPACE_CLASS_D:
        childGroup.position.set(0, -2, 0)
        break
    }

    parentGroup.add(childGroup)
  })

  return parentGroup
}

function parseGeoJsonFeature(feature, lineMaterial) {
  const group = new THREE.Group()

  if (feature.geometry.type === "MultiLineString") {
    feature.geometry.coordinates.forEach((coordinates) => {
      const points = coordinates.map((coord) => {
        let [x, y] = UTILS.getXY(coord).map(val => val * UTILS.DEFAULT_ZOOM)
        return new THREE.Vector3(x, 0, y)
      })

      const bufferGeometry = new THREE.BufferGeometry().setFromPoints(points)
      const line = new THREE.Line(bufferGeometry, lineMaterial)

      group.add(line)
    })
  }
  if (feature.geometry.type === "MultiPolygon") {
    feature.geometry.coordinates.forEach((coordinates) => {
      const points = coordinates[0].map((coord) => {
        let [x, y] = UTILS.getXY(coord).map(val => val * UTILS.DEFAULT_ZOOM)
        return new THREE.Vector3(x, 0, y)
      })

      const bufferGeometry = new THREE.BufferGeometry().setFromPoints(points)
      const line = new THREE.Line(bufferGeometry, lineMaterial)

      group.add(line)
    })
  }

  if (feature.geometry.type === "LineString") {
    const coordinates = feature.geometry.coordinates
    const points = coordinates.map((coord) => {
      let [x, y] = UTILS.getXY(coord).map(val => val * UTILS.DEFAULT_ZOOM)
      return new THREE.Vector3(x, 0, y)
    })

    const bufferGeometry = new THREE.BufferGeometry().setFromPoints(points)
    const line = new THREE.Line(bufferGeometry, lineMaterial)

    group.add(line)
  }
  if (feature.geometry.type === "Polygon") {
    const coordinates = feature.geometry.coordinates[0]
    const points = coordinates.map((coord) => {
      let [x, y] = UTILS.getXY(coord).map(val => val * UTILS.DEFAULT_ZOOM)
      return new THREE.Vector3(x, 0, y)
    })

    const bufferGeometry = new THREE.BufferGeometry().setFromPoints(points)
    const line = new THREE.Line(bufferGeometry, lineMaterial)

    group.add(line)
  }

  if (feature.geometry.type === "GeometryCollection") {
    feature.geometry.geometries.forEach((childGeometry) => {
      let coordinates = null
      switch (childGeometry.type) {
        case 'Polygon':
          coordinates = childGeometry.coordinates[0]
          break
        case 'LineString':
          coordinates = childGeometry.coordinates
          break
        default:
          console.warn("Unknown GeometryCollection Geometry type: ", childGeometry.type)
          break
      }

      if (coordinates) {
        const points = coordinates.map((coord) => {
          let [x, y] = UTILS.getXY(coord).map(val => val * UTILS.DEFAULT_ZOOM)
          return new THREE.Vector3(x, 0, y)
        })

        const bufferGeometry = new THREE.BufferGeometry().setFromPoints(points)
        const line = new THREE.Line(bufferGeometry, lineMaterial)

        group.add(line)
      }
    })
  }

  return group
}


async function getOriginsData() {
  console.log("MAPS: get origins data...")
  const ORIGINS_JSON = `${MAP_DATA_DIR}/origins.json`

  try {
    const json = await fetchData(ORIGINS_JSON)
    const data = []
    json.elements?.forEach((element) => {
      const id = element.tags?.icao
        ?? element.tags?.iata
        ?? element.tags?.faa
        ?? element.tags['faa:lid']
        ?? element.tags?.ref

      const center = element.center
      if (!id) {
        console.warn("\tNo ref attribute or ICAO/IATA/FAA compatible id found for use as origin id:\n\t", element)
        return
      }

      data.push({
        id: id,
        center: center,
      })

    })
    return data
  } catch (e) {
    console.error(`ERROR: Unable to fetch origins data: ${e}`)
    return []
  }
}

function buildOriginObject(name, lat, lon) {
  return {
    name: name,
    lat: lat,
    lon: lon,
  }
}

async function buildOrigins(originsData) {

  console.log("MAPS: build origins...")

  // set default origin
  console.log("\tBuilding default origin...")
  const defaultLat = import.meta.env.VITE_DEFAULT_ORIGIN_LATITUDE
  const defaultLon = import.meta.env.VITE_DEFAULT_ORIGIN_LONGITUDE

  if (isNaN(parseFloat(defaultLat)) || isNaN(parseFloat(defaultLon))) {
    console.error("ERROR: Default Origin Latitude and/or Longitude not set in .env file")
    return false
  }

  ORIGINS[DEFAULT_ORIGIN] = buildOriginObject(DEFAULT_ORIGIN, defaultLat, defaultLon)

  // build other origins  
  console.log("\tBuilding additional origins...")

  if (originsData.length === 0) {
    console.warn("\tWARNING: No origins found. Unable to build additional origins.")
  }

  originsData.forEach((origin) => {
    ORIGINS[origin.id] = buildOriginObject(
      origin.id,
      origin.center.lat,
      origin.center.lon
    )
  })

  return true
}

async function buildOriginLabelsLayer(scene, originsData) {
  const parentGroup = new THREE.Group()
  parentGroup.userData.type = LAYER_ORIGINS
  originsData.forEach((origin) => {
    const group = new THREE.Group()
    group.userData.id = origin.id
    group.userData.center = origin.center
    group.userData.type = LAYER_ORIGINS
    const [x, y] = UTILS.getXY([origin.center.lon, origin.center.lat])
    group.position.set(x * UTILS.DEFAULT_ZOOM, 0, y * UTILS.DEFAULT_ZOOM)

    const label = new Text()
    label.text = origin.id
    label.fontSize = AERODROME_LABEL_FONT_SIZE
    label.anchorX = 'center'
    label.color = new THREE.Color(TEXT_COLOR)
    label.font = TEXT_FONT
    label.position.x = 0.0
    label.position.y = AERODROME_LABEL_HEIGHT
    label.position.z = 0.0

    group.add(label)
    parentGroup.add(group)
  })

  return parentGroup
}

async function fetchData(src) {
  try {
    const response = await fetch(src)
    return await response.json()
  } catch (e) {
    console.error(`Error while fetching data source\n\n\t${src}\n\n\t${e}`)
    return {}
  }
}

