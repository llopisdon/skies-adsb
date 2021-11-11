import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Stats from 'stats.js'
import { Text } from 'troika-three-text'
import * as MAPS from './maps.js'

const sofla_map = {}
const poiVertices = []
const poiLabels = []

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

const origin = {
  lat: 0,
  lng: 0
}

let simulationPaused = false

const pointer = new THREE.Vector2()
pointer.x = undefined
pointer.y = undefined
let pointerDown = false
const raycaster = new THREE.Raycaster()

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 10000)
camera.position.z = 10
scene.add(camera)


// renderer
const canvas = document.querySelector('canvas.webgl')
const renderer = new THREE.WebGLRenderer({
  canvas: canvas
})
renderer.setSize(window.innerWidth, window.innerHeight)

// stats
const stats = new Stats()
stats.showPanel(0)
document.body.appendChild(stats.dom)


//
// aircraft info HTML HUD
//

const HUD = {
  container: document.getElementById('hud'),
  photo: document.getElementById('photo'),
  photographer: document.getElementById('photographer'),
  callsign: document.getElementById('callsign'),
  airline: document.getElementById('airline'),
  aircraftType: document.getElementById('aircraftType'),
  origin: document.getElementById('origin'),
  destination: document.getElementById('destination'),
  heading: document.getElementById('heading'),
  groundSpeed: document.getElementById('groundSpeed'),
  altitude: document.getElementById('altitude'),
}

//console.log(HUD)


// controls
const controls = new OrbitControls(camera, renderer.domElement)


const airCraftGeometry = new THREE.BufferGeometry()
const airCraftVertices = new Float32Array([
  0, 0, -3,
  1.5, 0, 1,
  -1.5, 0, 1
])
airCraftGeometry.setAttribute('position', new THREE.BufferAttribute(airCraftVertices, 3))
const airCraftSelectedColor = new THREE.Color(0xff0000)
const airCraftColor = new THREE.Color(0x00ff00)
const airCraftMaterial = new THREE.MeshBasicMaterial({ color: airCraftColor, side: THREE.DoubleSide })
const airCraftHeightLineMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff })


const refPointMaterial = new THREE.PointsMaterial({ size: 0.5, color: 0xff00ff })

// axes helper
const axesHelper = new THREE.AxesHelper()
scene.add(axesHelper)



//
// dump1090 ADB-S protocol 
//

const MSG_TYPE = 0
const TRAMISSION_TYPE = 1
const AIRCRAFT_ID = 3
const HEX_IDENT = 4
const FLIGHT_ID = 5
const CALLSIGN = 10
const ALTITUDE = 11
const GORUND_SPEED = 12
const TRACK = 13
const LATITUDE = 14
const LONGITUDE = 15
const SQUAWK = 17
const IS_ON_GROUND = 21

//
// ADB-S sends back data in meters and all of the distance,
// heading, and bearing calculations are in meters
// for display purposes. For right now the scale
// of 1 unit for ever 50 meters seems to look good. 
//
const SCALE = 1.0 / 300.0

// MIA: 25.799740325918425, -80.28758238380416

const NOT_AVAILABLE = 'n/a'

const aircrafts = {}

const aircraftPhotos = {}


class Aircraft {
  constructor() {
    this.hex = undefined
    this.sqwk = undefined
    this.flight = undefined
    this.alt = undefined
    this.spd = undefined
    this.hdg = undefined
    this.pos = {
      x: undefined,
      y: undefined,
      z: undefined,
      lat: undefined,
      lng: undefined,
    }
    this.rssi = 0.0
    this.msgs = 0
    this.is_on_ground = false
    this.bearing = 0
    this.distance = 0.0
    this.ttl = 0

    this.photoFuture = null
    this.photo == null

    this.flightInfoFuture = null
    this.flightInfo = null


    // aircraft group
    this.group = new THREE.Group()

    // aircraft mesh
    this.mesh = new THREE.Mesh(airCraftGeometry, airCraftMaterial.clone())
    this.mesh.visible = false

    // aircraft height line
    this.heightLineGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0)
    ])
    this.heightLineGeometry.attributes.position.usage = THREE.DynamicDrawUsage
    this.heightLinePos = this.heightLineGeometry.attributes.position
    this.heightLineMesh = new THREE.Line(this.heightLineGeometry, airCraftHeightLineMaterial)
    this.mesh.add(this.heightLineMesh)

    // aircraft messages text
    this.text = new Text()
    this.text.text = ""
    this.text.fontSize = 1
    this.text.anchorX = -1.5
    this.text.anchorY = 1
    this.text.color = 0xED225D
    this.text.font = "./static/Orbitron-VariableFont_wght.ttf"
    this.group.add(this.text)

    // aircraft ref point
    this.refPoint = new THREE.Points(
      new THREE.BufferGeometry().setFromPoints(
        [new THREE.Vector3(0, 0.2, -1.75)]
      ),
      refPointMaterial
    )
    this.mesh.add(this.refPoint)

    this.group.add(this.mesh)

    scene.add(this.group)
  }

  clear() {
    console.log(`*** CLEAR -- ${this.hex} | ${this.callsign}`)
    scene.remove(this.text)
    this.text.dispose()
    scene.remove(this.group)
  }

  update(data) {
    if (data[CALLSIGN] !== "") {
      this.callsign = data[CALLSIGN]
    }

    if (data[ALTITUDE] !== "") {
      this.alt = Number(data[ALTITUDE])
      this.pos.y = this.alt
    }

    if (data[LATITUDE] !== "") {
      this.pos.lat = Number(data[LATITUDE])
    }

    if (data[LONGITUDE] !== "") {
      this.pos.lng = Number(data[LONGITUDE])
    }

    if (data[SQUAWK] !== "") {
      this.sqwk = data[SQUAWK]
    }

    if (data[IS_ON_GROUND] !== "") {
      this.isOnGround = data[IS_ON_GROUND]
    }

    if (data[TRACK] !== "") {
      this.hdg = data[TRACK]
      this.mesh.rotation.y = THREE.MathUtils.degToRad(-this.hdg)
    }
    if (data[GORUND_SPEED] !== "") {
      this.spd = data[GORUND_SPEED]
    }

    if (this.hasValidTelemetry()) {

      if (!this.mesh.visible) {
        this.mesh.visible = true
      }
      this.bearing = calcBearing(origin, this.pos)
      this.distance = calcSphericalDistance(origin, this.pos)

      this.pos.x = this.distance * Math.cos(THREE.MathUtils.degToRad(90 - this.bearing))
      this.pos.z = -this.distance * Math.sin(THREE.MathUtils.degToRad(90 - this.bearing))

      // position is in world coordinates
      const xPos = this.pos.x * SCALE
      const yPos = this.pos.y * SCALE
      const zPos = this.pos.z * SCALE
      this.mesh.position.set(xPos, yPos, zPos)
      this.heightLinePos.setY(1, -yPos)
      this.heightLinePos.needsUpdate = true

      this.text.text = `${this.callsign || '-'}\n${this.hex}\n${this.hdg || '-'}\n${this.spd || '-'}\n${this.alt || '-'}`
      this.text.position.set(xPos, yPos, zPos)
      this.text.sync()

    } else {
      //this.log()
    }

    this.ttl = 10

    if (this.hex === INTERSECTED.key) {
      HUD.heading.innerText = `Heading: ${this.hdg || NOT_AVAILABLE}`
      HUD.groundSpeed.innerText = `Ground Speed: ${this.spd || NOT_AVAILABLE}`
      HUD.altitude.innerText = `Altitude: ${this.alt || NOT_AVAILABLE}`
    }
  }

  fetchInfoAndShow() {
    this.fetchPhoto()
    this.fetchFlightInfoEx()
  }

  fetchPhoto() {

    console.log('~~~~ FETCH PHOTO ~~~~')

    this.clearPhoto()

    if (this.hex === undefined) {
      console.log('aircraft not yet identified!')
      return
    }

    if (this.photoFuture !== null) {
      if (this.photo !== undefined) {
        this.showPhoto()
      } else {
        const aircraftTypeKey = this.getAircraftTypeKey()
        if (aircraftTypeKey !== null && aircraftTypeKey in aircraftPhotos) {
          this.photo = aircraftPhotos[aircraftTypeKey]
          this.showPhoto()
        }
      }
      return
    }

    const photoUrl = `https://api.planespotters.net/pub/photos/hex/${this.hex}`
    console.log(`fetchPhoto -> ${photoUrl}`)
    this.photoFuture = fetch(photoUrl)
      .then(response => response.json())
      .then(data => {
        console.log(data)
        if (Array.isArray(data['photos']) && data['photos'].length > 0) {
          const photo = data['photos'][0]
          if ('thumbnail' in photo) {
            this.photo = photo
            console.log(this.photo)
            this.showPhoto()
          }
        }
        if (this.photo === undefined) {
          const aircraftTypeKey = this.getAircraftTypeKey()
          if (aircraftTypeKey !== null && aircraftTypeKey in aircraftPhotos) {
            this.photo = aircraftPhotos[aircraftTypeKey]
            this.showPhoto()
          } else {
            this.clearPhoto()
          }
        }
      })
  }

  clearPhoto() {
    HUD.photo.src = '#'
    HUD.photo.style.display = 'none'
    HUD.photographer.innerText = ''
  }

  showPhoto() {
    HUD.photo.src = this.photo['thumbnail']['src']
    HUD.photo.style.display = 'inline'
    HUD.photographer.innerText = this.photo['photographer'] || ''
  }

  fetchFlightInfoEx() {

    console.log("~~~ FETCH FLIGHT INFO ~~~")
    this.clearFlightInfo()

    if (this.callsign === undefined) {
      console.log("aircraft has no callsign yet!")
      return
    }

    if (this.flightInfoFuture != null) {
      this.showFlightInfo()
      return
    }

    const url = `http://${self.location.host.split(':')[0]}:5000/flight/${this.callsign}`
    this.flightInfoFuture = fetch(url)
      .then(response => response.json())
      .then(data => {
        this.flightInfo = data
        const aircraftTypeKey = this.getAircraftTypeKey()
        const hasPhoto = aircraftTypeKey in aircraftPhotos
        if (!hasPhoto && aircraftTypeKey !== undefined && this.photo !== undefined) {
          aircraftPhotos[aircraftTypeKey] = this.photo
        }
        this.showFlightInfo()
      })
  }


  getAircraftTypeKey() {
    if (this.flightInfo == null || this.flightInfo === undefined) return
    const aircraftType = ('type' in this.flightInfo) ? this.flightInfo['type'] : undefined
    const aircraftManufacturer = ('manufacturer' in this.flightInfo) ? this.flightInfo['manufacturer'] : undefined
    if (aircraftType !== undefined && aircraftManufacturer !== undefined) {
      return `${aircraftManufacturer}#${aircraftType}`
    } else {
      return undefined
    }
  }


  clearFlightInfo() {
    HUD.callsign.innerText = NOT_AVAILABLE
    HUD.airline.innerText = NOT_AVAILABLE
    HUD.aircraftType.innerText = NOT_AVAILABLE
    HUD.origin.innerText = `Origin: ${NOT_AVAILABLE}`
    HUD.destination.innerText = `Dest: ${NOT_AVAILABLE}`
    HUD.heading.innerText = NOT_AVAILABLE
    HUD.groundSpeed.innerText = NOT_AVAILABLE
    HUD.altitude.innerText = NOT_AVAILABLE
  }

  showFlightInfo() {
    console.log(this.flightInfo)
    HUD.callsign.innerText = `${this.flightInfo['ident'] || NOT_AVAILABLE}`
    HUD.airline.innerText = `${this.flightInfo['airlineCallsign'] || NOT_AVAILABLE} | ${this.flightInfo['airline'] || NOT_AVAILABLE}`
    HUD.aircraftType.innerText = `${this.flightInfo['type'] || NOT_AVAILABLE} | ${this.flightInfo['manufacturer'] || NOT_AVAILABLE}`
    HUD.origin.innerText = `Origin: ${this.flightInfo['origin'] || NOT_AVAILABLE}, ${this.flightInfo['originName'] || NOT_AVAILABLE}`
    HUD.destination.innerText = `Dest: ${this.flightInfo['destination'] || NOT_AVAILABLE}, ${this.flightInfo['destinationName'] || NOT_AVAILABLE}`
  }

  updateText() {
    this.text.lookAt(camera.position)
  }

  hasValidTelemetry() {
    return (typeof this.pos.y !== 'undefined')
      && (typeof this.pos.lat !== 'undefined')
      && (typeof this.pos.lng !== 'undefined')
  }

  log() {
    console.log("================")
    console.log(`hex: ${this.hex} | sqwk: ${this.sqwk} | cs: ${this.callsign} | alt: ${this.alt} | spd: ${this.spd} | hdg: ${this.hdg} | lat: ${this.pos.lat} | lng: ${this.pos.lng} | brng: ${this.bearing} | dist: ${this.distance}`)
    console.log(this.pos)
    console.log("################")
  }
}

navigator.geolocation.getCurrentPosition((pos) => {

  console.log(`ORIGIN lat: ${pos.coords.latitude} lng: ${pos.coords.longitude}`)

  origin.lat = pos.coords.latitude
  origin.lng = pos.coords.longitude

  initGroundPlaneBoundariesAndPOI()

}, (error) => {
  console.log("UNABLE TO GET GEOLOCATION | REASON -> " + error.message)
  origin.lat = MAPS.mia_poi['HOME'][0]
  origin.lng = MAPS.mia_poi['HOME'][1]
  console.log(`fallback location - HOME: ${MAPS.mia_poi['HOME']}`)

  initGroundPlaneBoundariesAndPOI()
})

function initGroundPlaneBoundariesAndPOI() {
  // TODO start websocket connection once geolocation has been updated
  // TODO update geometries once geolocation has been updated

  // const { x, y } = getXY(origin, { latitude: 25.799740325918425, longitude: -80.28758238380416 })
  // console.log(`mia: ${x} ${y}`)

  for (const key in MAPS.sofla_zones) {
    console.log(`loading ground plane for: ${key}`);
    const zone = MAPS.sofla_zones[key]
    sofla_map[key] = []
    let points = []
    for (let i = 0; i < zone.length; i += 2) {
      const { x, y } = getXY(origin, { lat: zone[i], lng: zone[i + 1] })
      points.push(new THREE.Vector2(x * SCALE, y * SCALE))
    }

    let shape = new THREE.Shape(points)
    let geometry = new THREE.ShapeGeometry(shape)
    geometry.rotateX(Math.PI / 2)
    let edges = new THREE.EdgesGeometry(geometry)
    let lineSegments = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({
      color: new THREE.Color('#81efff'),
      linewidth: 2
    }))
    scene.add(lineSegments)
  }


  // fill('#ED225D');
  // points of interest (poi)

  for (const key in MAPS.mia_poi) {
    const ref_pt = MAPS.mia_poi[key]
    console.log(`${key} -> ${ref_pt}`)
    const { x, y } = getXY(origin, { lat: ref_pt[0], lng: ref_pt[1] })
    poiVertices.push(new THREE.Vector3(x * SCALE, 0, y * SCALE))

    const label = new Text()
    label.text = key
    label.fontSize = 1
    label.anchorX = 'center'
    label.color = 0xED225D
    label.font = "./static/Orbitron-VariableFont_wght.ttf"

    label.position.x = x * SCALE
    label.position.y = 2
    label.position.z = y * SCALE

    poiLabels.push(label)
    scene.add(label)
  }
  const poiGeometry = new THREE.BufferGeometry().setFromPoints(poiVertices)

  const poiMesh = new THREE.Points(poiGeometry, refPointMaterial)
  scene.add(poiMesh)
}


//const s = new WebSocket('wss://raspberrypi.local:30006');
const s = new WebSocket('ws://192.168.86.34:30006')
//const s = new WebSocket('wss://' + self.location.host + ':30006')
s.addEventListener('message', (event) => {

  if (simulationPaused) {
    return
  }

  const reader = new FileReader()
  reader.onload = () => {
    const result = reader.result

    // parse SBS data here...

    let data = result.split(",")
    let hexIdent = data[HEX_IDENT]

    if (!(hexIdent in aircrafts)) {
      const aircraft = new Aircraft()
      aircraft.hex = hexIdent
      aircrafts[hexIdent] = aircraft
    }

    aircrafts[hexIdent].update(data)

    //aircrafts[hexIdent].log()
  }
  reader.readAsText(event.data)
});


let INTERSECTED = {
  key: null,
  mesh: null
}

function draw(deltaTime) {

  raycaster.setFromCamera(pointer, camera)

  let clearIntersected = INTERSECTED !== null

  //
  // aircraft
  //

  for (const key in aircrafts) {

    const ac = aircrafts[key];
    ac.updateText()

    if (pointer.x !== undefined && pointer.y !== undefined) {

      const groupIntersect = raycaster.intersectObject(ac.group, true)

      if (groupIntersect.length > 0) {

        console.log("---------------")
        console.log(groupIntersect)
        console.log("---------------")
        pointer.x = undefined
        pointer.y = undefined

        if (key !== INTERSECTED.key) {

          if (INTERSECTED.key !== null) {
            INTERSECTED.mesh.material.color = airCraftColor
          }

          INTERSECTED.key = key
          INTERSECTED.mesh = ac.mesh
          INTERSECTED.mesh.material.color = airCraftSelectedColor

          ac.fetchInfoAndShow()

          HUD.container.className = "aircraftInfo-flex-container"

          console.log(INTERSECTED)
        }
      }
    }

    ac.ttl -= 100 * deltaTime
    if (ac.ttl < 0) {
      ac.clear()
      delete aircrafts[key]
    }
  }

  for (const poiLabel of poiLabels) {
    poiLabel.lookAt(camera.position)
  }

  if (pointer.x !== undefined && pointer.y !== undefined) {
    if (INTERSECTED.key !== null) {
      INTERSECTED.mesh.material.color = airCraftColor
      INTERSECTED.key = null
      INTERSECTED.mesh = null
      HUD.container.className = 'hidden'
    }
    pointer.x = undefined
    pointer.y = undefined
  }
}



//
// haversine/spherical distance and bearing calculations
// source: https://www.movable-type.co.uk/scripts/latlong.html
//

function calcHaversineDistance(from, to) {
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

function calcSphericalDistance(from, to) {
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

function calcBearing(from, to) {
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

function getXY(from, to) {
  const bearing = calcBearing(from, to)
  const d = calcSphericalDistance(from, to)

  const x = d * Math.cos(THREE.MathUtils.degToRad(90 - bearing))
  const y = -d * Math.sin(THREE.MathUtils.degToRad(90 - bearing))

  return { x: x, y: y }
}


// window resize event listeners
window.addEventListener('resize', () => {
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight
  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

// single click listener to check for airplane intersections
window.addEventListener('click', (event) => {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;
  pointerDown = true
  console.log(pointer, event)
})

// fullscreen toggle on double click event listener
window.addEventListener('dblclick', () => {
  const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement

  if (!fullscreenElement) {
    if (document.body.requestFullscreen) {
      document.body.requestFullscreen()
    }
    else if (document.body.webkitRequestFullscreen) {
      document.body.webkitRequestFullscreen()
    }
  }
  else {
    if (document.exitFullscreen) {
      document.exitFullscreen()
    }
    else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen()
    }
  }
})

// handle page visibility
// https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API

function handleVisibilityChange() {
  if (document.visibilityState === "hidden") {
    console.log("pause simulation...")
    simulationPaused = true
  } else {
    console.log("start simulation...")
    simulationPaused = false
  }
}

document.addEventListener("visibilitychange", handleVisibilityChange, false);



//
// tick
//

// Clock
let clock = new THREE.Clock()

const tick = function () {
  stats.begin()

  const elapsedTime = clock.getElapsedTime()

  requestAnimationFrame(tick)

  controls.update()

  draw(clock.getDelta())

  renderer.render(scene, camera)

  stats.end()
}

tick()