import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Stats from 'stats.js'
import * as MAPS from './maps.js'
import * as UTILS from './utils.js'
import { HUD } from './HUD.js'
import * as AIRCRAFT from './aircraft.js'
import * as ADSB from './ADSB.js'
import * as dat from 'dat.gui'
import * as SKYBOX from './skybox.js'

//
// globals
//

let animationFrameRequestId = -1

const pointer = new THREE.Vector2()
const raycaster = new THREE.Raycaster()

// scene
const scene = new THREE.Scene()

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
stats.dom.style.display = "none"


// dat.gui
const gui = new dat.GUI({
  hidable: true
})
gui.hide()
let showDatGui = false

let settings = {
  lng: "-80.27787208557129",
  lat: "25.794868197349306",
  showStats: false,
  skybox: 'dawn+dusk'
}

// gui.add(settings, 'lng', settings.lng)
// gui.add(settings, 'lat', settings.lat)

gui.add(settings, 'skybox', ['dawn+dusk', 'day', 'night']).onChange((timeOfDay) => {
  console.log(`timeOfDay: ${timeOfDay}`)
  skybox.setTexture(timeOfDay)
})

gui.add(settings, 'showStats').onChange((showStats) => {
  if (showStats) {
    stats.dom.style.display = ""
  } else {
    stats.dom.style.display = "none"
  }
})


// Clock
let clock = new THREE.Clock()

// cameras

const orbitCamera = new THREE.PerspectiveCamera(75, UTILS.sizes.width / UTILS.sizes.height, 0.1, 10000)
const followCamera = new THREE.PerspectiveCamera(75, UTILS.sizes.width / UTILS.sizes.height, 0.1, 10000)
followCamera.rotation.order = 'YXZ'
let camera = orbitCamera
camera.position.z = 10


// controls
const controls = new OrbitControls(camera, renderer.domElement)

//
// track if mouse click causes camera changes via OrbitControls
// used to help toggle display of HUD and prevent the HUD
// from toggling while user pans the camera around using a mouse
// see:
// https://www.html5rocks.com/en/mobile/touchandmouse/
//
let numOrbitControlsActive = 0
let isClickDueToOrbitControlsInteraction = false
controls.addEventListener('change', (event) => {
  isClickDueToOrbitControlsInteraction = true
  light.position.copy(camera.position)
  light.target.position.copy(controls.target)
})
controls.addEventListener('start', (event) => {
  numOrbitControlsActive++
})
controls.addEventListener('end', (event) => {
  numOrbitControlsActive--
})


// axes helper
const axesHelper = new THREE.AxesHelper()
scene.add(axesHelper)

// scene lighting
const amientLight = new THREE.AmbientLight(0x4c4c4c)
scene.add(amientLight)

const light = new THREE.DirectionalLight(0xffffff, 1)
light.position.copy(camera.position)
scene.add(light)
scene.add(light.target)

// skybox
const skybox = new SKYBOX.Skybox(scene)


// polar grid
// const radius = 500
// const radials = 16
// const circles = 5
// const divisions = 64
// const color1 = "#81efff"
// const color2 = color1
// const helper = new THREE.PolarGridHelper(radius, radials, circles, divisions, color1, color2)
// scene.add(helper)




//
// draw
//

const cameraWorldPos = new THREE.Vector3()

function draw(elapsedTime, deltaTime) {

  camera.getWorldPosition(cameraWorldPos)

  HUD.update()

  raycaster.setFromCamera(pointer, camera)

  //
  // aircraft
  //

  for (const key in AIRCRAFT.aircrafts) {

    const aircraft = AIRCRAFT.aircrafts[key];

    const aircraftHasExpired = aircraft.draw(scene, elapsedTime, cameraWorldPos)

    if (pointer?.x && pointer?.y) {

      const groupIntersect = raycaster.intersectObject(aircraft.group, true)

      if (groupIntersect.length > 0) {

        console.log("---------------")
        console.log(`key: ${key}`)
        console.log(aircraft)
        console.log(groupIntersect)
        console.log(`hasValidTelemetry: ${aircraft.hasValidTelemetry()}`)
        console.log("---------------")
        pointer.set(null, null)

        if (aircraft.hasValidTelemetry() && key !== UTILS.INTERSECTED.key) {

          if (UTILS.INTERSECTED?.key) {
            UTILS.INTERSECTED?.aircraft.resetFollowCameraTarget()
            UTILS.INTERSECTED.mesh.material.color = AIRCRAFT.airCraftColor
          }

          UTILS.INTERSECTED.key = key
          UTILS.INTERSECTED.mesh = aircraft.mesh
          UTILS.INTERSECTED.mesh.material.color = AIRCRAFT.airCraftSelectedColor
          UTILS.INTERSECTED.aircraft = aircraft

          console.log("!!! INTERSECT !!!")

          HUD.show(aircraft)

          console.log(UTILS.INTERSECTED)
        }
      }
    }

    if (aircraftHasExpired) {
      if (aircraft.hex === UTILS.INTERSECTED.key) {
        deselectAirCraftAndHideHUD()
      }
      aircraft.remove(scene)
    }
  }

  for (const poiLabel of MAPS.poiLabels) {
    poiLabel.lookAt(camera.position)
  }

  if (pointer?.x && pointer?.y) {
    pointer.set(null, null)
  }
}

function deselectAirCraftAndHideHUD() {
  if (UTILS.INTERSECTED?.key) {
    UTILS.INTERSECTED.mesh.material.color = AIRCRAFT.airCraftColor
    UTILS.INTERSECTED.key = null
    UTILS.INTERSECTED.mesh = null
    const aircraft = UTILS.INTERSECTED.aircraft
    UTILS.INTERSECTED.aircraft = null
    if (cameraMode === CAMERA_FOLLOW) {
      const target = aircraft.followCamTarget.getWorldPosition(new THREE.Vector3())
      aircraft.resetFollowCameraTarget()
      resetGhostCamera(target)
    }

    isFollowCamAttached = false
    HUD.hide()
  }
}

//
// window resize event listeners
//

let windowHalfX = window.innerWidth / 2.0
let windowHalfY = window.innerHeight / 2.0


window.addEventListener('resize', () => {
  UTILS.sizes.width = window.innerWidth
  UTILS.sizes.height = window.innerHeight

  windowHalfX = window.innerWidth / 2.0
  windowHalfY = window.innerHeight / 2.0

  console.log(`window resize - w: ${UTILS.sizes.width} h: ${UTILS.sizes.height}`)

  orbitCamera.aspect = UTILS.sizes.width / UTILS.sizes.height
  orbitCamera.updateProjectionMatrix()

  followCamera.aspect = UTILS.sizes.width / UTILS.sizes.height
  followCamera.updateProjectionMatrix()

  renderer.setSize(UTILS.sizes.width, UTILS.sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

//
// single click listener to check for airplane intersections
//

let ignoreTouchEndEvent = false

window.addEventListener('click', (event) => {

  console.log(`[click..] isPointerMoving: ${isPointerMoving} isFollowCamAttached: ${isFollowCamAttached}`)

  const clientX = event.clientX;
  const clientY = event.clientY;

  if (HUD.isClientXYInHUDContainer(clientX, clientY)) {
    console.log("[click in HUD container!!!]")
    return
  }

  if (ignoreTouchEndEvent) {
    ignoreTouchEndEvent = false
    console.log("\tignoreTouchEvent --")
    return
  }

  if (wasPointerMoving) {
    wasPointerMoving = false
    return
  }

  if (event.pointerType === 'mouse' && numOrbitControlsActive > 0) {
    console.log("\tignore click -- pointer is mouse...")
    return
  }

  if (!isFollowCamAttached && isClickDueToOrbitControlsInteraction) {
    isClickDueToOrbitControlsInteraction = false
    console.log("click due to oribitcontrols interaction...")
    return
  }

  pointer.set(
    (clientX / window.innerWidth) * 2 - 1,
    -(clientY / window.innerHeight) * 2 + 1
  )
  console.log(`click`, pointer, event)
})

let previousTouch = null

window.addEventListener('touchend', (event) => {

  previousTouch = null

  const clientX = event.changedTouches[0].clientX
  const clientY = event.changedTouches[0].clientY

  if (HUD.isClientXYInHUDContainer(clientX, clientY)) {
    console.log("[touchend in nav container!!!]")
    return
  }

  if (wasPointerMoving) {
    wasPointerMoving = false
    return
  }

  if (numOrbitControlsActive > 0) {
    return
  }

  if (!isFollowCamAttached && isClickDueToOrbitControlsInteraction) {
    isClickDueToOrbitControlsInteraction = false
    return
  }

  ignoreTouchEndEvent = true

  pointer.set(
    (clientX / window.innerWidth) * 2 - 1,
    -(clientY / window.innerHeight) * 2 + 1
  )

  console.log(`touchend`, pointer, event)
})


let isPointerMoving = false
let wasPointerMoving = false


window.addEventListener('touchmove', (event) => {
  console.log(`[touch move] attached: ${isFollowCamAttached} ->`, event)

  const touch = event.touches[0]

  if (isFollowCamAttached && previousTouch !== null) {
    isPointerMoving = true
    wasPointerMoving = true
  }

  previousTouch = touch
})


let isMouseDown = false
window.addEventListener('mousedown', (event) => {
  console.log('[mousedown]')
  isMouseDown = true
})
window.addEventListener('mouseup', (event) => {
  console.log('[mouseup]')
  isMouseDown = false
  if (isPointerMoving) {
    isPointerMoving = false
    wasPointerMoving = true
  }
})

window.addEventListener('mousemove', (event) => {
  if (isMouseDown && isFollowCamAttached) {
    isPointerMoving = true
  }
})

let isFollowCamAttached = false

const rotateStart = new THREE.Vector2()
const rotateEnd = new THREE.Vector2()
const rotateDelta = new THREE.Vector2()

function onPointerDown(event) {

  if (event.isPrimary === false) return;

  console.log("[onPointerDown]")

  if (isFollowCamAttached) {
    if (event.pointerType === 'touch') {
      rotateStart.set(event.pageX, event.pageY)
    } else {
      rotateStart.set(event.clientX, event.clientY)
    }
  }

  document.addEventListener('pointermove', onPointerMove)
  document.addEventListener('pointerup', onPointerUp)
}

document.addEventListener('pointerdown', onPointerDown)


function onPointerMove(event) {

  if (event.isPrimary === false) return;

  if (isFollowCamAttached) {
    isPointerMoving = true
    const aircraft = UTILS.INTERSECTED?.aircraft

    let yRot = 0.0
    let xRot = 0.0

    if (event.pointerType === 'touch') {
      rotateEnd.set(event.pageX, event.pageY)
      rotateDelta.subVectors(rotateEnd, rotateStart).multiplyScalar(1.0)
      const element = canvas;
      yRot = 2 * Math.PI * rotateDelta.x / element.clientHeight // yes, height
      xRot = 2 * Math.PI * rotateDelta.y / element.clientHeight
      rotateStart.copy(rotateEnd);
    } else {
      rotateEnd.set(event.clientX, event.clientY)
      rotateDelta.subVectors(rotateEnd, rotateStart).multiplyScalar(1.0)
      const element = canvas;
      yRot = 2 * Math.PI * rotateDelta.x / element.clientHeight // yes, height
      xRot = 2 * Math.PI * rotateDelta.y / element.clientHeight
      rotateStart.copy(rotateEnd);
    }
    aircraft.followCam.rotation.y -= yRot
    aircraft.followCam.rotation.x -= xRot
  }
}

function onPointerUp(event) {

  if (event.isPrimary === false) return

  document.removeEventListener('pointermove', onPointerMove)
  document.removeEventListener('pointerup', onPointerUp)
}



//
// HUD
//

HUD.hud.homeButton.addEventListener('click', (e) => {
  if (cameraMode === CAMERA_FOLLOW) {
    HUD.toggleFollow()
  }
  camera = orbitCamera
  cameraMode = CAMERA_GHOST
  controls.enabled = true
  controls.reset()
  e.stopPropagation()
})

HUD.hud.settingsButton.addEventListener('click', (e) => {
  HUD.toggleSettings()
  showDatGui = !showDatGui
  if (showDatGui) {
    gui.show()
  } else {
    gui.hide()
  }
  e.stopPropagation()
})

HUD.hud.closeButton.addEventListener('click', (e) => {
  if (!HUD.isVisisble()) return
  console.log("click - HUD.closeButton")
  deselectAirCraftAndHideHUD()
  e.stopPropagation()
})

HUD.hud.infoButton.addEventListener('click', (e) => {
  if (!HUD.isVisisble()) return
  HUD.toggleDialog()
  e.stopPropagation()
})

//
// camera - toggle between orbit control camera and follow camera
//

const CAMERA_GHOST = "ghost"
const CAMERA_FOLLOW = "follow"

let cameraMode = CAMERA_GHOST

HUD.hud.cameraButton.addEventListener('click', (e) => {
  if (!HUD.isVisisble()) return
  if (cameraMode === CAMERA_GHOST) {
    console.log("INTERSECTED AIRCRAFT: ")
    console.log(UTILS.INTERSECTED?.aircraft)
    cameraMode = CAMERA_FOLLOW
    followCamera.position.copy(camera.position)
    followCamera.lookAt(camera.lookAt)
    camera = followCamera
    controls.enabled = false
  } else {
    const aircraft = UTILS.INTERSECTED?.aircraft
    const target = aircraft.followCamTarget.getWorldPosition(new THREE.Vector3())
    aircraft.resetFollowCameraTarget()
    resetGhostCamera(target)
    isFollowCamAttached = false
  }
  console.log(`toggle camera... -> ${cameraMode}`)
  HUD.toggleFollow()
  e.stopPropagation()
})


function resetGhostCamera(target) {
  orbitCamera.position.copy(camera.position)
  controls.target.set(target.x, target.y, target.z)
  controls.update()
  controls.enabled = true
  camera = orbitCamera
  cameraMode = CAMERA_GHOST
}

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



function updateCamera() {

  if (cameraMode === "follow" && UTILS.INTERSECTED?.aircraft) {
    const aircraft = UTILS.INTERSECTED?.aircraft
    const followCamPos = aircraft.followCam.getWorldPosition(new THREE.Vector3())
    const followCamTargetPos = aircraft.followCamTarget.getWorldPosition(new THREE.Vector3())
    camera.position.lerp(followCamPos, 0.05)
    camera.lookAt(followCamTargetPos)

    if (camera.position.distanceToSquared(followCamPos) < 1.0) {
      isFollowCamAttached = true
    }
    light.position.copy(camera.position)
    light.target.position.copy(followCamTargetPos)
  } else {
    controls.update()
  }
}


//
// handle page visibility
// https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API
//
function handleVisibilityChange() {
  if (document.visibilityState === "hidden") {
    console.log("pause simulation...")
    ADSB.close()
    window.cancelAnimationFrame(animationFrameRequestId)
  } else {
    console.log("resume simulation...")
    ADSB.start(scene, clock)
    animationFrameRequestId = window.requestAnimationFrame(animate)
  }
}
document.addEventListener('visibilitychange', handleVisibilityChange, false);



//
// load maps, origin, and start websocket connection
//

const loader = new THREE.FileLoader();
loader.load('data/sofla.json',
  (data) => {

    console.log('[ sofla.json - loaded... ]')

    //
    // init map and POI
    //

    MAPS.init(scene, JSON.parse(data))


    //
    // Starting parsing ADSB messages
    //

    ADSB.start(scene, clock)

    // enable HUD
    HUD.enableHUD()
  },
  (xhr) => {
    if (xhr.total > 0) {
      console.log('map.json - ' + (xhr.loaded / xhr.total * 100) + '% loaded')
    }
  },
  (err) => {
    console.error('[*** Error Loading map.json ***]')
    console.log(err)
    console.log('[***************]')
  }
);


//
// animate
//

const animate = function () {
  stats.begin()

  const elapsedTime = clock.getElapsedTime()
  const deltaTime = clock.getDelta()

  animationFrameRequestId = requestAnimationFrame(animate)

  updateCamera()

  draw(elapsedTime, deltaTime)

  renderer.render(scene, camera)

  stats.end()
}

animate()