import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Stats from 'stats.js'
import * as MAPS from './maps.js'
import * as UTILS from './utils.js'
import { HUD } from './HUD.js'
import * as AIRCRAFT from './aircraft.js'
import * as ADSB from './ADSB.js'

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

// Clock
let clock = new THREE.Clock()

// camera
const camera = new THREE.PerspectiveCamera(75, UTILS.sizes.width / UTILS.sizes.height, 0.1, 10000)
camera.position.z = 10
scene.add(camera)


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


//
// use geolocation to find origin for rendering POV
//
navigator.geolocation.getCurrentPosition((pos) => {
  console.log(`ORIGIN lat: ${pos.coords.latitude} lng: ${pos.coords.longitude}`)
  UTILS.initOrigin([pos.coords.longitude, pos.coords.latitude])
  MAPS.initGroundPlaneBoundariesAndPOI(scene)
}, (error) => {
  console.log("UNABLE TO GET GEOLOCATION | REASON -> " + error.message)
  // TODO this code does not work any more -- need to fix
  MAPS.setFallbackOrigin(UTILS.origin)
  console.log(`fallback location - HOME: ${UTILS.origin}`)
  MAPS.initGroundPlaneBoundariesAndPOI(scene)
})


//
// draw
//
function draw(elapsedTime, deltaTime) {

  HUD.update()

  raycaster.setFromCamera(pointer, camera)

  //
  // aircraft
  //

  for (const key in AIRCRAFT.aircrafts) {

    const aircraft = AIRCRAFT.aircrafts[key];

    const aircraftHasExpired = aircraft.draw(scene, elapsedTime, camera.position)

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
            isFollowCamAttached = false
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
        HUD.hide()
      }
      aircraft.remove(scene)
    }
  }

  for (const poiLabel of MAPS.poiLabels) {
    poiLabel.lookAt(camera.position)
  }

  if (pointer?.x && pointer?.y) {
    deselectAirCraftAndHideHUD()
    pointer.set(null, null)
  }
}

function deselectAirCraftAndHideHUD(animate = true) {
  if (UTILS.INTERSECTED?.key) {
    UTILS.INTERSECTED.mesh.material.color = AIRCRAFT.airCraftColor
    UTILS.INTERSECTED.key = null
    UTILS.INTERSECTED.mesh = null
    UTILS.INTERSECTED.aircraft = null
    if (cameraMode === CAMERA_FOLLOW) {
      resetGhostCamera(false)
    }
    isFollowCamAttached = false
    HUD.hide(animate)
  }
}

//
// window resize event listeners
//
window.addEventListener('resize', () => {
  UTILS.sizes.width = window.innerWidth
  UTILS.sizes.height = window.innerHeight

  console.log(`window resize - w: ${UTILS.sizes.width} h: ${UTILS.sizes.height}`)

  camera.aspect = UTILS.sizes.width / UTILS.sizes.height
  camera.updateProjectionMatrix()
  renderer.setSize(UTILS.sizes.width, UTILS.sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  deselectAirCraftAndHideHUD({ animate: false })

  HUD.toggleOrientation(UTILS.isLandscape())
})

//
// single click listener to check for airplane intersections
//

let ignoreTouchEndEvent = false

window.addEventListener('click', (event) => {

  console.log(`[click..]`)

  const clientX = event.clientX;
  const clientY = event.clientY;

  if (isClientXYInNavContainer(clientX, clientY)) {
    console.log("[click in nav container!!!]")
    return
  }

  if (ignoreTouchEndEvent) {
    ignoreTouchEndEvent = false
    return
  }

  if (event.pointerType === 'mouse' && numOrbitControlsActive > 0) {
    return
  }

  if (isClickDueToOrbitControlsInteraction) {
    isClickDueToOrbitControlsInteraction = false
    return
  }

  pointer.set(
    (clientX / window.innerWidth) * 2 - 1,
    -(clientY / window.innerHeight) * 2 + 1
  )
  console.log(`click`, pointer, event)
})


window.addEventListener('touchend', (event) => {

  const clientX = event.changedTouches[0].clientX
  const clientY = event.changedTouches[0].clientY

  if (isClientXYInNavContainer(clientX, clientY)) {
    console.log("[touchend in nav container!!!]")
    return
  }

  if (numOrbitControlsActive > 0) {
    return
  }

  if (isClickDueToOrbitControlsInteraction) {
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

const navContainer = document.getElementById("nav")
function isClientXYInNavContainer(clientX, clientY) {
  const navRect = navContainer.getBoundingClientRect()
  return (clientX >= navRect.left) && (clientY <= navRect.bottom)
}


//
// home - reset orbit controls to initial pos + look-at
//
const homeButton = document.getElementById("home")
console.log(homeButton)
homeButton.addEventListener('click', () => {
  cameraMode = CAMERA_GHOST
  controls.enabled = true
  controls.reset()
})

function resetGhostCamera(hardReset = true) {

  cameraMode = CAMERA_GHOST
  controls.enabled = true

  if (hardReset) {
    controls.reset()
  }
}

//
// camera - toggle between orbit control camera and follow camera
//

const CAMERA_GHOST = "ghost"
const CAMERA_FOLLOW = "follow"

let cameraMode = CAMERA_GHOST

const cameraButton = document.getElementById("camera")
cameraButton.addEventListener('click', () => {
  if (UTILS.INTERSECTED?.aircraft) {
    console.log("INTERSECTED AIRCRAFT: ")
    console.log(UTILS.INTERSECTED?.aircraft)
    cameraMode = CAMERA_FOLLOW
    controls.enabled = false
  } else {
    resetGhostCamera(false)
  }
  console.log(`toggle camera... -> ${cameraMode}`)
})

let isFollowCamAttached = false

function updateCamera() {
  if (cameraMode == "follow" && UTILS.INTERSECTED?.aircraft) {
    const aircraft = UTILS.INTERSECTED?.aircraft

    const followCamPos = aircraft.followCam.getWorldPosition(new THREE.Vector3())

    if (!isFollowCamAttached) {
      if (camera.position.distanceToSquared(followCamPos) > 1.0) {
        camera.position.lerp(followCamPos, 0.05)
      } else {
        isFollowCamAttached = true
      }

    } else {
      camera.position.copy(followCamPos)
    }


    const aircraftPos = aircraft.group.position.clone()
    camera.lookAt(aircraftPos)
    controls.target.copy(aircraftPos)

    light.position.copy(camera.position)
    light.target.position.copy(controls.target)
  } else {
    controls.update()
  }
}

//
// fullscreen toggle on double click event listener
//
const fullscreenButton = document.getElementById("full-screen")
console.log(fullscreenButton)
fullscreenButton.addEventListener('click', () => {
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
    animationFrameRequestId = window.requestAnimationFrame(tick)
  }
}
document.addEventListener('visibilitychange', handleVisibilityChange, false);


//
// Starting parsing ADSB messages
//

ADSB.start(scene, clock)

//
// tick
//

const tick = function () {
  stats.begin()

  const elapsedTime = clock.getElapsedTime()
  const deltaTime = clock.getDelta()

  animationFrameRequestId = requestAnimationFrame(tick)

  updateCamera()

  draw(elapsedTime, deltaTime)

  renderer.render(scene, camera)

  stats.end()
}

tick()