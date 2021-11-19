import * as THREE from 'three'
import { Text } from 'troika-three-text'
import { HUD } from './HUD.js'
import * as UTILS from './utils.js'
import * as ADSB from './ADSB.js'

export const aircrafts = {}

export const aircraftPhotos = {}

const airCraftGeometry = new THREE.BufferGeometry()
airCraftGeometry.setFromPoints([
  // top
  new THREE.Vector3(0, 0, -3), // a
  new THREE.Vector3(-1.5, 1, 1), // b
  new THREE.Vector3(1.5, 1, 1), // c

  // back
  new THREE.Vector3(0, -1, 1), // d
  new THREE.Vector3(1.5, 1, 1), // b
  new THREE.Vector3(-1.5, 1, 1), // c

  // left
  new THREE.Vector3(0, -1, 1), // d
  new THREE.Vector3(-1.5, 1, 1), // c
  new THREE.Vector3(0, 0, -3), // a

  // right
  new THREE.Vector3(0, -1, 1), // d
  new THREE.Vector3(0, 0, -3), // a
  new THREE.Vector3(1.5, 1, 1), // c
])
airCraftGeometry.computeVertexNormals()

export const airCraftSelectedColor = new THREE.Color(0xff0000)
export const airCraftColor = new THREE.Color(0x00ff00)

const airCraftMaterial = new THREE.MeshLambertMaterial({
  color: airCraftColor,
})
const airCraftHeightLineMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff })






export class Aircraft {
  constructor(scene) {
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
        [new THREE.Vector3(0, 0, -3.25)]
      ),
      UTILS.refPointMaterial
    )
    this.mesh.add(this.refPoint)

    this.group.add(this.mesh)

    scene.add(this.group)
  }

  clear(scene) {
    console.log(`*** CLEAR -- ${this.hex} | ${this.callsign}`)
    scene.remove(this.text)
    this.text.dispose()
    scene.remove(this.group)
  }

  update(data) {
    if (data[ADSB.CALLSIGN] !== "") {
      this.callsign = data[ADSB.CALLSIGN]
    }

    if (data[ADSB.ALTITUDE] !== "") {
      this.alt = Number(data[ADSB.ALTITUDE])
      this.pos.y = this.alt
    }

    if (data[ADSB.LATITUDE] !== "") {
      this.pos.lat = Number(data[ADSB.LATITUDE])
    }

    if (data[ADSB.LONGITUDE] !== "") {
      this.pos.lng = Number(data[ADSB.LONGITUDE])
    }

    if (data[ADSB.SQUAWK] !== "") {
      this.sqwk = data[ADSB.SQUAWK]
    }

    if (data[ADSB.IS_ON_GROUND] !== "") {
      this.isOnGround = data[ADSB.IS_ON_GROUND]
    }

    if (data[ADSB.TRACK] !== "") {
      this.hdg = data[ADSB.TRACK]
      this.mesh.rotation.y = THREE.MathUtils.degToRad(-this.hdg)
    }
    if (data[ADSB.GORUND_SPEED] !== "") {
      this.spd = data[ADSB.GORUND_SPEED]
    }

    if (this.hasValidTelemetry()) {

      if (!this.mesh.visible) {
        this.mesh.visible = true
      }

      this.bearing = UTILS.calcBearing(UTILS.origin, this.pos)
      this.distance = UTILS.calcSphericalDistance(UTILS.origin, this.pos)

      this.pos.x = this.distance * Math.cos(THREE.MathUtils.degToRad(90 - this.bearing))
      this.pos.z = -this.distance * Math.sin(THREE.MathUtils.degToRad(90 - this.bearing))

      // position is in world coordinates
      const xPos = this.pos.x * UTILS.SCALE
      const yPos = this.pos.y * UTILS.SCALE
      const zPos = this.pos.z * UTILS.SCALE
      this.mesh.position.set(xPos, yPos, zPos)
      this.heightLinePos.setY(1, -yPos)
      this.heightLinePos.needsUpdate = true

      this.text.text = `${this.callsign || '-'}\n${this.hex}\n${this.hdg || '-'}\n${this.spd || '-'}\n${this.alt || '-'}`
      this.text.position.set(xPos, yPos, zPos)
      this.text.sync()

      if (this.hex === UTILS.INTERSECTED.key) {
        UTILS._HUD.updateTelemetry(this)
      }
    }

    this.ttl = 10
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

  updateText(position) {
    this.text.lookAt(position)
  }

  hasValidTelemetry() {
    return (typeof this.pos.y !== 'undefined')
      && (typeof this.pos.lat !== 'undefined')
      && (typeof this.pos.lng !== 'undefined')
  }

  fetchInfo() {
    this._fetchPhoto()
    this._fetchFlightInfoEx()
  }

  _fetchPhoto() {

    console.log('~~~~ FETCH PHOTO ~~~~')

    if (this.hex === undefined) {
      console.log('aircraft not yet identified!')
      return
    }

    if (this.photoFuture !== null) {
      if (this.photo !== undefined) {
        UTILS._HUD.showPhoto(this)
      } else {
        const aircraftTypeKey = this.getAircraftTypeKey()
        if (aircraftTypeKey !== null && aircraftTypeKey in aircraftPhotos) {
          this.photo = aircraftPhotos[aircraftTypeKey]
          UTILS._HUD.showPhoto(this)
        }
      }
      return
    }

    const photoUrl = `${UTILS.DATA_HOSTS["photos"]}/${this.hex}`
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
            UTILS._HUD.showPhoto(this)
          }
        }
        if (this.photo === undefined) {
          const aircraftTypeKey = this.getAircraftTypeKey()
          if (aircraftTypeKey !== null && aircraftTypeKey in aircraftPhotos) {
            this.photo = aircraftPhotos[aircraftTypeKey]
            UTILS._HUD.showPhoto(this)
          } else {
            UTILS._HUD.clearPhoto()
          }
        }
      })
  }

  _fetchFlightInfoEx() {

    console.log("~~~ FETCH FLIGHT INFO ~~~")

    if (this.callsign === undefined) {
      console.log("aircraft has no callsign yet!")
      return
    }

    if (this.flightInfoFuture != null) {
      UTILS._HUD.showAircraftInfo(this)
      return
    }

    const url = `${UTILS.DATA_HOSTS["flightinfo"]}/${this.callsign}`
    this.flightInfoFuture = fetch(url)
      .then(response => response.json())
      .then(data => {
        this.flightInfo = data
        const aircraftTypeKey = this.getAircraftTypeKey()
        const hasPhoto = aircraftTypeKey in aircraftPhotos
        if (!hasPhoto && aircraftTypeKey !== undefined && this.photo !== undefined) {
          aircraftPhotos[aircraftTypeKey] = this.photo
        }
        UTILS._HUD.showAircraftInfo(this)
      })
  }

  _log() {
    console.log("================")
    console.log(`hex: ${this.hex} | sqwk: ${this.sqwk} | cs: ${this.callsign} | alt: ${this.alt} | spd: ${this.spd} | hdg: ${this.hdg} | lat: ${this.pos.lat} | lng: ${this.pos.lng} | brng: ${this.bearing} | dist: ${this.distance}`)
    console.log(this.pos)
    console.log("################")
  }
}
