import * as THREE from 'three'
import { Text } from 'troika-three-text'
import * as UTILS from './utils.js'
import * as ADSB from './ADSB.js'

export const aircraft = {}

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

const aircraftMaterial = new THREE.MeshLambertMaterial({ color: airCraftColor })
const aircraftHeightLineMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff })
const aircraftTrailMaterial = new THREE.LineBasicMaterial({ color: 0xffff00 })

const blackColor = new THREE.Color(0x444444)
const whiteColor = new THREE.Color(0xffffff)

const redNavigationLightMaterial = new THREE.PointsMaterial({ size: 0.5, color: 0xff0000 })
const greenNavigationLightMaterial = new THREE.PointsMaterial({ size: 0.5, color: 0x00ff00 })


export class Aircraft {
  constructor(scene, hexIdent) {
    this.hex = hexIdent
    this.squawk = null
    this.flight = null
    this.alt = null
    this.spd = null
    this.hdg = null
    this.pos = {
      x: null,
      y: null,
      z: null,
      lngLat: [null, null]
    }
    this.rssi = 0.0
    this.msgs = 0
    this.is_on_ground = false
    this.timestamp = 0

    this.photoFuture = null
    this.photo == null

    this.flightInfoFuture = null
    this.flightInfo = null

    // aircraft group
    this.group = new THREE.Group()

    // aircraft mesh
    this.mesh = new THREE.Mesh(airCraftGeometry, aircraftMaterial.clone())
    this.mesh.name = "aircraft_mesh"
    this.mesh.visible = false

    // aircraft height line
    this.heightLineGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0)
    ])
    this.heightLineGeometry.attributes.position.usage = THREE.DynamicDrawUsage
    this.heightLinePos = this.heightLineGeometry.attributes.position
    this.heightLineMesh = new THREE.Line(this.heightLineGeometry, aircraftHeightLineMaterial)
    this.heightLineMesh.name = "height_line"
    this.mesh.add(this.heightLineMesh)

    // aircraft messages text
    this.text = new Text()
    this.text.text = ""
    this.text.fontSize = 1
    this.text.anchorX = -1.5
    this.text.anchorY = 1
    this.text.color = 0xED225D
    this.text.font = "./static/Orbitron-VariableFont_wght.ttf"
    this.text.name = "aircraft_text"
    this.group.add(this.text)

    // follow camera
    this.followCam = new THREE.Object3D()
    this.followCam.name = "follow_cam"
    this.followCam.position.set(0, 6, UTILS.FOLLOW_CAM_DISTANCE)
    this.followCam.userData = {
      touchStartX: 0,
      touchStartY: 0,
      rotationVelocity: 0,
      sphericalCoords: new THREE.Spherical(UTILS.FOLLOW_CAM_DISTANCE, Math.PI / 2, 0),
    }
    this.mesh.add(this.followCam)

    // lights
    this.redNavigationLight = new THREE.Points(
      new THREE.BufferGeometry().setFromPoints(
        [new THREE.Vector3(-1.75, 1, 1.05)]
      ),
      redNavigationLightMaterial
    )
    this.redNavigationLight.name = "red_nav_light"
    this.mesh.add(this.redNavigationLight)

    this.greenNavigationLight = new THREE.Points(
      new THREE.BufferGeometry().setFromPoints(
        [new THREE.Vector3(1.75, 1, 1.05)]
      ),
      greenNavigationLightMaterial
    )
    this.greenNavigationLight.name = "green_nav_light"
    this.mesh.add(this.greenNavigationLight)

    this.strobeLight = new THREE.Points(
      new THREE.BufferGeometry().setFromPoints(
        [new THREE.Vector3(0, -1.25, 1)]
      ),
      new THREE.PointsMaterial({ size: 0.5, color: blackColor })
    )
    this.strobeLight.name = "strobe_light"
    this.mesh.add(this.strobeLight)

    this.strobeLightTop = new THREE.Points(
      new THREE.BufferGeometry().setFromPoints(
        [new THREE.Vector3(0, 1.25, 1)]
      ),
      new THREE.PointsMaterial({ size: 0.5, color: blackColor })
    )
    this.strobeLightTop.name = "strobe_light_top"
    this.mesh.add(this.strobeLightTop)

    this.group.add(this.mesh)

    scene.add(this.group)

    //
    // setup aircraft trails
    //
    // note: aircraft trails are placed into the scene as a separate objects from the aircraft group
    //

    // set up trail
    this.curTrailLength = 0
    this.lastTrailUpdate = 0
    this.maxTrailPoints = UTILS.AIRCRAFT_MAX_TRAIL_POINTS
    this.trailGeometry = new THREE.BufferGeometry()
    this.trailPositions = new Float32Array(this.maxTrailPoints * 3)
    this.trailGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(this.trailPositions, 3).setUsage(THREE.DynamicDrawUsage)
    )
    this.trailLine = new THREE.Line(this.trailGeometry, aircraftTrailMaterial)
    this.trailLine.name = "trail_line"
    this.trailLine.userData.hexIdex = hexIdent
    this.trailLine.frustumCulled = false
    scene.add(this.trailLine)

    // this line is used to join the aircraft to the trail so there are never any gaps
    // this can happen when the sample rate is reduced and the aircraft moves a large distance
    this.trailHeadGeometry = new THREE.BufferGeometry()
    this.trailHeadPositions = new Float32Array(6)
    this.trailHeadGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(this.trailHeadPositions, 3).setUsage(THREE.DynamicDrawUsage)
    )
    this.trailHeadLine = new THREE.Line(this.trailHeadGeometry, aircraftTrailMaterial)
    this.trailHeadLine.name = "trail_head_line"
    this.trailHeadLine.userData.hexIdex = hexIdent
    this.trailHeadLine.frustumCulled = false
    scene.add(this.trailHeadLine)

    if (UTILS.settings.show_all_trails) {
      this.showTrail()
    } else {
      this.hideTrail()
    }

    //console.log(`[aircraft] - add: hexIdent: ${hexIdent} | ${this.hex} | ${this.callsign} | ${this.timestamp}`)
  }

  resetFollowCameraTarget() {
    this.followCam.userData.touchStartX = 0
    this.followCam.userData.touchStartY = 0
    this.followCam.userData.rotationVelocity = 0
    this.followCam.sphericalCoords = new THREE.Spherical(UTILS.FOLLOW_CAM_DISTANCE, Math.PI / 2, 0)
  }

  remove(scene) {
    console.log(`[aircraft] - remove: ${this.hex} | ${this.callsign} | ${this.timestamp}`)
    scene.remove(this.text)
    this.text.dispose()
    scene.remove(this.group)
    scene.remove(this.trailLine)
    scene.remove(this.trailHeadLine)
    delete aircraft[this.hex]
  }

  update(data, elapsedTime) {
    if (data[ADSB.CALLSIGN] !== "") {
      this.callsign = data[ADSB.CALLSIGN]
    }

    if (data[ADSB.ALTITUDE] !== "") {
      this.alt = Number(data[ADSB.ALTITUDE])
      // note: the aircraft y-position is kept in feet for display purposes.      
      this.pos.y = this.alt
    }

    if (data[ADSB.LATITUDE] !== "") {
      this.pos.lngLat[1] = Number(data[ADSB.LATITUDE])
    }

    if (data[ADSB.LONGITUDE] !== "") {
      this.pos.lngLat[0] = Number(data[ADSB.LONGITUDE])
    }

    if (data[ADSB.SQUAWK] !== "") {
      this.squawk = data[ADSB.SQUAWK]
    }

    if (data[ADSB.IS_ON_GROUND] !== "") {
      this.isOnGround = data[ADSB.IS_ON_GROUND]
    }

    if (data[ADSB.TRACK] !== "") {
      this.hdg = data[ADSB.TRACK]
      this.mesh.rotation.y = THREE.MathUtils.degToRad(-this.hdg)
    }
    if (data[ADSB.GROUND_SPEED] !== "") {
      this.spd = data[ADSB.GROUND_SPEED]
    }

    if (this.hasValidTelemetry()) {

      if (!this.mesh.visible) {
        this.mesh.visible = true
        this.mesh.needsUpdate = true
      }

      [this.pos.x, this.pos.z] = UTILS.getXY(this.pos.lngLat).map(val => val * UTILS.DEFAULT_SCALE)

      // position is in world coordinates
      const xPos = this.pos.x
      const yPos = this.pos.y * UTILS.DEFAULT_SCALE
      const zPos = this.pos.z

      this.heightLinePos.setY(1, -yPos)
      this.heightLinePos.needsUpdate = true

      const heading = (this?.hdg) ? this.hdg + '°' : '-'
      const groundSpeed = (this?.hdg) ? this.spd + ' kt' : '-'
      const altitude = (this?.alt) ? this.alt + "'" : '-'

      this.text.text = `${this.callsign || '-'}\n${this.hex}\n${heading}\n${groundSpeed}\n${altitude}`
      this.text.sync()

      const prevYpos = this.group.position.y
      this.group.position.set(xPos, yPos, zPos)

      // update trail iff diff between previous points is less than 1000 units
      // this is completely arbitrary and can be adjusted
      // i have noticed that there are sometimes ADS-B errors that cause the aircraft to jump
      // by a large amount in a single frame
      const diff = this.group.position.y - prevYpos
      if (diff < UTILS.AIRCRAFT_TRAIL_UPDATE_Y_POS_THRESHOLD) {
        if (this.lastTrailUpdate % UTILS.AIRCRAFT_TRAIL_UPDATE_FREQUENCY == 0) {
          this.updateTrail(this.group.position)
        }
        this.lastTrailUpdate += 1
        this.updateTrailHead(this.group.position)
      } else {
        //console.log(`[aircraft] - skip trail update! - bad alt - hex: ${this.hex} callsign: ${this.callsign} prevY: ${prevYpos} diff: ${diff}`)
      }
    }

    // after each update reset timestamp
    this.timestamp = elapsedTime
  }

  hideTrail() {
    //console.log("[aircraft] - hide trail: ", this.hex, this.callsign)
    this.trailLine.visible = false
    this.trailHeadLine.visible = false
    this.trailLine.needsUpdate = true
    this.trailHeadLine.needsUpdate = true
  }

  showTrail() {
    //console.log("[aircraft] - show trail: ", this.hex, this.callsign)
    this.trailLine.visible = true
    this.trailHeadLine.visible = true
    this.trailLine.needsUpdate = true
    this.trailHeadLine.needsUpdate = true
  }

  updateTrailHead(newPoint) {
    this.trailHeadPositions[0] = this.trailPositions[0]
    this.trailHeadPositions[1] = this.trailPositions[1]
    this.trailHeadPositions[2] = this.trailPositions[2]
    this.trailHeadPositions[3] = newPoint.x
    this.trailHeadPositions[4] = newPoint.y
    this.trailHeadPositions[5] = newPoint.z
    this.trailHeadGeometry.setDrawRange(0, 2)
    this.trailHeadGeometry.attributes.position.needsUpdate = true
  }

  updateTrail(newPoint) {
    // shift existing points back
    for (let i = this.trailPositions.length - 3; i >= 3; i -= 3) {
      this.trailPositions[i] = this.trailPositions[i - 3]
      this.trailPositions[i + 1] = this.trailPositions[i - 2]
      this.trailPositions[i + 2] = this.trailPositions[i - 1]
    }

    // add new point at start
    this.trailPositions[0] = newPoint.x
    this.trailPositions[1] = newPoint.y
    this.trailPositions[2] = newPoint.z

    this.curTrailLength = Math.min(this.curTrailLength + 1, this.maxTrailPoints)
    this.trailGeometry.setDrawRange(0, this.curTrailLength)
    this.trailGeometry.attributes.position.needsUpdate = true
  }

  draw(scene, elapsedTime, cameraPosition) {

    if (!this.mesh.visible) {
      return
    }

    this.updateText(cameraPosition)

    // animate strobe light
    const alpha = Math.sin(elapsedTime * 6.0) * 0.5 + 0.5
    this.strobeLight.material.color.copy(blackColor).lerp(whiteColor, alpha)
    this.strobeLight.material.needsUpdate = true
    this.strobeLightTop.material.color.copy(blackColor).lerp(whiteColor, alpha)
    this.strobeLightTop.material.needsUpdate = true
  }

  hasExpired(elapsedTime) {
    if (!this.mesh.visible) {
      return false
    }
    return elapsedTime - this.timestamp > UTILS.AIRCRAFT_TTL
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
    return Number.isFinite(this.pos?.y) && Number.isFinite(this.pos.lngLat?.[0]) && Number.isFinite(this.pos.lngLat?.[1])
  }

  _log() {
    console.log("================")
    console.log(`hex: ${this.hex} | sqwk: ${this.squawk} | cs: ${this.callsign} | alt: ${this.alt} | spd: ${this.spd} | hdg: ${this.hdg} | lng: ${this.pos.lngLat[0]} | lat: ${this.pos.lngLat[1]}`)
    console.log(this.pos)
    console.log("################")
  }
}
