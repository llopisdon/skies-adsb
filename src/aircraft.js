import * as THREE from 'three'
import { Text } from 'troika-three-text'
import * as UTILS from './utils.js'
import * as ADSB from './ADSB.js'

export const aircrafts = {}

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
//export const airCraftColor = new THREE.Color(0xffba2f)
//export const airCraftColor = new THREE.Color(0x25C9AE)
export const airCraftColor = new THREE.Color(0x00ff00)

const airCraftMaterial = new THREE.MeshLambertMaterial({
  color: airCraftColor,
  // wireframe: true,
  // wireframeLinewidth: 2
})
const airCraftHeightLineMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff })

const blackColor = new THREE.Color(0x444444)
const whiteColor = new THREE.Color(0xffffff)

const redNavigationLightMaterial = new THREE.PointsMaterial({ size: 0.5, color: 0xff0000 })
const greenNavigationLightMaterial = new THREE.PointsMaterial({ size: 0.5, color: 0x00ff00 })

const AIRCRAFT_TTL = 10.0


export class Aircraft {
  constructor(scene) {
    this.hex = null
    this.sqwk = null
    this.flight = null
    this.alt = null
    this.spd = null
    this.hdg = null
    this.pos = {
      x: null,
      y: null,
      z: null,
      lat: null,
      lng: null,
    }
    this.rssi = 0.0
    this.msgs = 0
    this.is_on_ground = false
    this.bearing = 0
    this.distance = 0.0
    this.timestamp = 0

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

    // follow camera
    this.followCam = new THREE.Object3D()
    this.followCam.position.set(0, 4, 6)
    this.mesh.add(this.followCam)

    // lights
    this.redNavigationLight = new THREE.Points(
      new THREE.BufferGeometry().setFromPoints(
        [new THREE.Vector3(-1.75, 1, 1.05)]
      ),
      redNavigationLightMaterial
    )
    this.mesh.add(this.redNavigationLight)

    this.greenNavigationLight = new THREE.Points(
      new THREE.BufferGeometry().setFromPoints(
        [new THREE.Vector3(1.75, 1, 1.05)]
      ),
      greenNavigationLightMaterial
    )
    this.mesh.add(this.greenNavigationLight)

    this.strobeLight = new THREE.Points(
      new THREE.BufferGeometry().setFromPoints(
        [new THREE.Vector3(0, -1.25, 1)]
      ),
      new THREE.PointsMaterial({ size: 0.5, color: blackColor })
    )
    this.mesh.add(this.strobeLight)

    this.strobeLightTop = new THREE.Points(
      new THREE.BufferGeometry().setFromPoints(
        [new THREE.Vector3(0, 1.25, 1)]
      ),
      new THREE.PointsMaterial({ size: 0.5, color: blackColor })
    )
    this.mesh.add(this.strobeLightTop)


    this.group.add(this.mesh)

    scene.add(this.group)
  }

  remove(scene) {
    console.log(`*** CLEAR -- ${this.hex} | ${this.callsign}`)
    scene.remove(this.text)
    this.text.dispose()
    scene.remove(this.group)
    delete aircrafts[this.hex]
  }

  update(data, elapsedTime) {
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

      this.heightLinePos.setY(1, -yPos)
      this.heightLinePos.needsUpdate = true

      const heading = (this?.hdg) ? this.hdg + '°' : '-'
      const groundSpeed = (this?.hdg) ? this.spd + ' kt' : '-'
      const altitude = (this?.alt) ? this.alt + "'" : '-'

      this.text.text = `${this.callsign || '-'}\n${this.hex}\n${heading}\n${groundSpeed}\n${altitude}`
      this.text.sync()

      this.group.position.set(xPos, yPos, zPos)
    }

    // after each update reset timestamp
    this.timestamp = elapsedTime
  }

  draw(scene, elapsedTime, cameraPosition) {
    this.updateText(cameraPosition)

    // animate strobe light
    const alpha = Math.sin(elapsedTime * 6.0) * 0.5 + 0.5
    this.strobeLight.material.color.copy(blackColor).lerp(whiteColor, alpha)
    this.strobeLight.material.needsUpdate = true
    this.strobeLightTop.material.color.copy(blackColor).lerp(whiteColor, alpha)
    this.strobeLightTop.material.needsUpdate = true

    const ttl = elapsedTime - this.timestamp

    return ttl > AIRCRAFT_TTL
  }

  getAircraftTypeKey() {
    if (!this?.flightInfo) return
    const aircraftType = this?.flightInfo?.['type']
    const aircraftManufacturer = this?.flightInfo?.['manufacturer']
    if (aircraftType && aircraftManufacturer) {
      return `${aircraftManufacturer}#${aircraftType}`
    } else {
      return undefined
    }
  }

  updateText(position) {
    this.text.lookAt(position)
  }

  hasValidTelemetry() {
    return this.pos?.y && this.pos?.lat && this.pos?.lng
  }

  _log() {
    console.log("================")
    console.log(`hex: ${this.hex} | sqwk: ${this.sqwk} | cs: ${this.callsign} | alt: ${this.alt} | spd: ${this.spd} | hdg: ${this.hdg} | lat: ${this.pos.lat} | lng: ${this.pos.lng} | brng: ${this.bearing} | dist: ${this.distance}`)
    console.log(this.pos)
    console.log("################")
  }
}
