import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Stats from 'stats.js'
import * as UTILS from './utils.js'
import * as MAPS from './maps.js'
import { HUD } from './HUD.js'
import * as AIRCRAFT from './aircraft.js'
import * as ADSB from './ADSB.js'
import * as dat from 'dat.gui'
import * as SKYBOX from './skybox.js'


//
// globals
//

let animationFrameRequestId = -1

const raycasterPointer = new THREE.Vector2()
const raycaster = new THREE.Raycaster()

// scene
const scene = new THREE.Scene()

// renderer
const canvas = document.querySelector('canvas.webgl')
const renderer = new THREE.WebGLRenderer({
  canvas: canvas
})
renderer.setSize(window.innerWidth, window.innerHeight)


//
// dat.gui
//

// stats panel
const stats = new Stats()
stats.showPanel(0)
document.body.appendChild(stats.dom)
stats.dom.style.display = "none"

const gui = new dat.GUI({
  hidable: true,
})
gui.hide()
let showDatGui = false

const SETTINGS_SHOW_STATS = 'show stats'
const SETTINGS_SKYBOX = 'skybox'
const SETTINGS_SHOW_GRID = 'show polar grid'
const SETTINGS_SHOW_ALL_TRAILS = 'show all trails'
const SETTINGS_ORIGIN = 'origin'

const defaultSkybox = import.meta.env.SKIES_ADSB_SETTINGS_DEFAULT_SKYBOX?.toLowerCase() ?? SKYBOX.DAWN_DUSK

const DAT_GUI_SETTINGS = {
  [SETTINGS_SHOW_STATS]: false,
  [SETTINGS_SKYBOX]: defaultSkybox,
  [SETTINGS_SHOW_GRID]: false,
  [SETTINGS_SHOW_ALL_TRAILS]: UTILS.settings.show_all_trails,
}

MAPS.LAYER_NAMES.forEach(layer => {
  DAT_GUI_SETTINGS[layer] = false
})

DAT_GUI_SETTINGS[SETTINGS_ORIGIN] = []

console.table("[DAT GUI Settings]: ")
console.table(DAT_GUI_SETTINGS)

gui.add(DAT_GUI_SETTINGS, SETTINGS_SHOW_STATS).onChange(showStats => {
  if (showStats) {
    stats.dom.style.display = ""
  } else {
    stats.dom.style.display = "none"
  }
})

gui.add(DAT_GUI_SETTINGS, SETTINGS_SHOW_GRID).onChange(isVisible => {
  console.log(`[DAT GUI] - show grid: ${isVisible}`)
  polarGridHelper.visible = isVisible
})

gui.add(DAT_GUI_SETTINGS, SETTINGS_SKYBOX, [
  SKYBOX.DAWN_DUSK,
  SKYBOX.DAY,
  SKYBOX.NIGHT
]).onChange(timeOfDay => {
  console.log(`[DAT GUI] - skybox: ${timeOfDay}`)
  skybox.setTexture(timeOfDay)
})


const autoOrbitSettingsFolder = gui.addFolder('Auto Orbit Settings')
autoOrbitSettingsFolder.add(UTILS.settings.auto_orbit, 'min_radius',
  UTILS.CAMERA_AUTO_ORBIT_SETTINGS_MIN_RADIUS,
  UTILS.CAMERA_AUTO_ORBIT_SETTINGS_MAX_RADIUS
).onChange(value => {
  UTILS.settings.auto_orbit.min_radius = value
  if (UTILS.settings.auto_orbit.min_radius > UTILS.settings.auto_orbit.max_radius) {
    UTILS.settings.auto_orbit.max_radius = UTILS.settings.auto_orbit.min_radius
    gui.updateDisplay()
  }
  resetAutoOrbitCamera()
})
autoOrbitSettingsFolder.add(UTILS.settings.auto_orbit, 'max_radius',
  UTILS.CAMERA_AUTO_ORBIT_SETTINGS_MIN_RADIUS,
  UTILS.CAMERA_AUTO_ORBIT_SETTINGS_MAX_RADIUS
).onChange(value => {
  UTILS.settings.auto_orbit.max_radius = value
  if (UTILS.settings.auto_orbit.max_radius < UTILS.settings.auto_orbit.min_radius) {
    UTILS.settings.auto_orbit.min_radius = UTILS.settings.auto_orbit.max_radius
    gui.updateDisplay()
  }
  resetAutoOrbitCamera()
})
autoOrbitSettingsFolder.add(UTILS.settings.auto_orbit, 'radius_speed',
  UTILS.CAMERA_AUTO_ORBIT_MIN_RADIUS_SPEED,
  UTILS.CAMERA_AUTO_ORBIT_MAX_RADIUS_SPEED
).onChange(value => {
  UTILS.settings.auto_orbit.radius_speed = value
  resetAutoOrbitCamera()
})
autoOrbitSettingsFolder.add(UTILS.settings.auto_orbit, 'vertical_speed',
  UTILS.CAMERA_AUTO_ORBIT_MIN_VERTICAL_SPEED,
  UTILS.CAMERA_AUTO_ORBIT_MAX_VERTICAL_SPEED
).onChange(value => {
  UTILS.settings.auto_orbit.vertical_speed = value
  resetAutoOrbitCamera()
})
autoOrbitSettingsFolder.add(UTILS.settings.auto_orbit, 'horizontal_speed',
  UTILS.CAMERA_AUTO_ORBIT_MIN_HORIZONTAL_SPEED,
  UTILS.CAMERA_AUTO_ORBIT_MAX_HORIZONTAL_SPEED
).onChange(value => {
  UTILS.settings.auto_orbit.horizontal_speed = value
  resetAutoOrbitCamera()
})
autoOrbitSettingsFolder.add(UTILS.settings.auto_orbit, 'min_phi',
  UTILS.CAMERA_AUTO_ORBIT_MIN_PHI,
  UTILS.CAMERA_AUTO_ORBIT_MAX_PHI
).onChange(value => {
  UTILS.settings.auto_orbit.min_phi = value
  if (UTILS.settings.auto_orbit.min_phi > UTILS.settings.auto_orbit.max_phi) {
    UTILS.settings.auto_orbit.max_phi = UTILS.settings.auto_orbit.min_phi
    gui.updateDisplay()
  }
  resetAutoOrbitCamera()
})
autoOrbitSettingsFolder.add(UTILS.settings.auto_orbit, 'max_phi',
  UTILS.CAMERA_AUTO_ORBIT_MIN_PHI,
  UTILS.CAMERA_AUTO_ORBIT_MAX_PHI
).onChange(value => {
  UTILS.settings.auto_orbit.max_phi = value
  if (UTILS.settings.auto_orbit.max_phi < UTILS.settings.auto_orbit.min_phi) {
    UTILS.settings.auto_orbit.min_phi = UTILS.settings.auto_orbit.max_phi
    gui.updateDisplay()
  }
  resetAutoOrbitCamera()
})


gui.add(DAT_GUI_SETTINGS, SETTINGS_SHOW_ALL_TRAILS)
  .onChange(async showAllTrails => {
    console.log("[DAT GUI] - showAllTrails toggle: ", showAllTrails)
    await toggleAircraftTrails(showAllTrails)
  })

async function toggleAircraftTrails(showAllTrails) {
  Object.values(AIRCRAFT.aircraft).forEach(aircraft => {
    UTILS.settings.show_all_trails = showAllTrails
    if (showAllTrails) {
      aircraft.showTrail()
    } else {
      aircraft.hideTrail()
      // keep the selected aircraft trail visible
      UTILS.INTERSECTED?.aircraft?.showTrail()
    }
  })
}


// Clock
let clock = new THREE.Clock()

//
// cameras
//

const CAMERA_INITIAL_ASPECT = UTILS.sizes.width / UTILS.sizes.height

const orbitCamera = new THREE.PerspectiveCamera(
  UTILS.CAMERA_FOV, CAMERA_INITIAL_ASPECT, UTILS.CAMERA_NEAR, UTILS.CAMERA_FAR)
orbitCamera.position.z = UTILS.FOLLOW_CAM_DISTANCE

const followCamera = orbitCamera.clone()

const autoOrbitCamera = orbitCamera.clone()

const autoOrbitCameraObject = new THREE.Object3D()
scene.add(autoOrbitCameraObject)


const cameras = {
  [UTILS.CAMERA_MODE_ORBIT]: {
    cam: orbitCamera,
    mode: UTILS.CAMERA_MODE_ORBIT,
  },
  [UTILS.CAMERA_MODE_FOLLOW]: {
    cam: followCamera,
    mode: UTILS.CAMERA_MODE_FOLLOW,
  },
  [UTILS.CAMERA_MODE_AUTO_ORBIT]: {
    cam: autoOrbitCamera,
    mode: UTILS.CAMERA_MODE_AUTO_ORBIT,
  }
}

let camera = cameras[UTILS.CAMERA_MODE_ORBIT]

// controls
const controls = new OrbitControls(orbitCamera, renderer.domElement)

//
// track if mouse click causes camera changes via OrbitControls
// used to help toggle display of HUD and prevent the HUD
// from toggling while user pans the camera around using a mouse
// see:
// https://www.html5rocks.com/en/mobile/touchandmouse/
//
controls.addEventListener('change', (event) => {
  light.position.copy(camera.cam.position)
  light.target.position.copy(controls.target)
})

// axes helper
const axesHelper = new THREE.AxesHelper()
scene.add(axesHelper)

// scene lighting
const ambientLight = new THREE.AmbientLight(0x4c4c4c)
scene.add(ambientLight)

const light = new THREE.DirectionalLight(0xffffff, 1)
scene.add(light)
scene.add(light.target)

// skybox
const skybox = new SKYBOX.Skybox(scene, defaultSkybox)

// polar grid
const polarGridHelper = new THREE.PolarGridHelper(
  UTILS.POLAR_GRID_RADIUS,
  UTILS.POLAR_GRID_RADIALS,
  UTILS.POLAR_GRID_CIRCLES,
  UTILS.POLAR_DIVISIONS,
  UTILS.POLAR_GRID_COLOR_1,
  UTILS.POLAR_GRID_COLOR_2
)
polarGridHelper.visible = false
scene.add(polarGridHelper)


//
// draw
//

const cameraWorldPos = new THREE.Vector3()

function draw(elapsedTime, deltaTime) {

  camera.cam.getWorldPosition(cameraWorldPos)

  HUD.update()

  raycaster.setFromCamera(raycasterPointer, camera.cam)

  //
  // aircraft
  //

  Object.entries(AIRCRAFT.aircraft).forEach(([key, aircraft]) => {

    const aircraftHasExpired = aircraft.draw(scene, elapsedTime, cameraWorldPos)

    if (raycasterPointer?.x && raycasterPointer?.y) {

      const groupIntersect = raycaster.intersectObject(aircraft.group, true)

      if (groupIntersect.length > 0) {

        // console.log("=============================================")
        // console.log("Found Raycaster Intersection")
        // console.log("---------------------------------------------")
        // console.log("\t", aircraft)
        // console.log("\t", groupIntersect)
        // console.log(`\thasValidTelemetry: ${aircraft.hasValidTelemetry()}`)

        raycasterPointer.set(null, null)

        if (aircraft.hasValidTelemetry() && key !== UTILS.INTERSECTED.key) {

          if (UTILS.INTERSECTED?.key) {
            UTILS.INTERSECTED?.aircraft.resetFollowCameraTarget()
            if (!UTILS.settings.show_all_trails) {
              UTILS.INTERSECTED?.aircraft.hideTrail()
            }
            UTILS.INTERSECTED.mesh.material.color = AIRCRAFT.airCraftColor
          }

          UTILS.INTERSECTED.key = key
          UTILS.INTERSECTED.mesh = aircraft.mesh
          UTILS.INTERSECTED.mesh.material.color = AIRCRAFT.airCraftSelectedColor
          UTILS.INTERSECTED.aircraft = aircraft

          aircraft.showTrail()

          console.log(`[main] AIRCRAFT INTERSECTED - key: ${key} | callsign: ${aircraft?.callsign}`)

          HUD.show(aircraft)

          // console.log(UTILS.INTERSECTED)
        }

        // console.log("=============================================")
      }
    }

    if (aircraft.hasExpired(elapsedTime)) {
      removeAircraft(aircraft)
    }
  })

  // Make sure the map origin labels are always facing the user's camera
  MAPS.LAYER_GROUPS[MAPS.LAYER_ORIGINS]?.children?.forEach((child) => {
    child.lookAt(camera.cam.position)
  })

  if (raycasterPointer?.x && raycasterPointer?.y) {
    raycasterPointer.set(null, null)
  }
}

function removeAircraft(aircraft) {

  //console.log("removeAircraft: ", aircraft.hex)

  if (aircraft.hex === UTILS.INTERSECTED.key) {
    deselectAirCraftAndHideHUD()
  }
  aircraft.remove(scene)
}

function deselectAirCraftAndHideHUD() {
  if (UTILS.INTERSECTED?.key) {
    UTILS.INTERSECTED.mesh.material.color = AIRCRAFT.airCraftColor
    UTILS.INTERSECTED.key = null
    UTILS.INTERSECTED.mesh = null
    const aircraft = UTILS.INTERSECTED.aircraft

    if (!UTILS.settings.show_all_trails) {
      aircraft.hideTrail()
    }

    UTILS.INTERSECTED.aircraft = null
    if (camera.mode === UTILS.CAMERA_MODE_FOLLOW) {
      const target = aircraft.group.getWorldPosition(new THREE.Vector3())
      aircraft.resetFollowCameraTarget()
      resetOrbitCamera(target)
    }

    isFollowCamAttached = false
    HUD.hide()
  }
}

//
// window resize event listeners
//

window.addEventListener('resize', () => {
  UTILS.sizes.width = window.innerWidth
  UTILS.sizes.height = window.innerHeight

  console.log(`[main] window resize - w: ${UTILS.sizes.width} h: ${UTILS.sizes.height}`)

  orbitCamera.aspect = UTILS.sizes.width / UTILS.sizes.height
  orbitCamera.updateProjectionMatrix()

  followCamera.aspect = UTILS.sizes.width / UTILS.sizes.height
  followCamera.updateProjectionMatrix()

  autoOrbitCamera.aspect = UTILS.sizes.width / UTILS.sizes.height
  autoOrbitCamera.updateProjectionMatrix()

  renderer.setSize(UTILS.sizes.width, UTILS.sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})



//
// Raycaster Pointer and Follow Camera Touch Controls
//

let isFollowCamAttached = false

const raycasterPointerStart = new THREE.Vector2()
const raycasterPointerEnd = new THREE.Vector2()

function onPointerDown(event) {

  if (event.isPrimary === false) return

  raycasterPointerStart.set(event.clientX, event.clientY)

  if (isFollowCamAttached) {
    const aircraft = UTILS.INTERSECTED?.aircraft
    const aircraftFollowCam = aircraft.followCam

    aircraftFollowCam.userData.touchStartX =
      event.pointerType === "touch" ? event.pageX : event.clientX
    aircraftFollowCam.userData.touchStartY =
      event.pointerType === "touch" ? event.pageY : event.clientY
  }

  document.addEventListener('pointermove', onPointerMove)
  document.addEventListener('pointerup', onPointerUp)
}

document.addEventListener('pointerdown', onPointerDown)

//
// Follow Camera Touch Controls
//

function onPointerMove(event) {
  if (event.isPrimary === false || !isFollowCamAttached) return

  const aircraft = UTILS.INTERSECTED?.aircraft
  const aircraftFollowCam = aircraft.followCam

  let touchX = event.pointerType === "touch" ? event.pageX : event.clientX
  let touchY = event.pointerType === "touch" ? event.pageY : event.clientY

  // Calculate normalized deltas
  const deltaX =
    (touchX - aircraftFollowCam.userData.touchStartX) / window.innerWidth
  const deltaY =
    (touchY - aircraftFollowCam.userData.touchStartY) / window.innerHeight

  // Calculate new velocity with smoothing
  let targetVelocity = deltaX * Math.PI

  // Apply direction change resistance
  if (
    Math.sign(targetVelocity) !==
    Math.sign(aircraftFollowCam.userData.rotationVelocity)
  ) {
    targetVelocity *= UTILS.FOLLOW_CAM_DIRECTION_CHANGE_RESISTANCE
  }

  // Smooth velocity transitions
  aircraftFollowCam.userData.rotationVelocity =
    aircraftFollowCam.userData.rotationVelocity * (1 - UTILS.FOLLOW_CAM_VELOCITY_SMOOTHING) +
    targetVelocity * UTILS.FOLLOW_CAM_VELOCITY_SMOOTHING

  // Apply minimum threshold
  if (Math.abs(aircraftFollowCam.userData.rotationVelocity) < UTILS.FOLLOW_CAM_VELOCITY_THRESHOLD) {
    aircraftFollowCam.userData.rotationVelocity = 0
  }

  // Update spherical coordinates with dampening
  aircraftFollowCam.userData.sphericalCoords.theta +=
    aircraftFollowCam.userData.rotationVelocity * UTILS.FOLLOW_CAM_DAMPING_FACTOR
  aircraftFollowCam.userData.sphericalCoords.phi = THREE.MathUtils.clamp(
    aircraftFollowCam.userData.sphericalCoords.phi +
    deltaY * Math.PI * UTILS.FOLLOW_CAM_DAMPING_FACTOR,
    UTILS.FOLLOW_CAM_MIN_POLAR_ANGLE,
    UTILS.FOLLOW_CAM_MAX_POLAR_ANGLE
  )

  // Update position
  const position = new THREE.Vector3()
  position.setFromSpherical(aircraftFollowCam.userData.sphericalCoords)

  const targetPos = aircraft.group.getWorldPosition(new THREE.Vector3())
  aircraftFollowCam.position.copy(position)
  followCamera.position.copy(aircraftFollowCam.getWorldPosition(new THREE.Vector3()))
  followCamera.lookAt(targetPos)

  aircraftFollowCam.userData.touchStartX = touchX
  aircraftFollowCam.userData.touchStartY = touchY
}

function onPointerUp(event) {
  if (event.isPrimary === false) return

  raycasterPointerEnd.set(event.clientX, event.clientY)

  const isClick = raycasterPointerStart.distanceToSquared(raycasterPointerEnd) === 0
  const notInHUD = !HUD.isClientXYInHUDContainer(event.clientX, event.clientY)

  if (isClick && notInHUD) {
    raycasterPointer.set(
      (raycasterPointerEnd.x / window.innerWidth) * 2 - 1,
      -(raycasterPointerEnd.y / window.innerHeight) * 2 + 1
    )
  }

  document.removeEventListener('pointermove', onPointerMove)
  document.removeEventListener('pointerup', onPointerUp)
}


//
// HUD
//

//
// homeButton - reset camera to home position and reset orbit controls
//
HUD.hud.homeButton.addEventListener('click', (e) => {
  resetCameraToHome()
  e.stopPropagation()
})

//
// autoOrbitButton - toggle between auto orbit camera and orbit control camera
//
HUD.hud.autoOrbitButton.addEventListener('click', (e) => {
  HUD.toggleAutoOrbitButton()

  if (camera.mode === UTILS.CAMERA_MODE_FOLLOW) {
    HUD.toggleFollowButton()
  }

  if (camera.mode === UTILS.CAMERA_MODE_AUTO_ORBIT) {
    camera = cameras[UTILS.CAMERA_MODE_ORBIT]
    resetCameraToHome()
  } else {
    camera = cameras[UTILS.CAMERA_MODE_AUTO_ORBIT]
  }

  e.stopPropagation()
})


//
// settingsButton - show dat.gui settings dialog
//
HUD.hud.settingsButton.addEventListener('click', (e) => {
  HUD.toggleSettingsButton()
  showDatGui = !showDatGui
  if (showDatGui) {
    gui.show()
  } else {
    gui.hide()
  }
  e.stopPropagation()
})

//
// closeButton - deselect aircraft and hide right side HUD
//
HUD.hud.closeButton.addEventListener('click', (e) => {
  if (!HUD.isVisible()) return
  deselectAirCraftAndHideHUD()
  e.stopPropagation()
})

//
// infoButton - toggle selected aircraft info dialog
//
HUD.hud.infoButton.addEventListener('click', (e) => {
  if (!HUD.isVisible()) return
  HUD.toggleAircraftInfoDialogButton()
  e.stopPropagation()
})

//
// cameraButton - toggle between orbit control camera and follow camera
//
HUD.hud.cameraButton.addEventListener('click', (e) => {

  if (!HUD.isVisible()) return
  if (camera.mode !== UTILS.CAMERA_MODE_FOLLOW) {

    if (camera.mode === UTILS.CAMERA_MODE_AUTO_ORBIT) {
      HUD.toggleAutoOrbitButton()
    }

    // console.log("INTERSECTED AIRCRAFT: ")
    // console.log(UTILS.INTERSECTED?.aircraft)    
    followCamera.position.copy(camera.cam.position)
    followCamera.lookAt(camera.cam.lookAt)
    camera = cameras[UTILS.CAMERA_MODE_FOLLOW]
    controls.enabled = false
  } else {
    deselectAirCraftAndHideHUD()
  }
  console.log(`[HUD] toggle camera - mode: ${camera.mode}`)
  HUD.toggleFollowButton()
  e.stopPropagation()
})

//
// fullscreen toggle on double click event listener
// see:
// https://developers.google.com/web/fundamentals/native-hardware/fullscreen
//
HUD.hud.fullscreenButton.addEventListener('click', (e) => {
  const doc = window.document
  const docEl = doc.documentElement

  const requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen
  const cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen

  if (!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
    requestFullScreen.call(docEl)
  }
  else {
    cancelFullScreen.call(doc)
  }
  e.stopPropagation()
})

function resetCameraToHome() {

  switch (camera.mode) {
    case UTILS.CAMERA_MODE_FOLLOW:
      HUD.toggleFollowButton()
      break
    case UTILS.CAMERA_MODE_AUTO_ORBIT:
      HUD.toggleAutoOrbitButton()
      break
  }

  camera = cameras[UTILS.CAMERA_MODE_ORBIT]
  controls.enabled = true
  controls.reset()
}

function resetOrbitCamera(target) {
  console.log("[main] - resetOrbitCamera")
  orbitCamera.position.copy(camera.cam.position)
  controls.target.set(target.x, target.y, target.z)
  controls.update()
  controls.enabled = true
  camera = cameras[UTILS.CAMERA_MODE_ORBIT]
}

function updateCamera(elapsedTime, deltaTime) {

  if (camera.mode === UTILS.CAMERA_MODE_FOLLOW && UTILS.INTERSECTED?.aircraft) {
    const aircraft = UTILS.INTERSECTED?.aircraft
    const followCamPos = aircraft.followCam.getWorldPosition(new THREE.Vector3())
    const followCamTargetPos = aircraft.group.getWorldPosition(new THREE.Vector3())
    camera.cam.position.lerp(followCamPos, 0.05)
    camera.cam.lookAt(followCamTargetPos)

    if (camera.cam.position.distanceToSquared(followCamPos) < 1.0) {
      isFollowCamAttached = true
    }
    light.position.copy(camera.cam.position)
    light.target.position.copy(followCamTargetPos)

    //
    // Apply momentum damping
    //
    if (isFollowCamAttached) {
      const aircraftFollowCam = aircraft.followCam
      aircraftFollowCam.userData.rotationVelocity *= UTILS.FOLLOW_CAM_DAMPING_FACTOR
      aircraftFollowCam.userData.sphericalCoords.theta +=
        aircraftFollowCam.userData.rotationVelocity
    }

  } else {
    controls.update()
  }

  updateAutoOrbitCamera(elapsedTime, deltaTime)
}


function updateAutoOrbitCamera(elapsedTime, deltaTime) {

  const MIN_RADIUS = UTILS.settings.auto_orbit.min_radius
  const MAX_RADIUS = UTILS.settings.auto_orbit.max_radius
  const RADIUS_SPEED = UTILS.settings.auto_orbit.radius_speed
  const VERTICAL_SPEED = UTILS.settings.auto_orbit.vertical_speed
  const HORIZONTAL_SPEED = UTILS.settings.auto_orbit.horizontal_speed

  const MIN_ALTITUDE = THREE.MathUtils.degToRad(UTILS.settings.auto_orbit.min_phi)
  const MAX_ALTITUDE = THREE.MathUtils.degToRad(UTILS.settings.auto_orbit.max_phi)

  const radius = MIN_RADIUS + (MAX_RADIUS - MIN_RADIUS) * (0.5 + 0.5 * Math.sin(elapsedTime * RADIUS_SPEED))
  const verticalAngle = MIN_ALTITUDE + (MAX_ALTITUDE - MIN_ALTITUDE) * (0.5 + 0.5 * Math.sin(elapsedTime * VERTICAL_SPEED))

  const horizontalAngle = Math.sin(elapsedTime * HORIZONTAL_SPEED) * Math.PI * 2

  autoOrbitCameraObject.position.setFromSphericalCoords(
    radius,
    verticalAngle,
    horizontalAngle
  )

  const worldPosition = new THREE.Vector3()
  autoOrbitCameraObject.getWorldPosition(worldPosition)
  autoOrbitCamera.position.copy(worldPosition)
  autoOrbitCamera.lookAt(0, 0, 0)
}

function resetAutoOrbitCamera() {
  updateAutoOrbitCamera(0, 0)
}


//
// handle page visibility
// https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API
//
function handleVisibilityChange() {
  if (document.visibilityState === "hidden") {
    console.log("[main] handleVisibilityChange: PAUSE SIMULATION")
    ADSB.stop()
    window.cancelAnimationFrame(animationFrameRequestId)
  } else {
    console.log("[main] handleVisibilityChange: RESUME SIMULATION")
    ADSB.start(scene, clock)
    animationFrameRequestId = window.requestAnimationFrame(animate)
  }
}
document.addEventListener('visibilitychange', handleVisibilityChange, false)

//
// animate
//

const animate = function () {
  stats.begin()

  const elapsedTime = clock.getElapsedTime()
  const deltaTime = clock.getDelta()

  animationFrameRequestId = requestAnimationFrame(animate)

  updateCamera(elapsedTime, deltaTime)

  draw(elapsedTime, deltaTime)

  renderer.render(scene, camera.cam)

  stats.end()
}

//
// stop ADSB, rebuild maps, update origin, update camera, update UI, start ADSB
//
async function updateOriginAndRebuildMapLayers(key) {

  ADSB.stop()

  console.log("[main] - updateOriginAndReloadMapLayers: ")
  console.table(MAPS.ORIGINS[key])

  // clear map layers
  Object.entries(MAPS.LAYER_GROUPS).forEach(([key, layer]) => {
    console.log(`\tremoving layer: ${key}`)
    scene.remove(layer)
  })

  // clear aircraft
  Object.values(AIRCRAFT.aircraft).forEach(aircraft => {
    removeAircraft(aircraft)
  })

  // rebuild map layers with new origin
  const lonLat = [
    MAPS.ORIGINS[key].lon,
    MAPS.ORIGINS[key].lat
  ]

  await UTILS.setOrigin(lonLat)

  await MAPS.buildMapLayers(scene)

  resetCameraToHome()

  ADSB.start(scene, clock)

  HUD.enableHUD()

  // select default camera mode on map load
  let cameraMode = import.meta.env.SKIES_ADSB_DEFAULT_CAMERA_MODE?.toLowerCase()
  const defaultCameraModes = [UTILS.CAMERA_MODE_ORBIT, UTILS.CAMERA_MODE_AUTO_ORBIT]
  if (!defaultCameraModes.includes(cameraMode)) {
    console.warn(`[main] - invalid default camera mode: ${cameraMode} | using orbit camera`)
    cameraMode = UTILS.CAMERA_MODE_ORBIT
  }
  camera = cameras[cameraMode]
  if (cameraMode === UTILS.CAMERA_MODE_AUTO_ORBIT) {
    HUD.toggleAutoOrbitButton()
  }
}

//
// Initialize Simulation - start rendering, 
//

async function initSimulation() {
  console.log("[main] - initSimulation")

  animate()

  // Initialize Map data
  const result = await MAPS.init()
  if (!result) {
    console.error("\tERROR: Failed to initialize map data!")
    return
  }

  // build controller for changing origins
  const datGuiOriginController = gui.add(
    DAT_GUI_SETTINGS,
    SETTINGS_ORIGIN,
    Object.keys(MAPS.ORIGINS)
  ).onChange(key => {
    updateOriginAndRebuildMapLayers(key)
  })

  // build map layers toggle
  console.log("[main] - buildMapLayersToggle gui")

  const layersFolder = gui.addFolder('Map Layers')

  Object.keys(MAPS.LAYER_GROUPS).forEach(key => {
    DAT_GUI_SETTINGS[key] = MAPS.isLayerVisible(key)
    layersFolder.add(DAT_GUI_SETTINGS, key).onChange(isVisible => {
      const layer = MAPS.LAYER_GROUPS[key]
      console.log(`[DAT GUI] toggle layer - visibility: ${key} | isVisible: ${isVisible}`)
      layer.visible = isVisible
      layer.needsUpdate = true
    })
  })

  // select default origin as the simulation starting view point
  datGuiOriginController.setValue(MAPS.DEFAULT_ORIGIN)
}

initSimulation()
