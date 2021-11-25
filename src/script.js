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
pointer.x = undefined
pointer.y = undefined
const raycaster = new THREE.Raycaster()

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, UTILS.sizes.width / UTILS.sizes.height, 0.1, 10000)
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

// Clock
let clock = new THREE.Clock()


// controls
const controls = new OrbitControls(camera, renderer.domElement)
//
// track if mouse click causes camera changes via OrbitControls
// used to help toggle display of HUD and prevent the HUD
// from toggling while user pans the camera around using a mouse
// see:
// https://www.html5rocks.com/en/mobile/touchandmouse/
//
let isClickDueToOrbitControlsInteraction = false
controls.addEventListener('change', (event) => {
  isClickDueToOrbitControlsInteraction = true
  light.position.copy(camera.position)
  light.target.position.copy(controls.target)
})
controls.addEventListener('start', (event) => {
  if (isClickDueToOrbitControlsInteraction) {
    isClickDueToOrbitControlsInteraction = false
  }
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
  UTILS.origin.lat = pos.coords.latitude
  UTILS.origin.lng = pos.coords.longitude
  MAPS.initGroundPlaneBoundariesAndPOI(scene)

}, (error) => {
  console.log("UNABLE TO GET GEOLOCATION | REASON -> " + error.message)
  MAPS.setFallbackOrigin(UTILS.origin)
  console.log(`fallback location - HOME: ${UTILS.origin}`)
  MAPS.initGroundPlaneBoundariesAndPOI(scene)
})


//
// websocket
//
const websocket = new WebSocket(UTILS.DATA_HOSTS["adsb"])

const handleADSBMessage = (event) => {
  const reader = new FileReader()
  reader.onload = () => {
    const result = reader.result

    // parse SBS data here...

    let data = result.split(",")
    let hexIdent = data[ADSB.HEX_IDENT]

    if (!(hexIdent in AIRCRAFT.aircrafts)) {
      const aircraft = new AIRCRAFT.Aircraft(scene)
      aircraft.hex = hexIdent
      AIRCRAFT.aircrafts[hexIdent] = aircraft
    }

    AIRCRAFT.aircrafts[hexIdent].update(data, clock.getElapsedTime())
    //aircrafts[hexIdent].log()
  }
  reader.readAsText(event.data)
}

websocket.addEventListener('message', handleADSBMessage);


//
// draw
//
function draw(elapsedTime, deltaTime) {

  raycaster.setFromCamera(pointer, camera)

  //
  // aircraft
  //

  for (const key in AIRCRAFT.aircrafts) {

    const ac = AIRCRAFT.aircrafts[key];

    ac.draw(scene, elapsedTime, camera.position)

    if (pointer.x !== undefined && pointer.y !== undefined) {

      const groupIntersect = raycaster.intersectObject(ac.group, true)

      if (groupIntersect.length > 0) {

        console.log("---------------")
        console.log(`key: ${key}`)
        console.log(ac)
        console.log(groupIntersect)
        console.log(`hasValidTelemetry: ${ac.hasValidTelemetry()}`)
        console.log("---------------")
        pointer.x = undefined
        pointer.y = undefined

        if (ac.hasValidTelemetry() && key !== UTILS.INTERSECTED.key) {

          if (UTILS.INTERSECTED.key !== null) {
            UTILS.INTERSECTED.mesh.material.color = AIRCRAFT.airCraftColor
          }

          UTILS.INTERSECTED.key = key
          UTILS.INTERSECTED.mesh = ac.mesh
          UTILS.INTERSECTED.mesh.material.color = AIRCRAFT.airCraftSelectedColor

          HUD.reset()
          HUD.show()
          ac.fetchInfo()

          console.log(UTILS.INTERSECTED)
        }
      }
    }
  }

  for (const poiLabel of MAPS.poiLabels) {
    poiLabel.lookAt(camera.position)
  }

  if (pointer.x !== undefined && pointer.y !== undefined) {
    deselectAirCraftAndHideHUD()
    pointer.x = undefined
    pointer.y = undefined
  }
}

function deselectAirCraftAndHideHUD(animate = true) {
  if (UTILS.INTERSECTED.key !== null) {
    UTILS.INTERSECTED.mesh.material.color = AIRCRAFT.airCraftColor
    UTILS.INTERSECTED.key = null
    UTILS.INTERSECTED.mesh = null
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
window.addEventListener('click', (event) => {
  if (event.pointerType === 'mouse' && isClickDueToOrbitControlsInteraction) {
    isClickDueToOrbitControlsInteraction = false
    return
  }
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;
  console.log(`click`, pointer, event)
})

//
// fullscreen toggle on double click event listener
//
const fullscreenButton = document.getElementById("fullscreen_button")
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
    websocket.removeEventListener('message', handleADSBMessage)
    window.cancelAnimationFrame(animationFrameRequestId)
  } else {
    console.log("resume simulation...")
    websocket.addEventListener('message', handleADSBMessage)
    animationFrameRequestId = window.requestAnimationFrame(tick)
  }
}

document.addEventListener('visibilitychange', handleVisibilityChange, false);


//
// tick
//

const tick = function () {
  stats.begin()

  const elapsedTime = clock.getElapsedTime()
  const deltaTime = clock.getDelta()

  animationFrameRequestId = requestAnimationFrame(tick)

  controls.update()

  draw(elapsedTime, deltaTime)

  renderer.render(scene, camera)

  stats.end()
}

tick()