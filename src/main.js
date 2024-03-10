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
  longitude: "",
  latitude: "",
  "show stats": false,
  skybox: 'dawn+dusk',
  "show map": true,
  "show grid": false,
  poi: []
}

console.log(settings)

const latitudeController = gui.add(settings, 'latitude')
const longitudeController = gui.add(settings, 'longitude')

const reloadMapButton = {
  "set origin": function () {

    UTILS.initOrigin([
      settings.longitude,
      settings.latitude,
    ])

    reloadMap()
  }
}
gui.add(reloadMapButton, "set origin")

const showMapController = gui.add(settings, 'show map').onChange(visible => {
  if (mapGroup !== undefined) {
    mapGroup.visible = visible
  }
})
const showGridController = gui.add(settings, 'show grid').onChange(isVisible => {
  console.log(`show grid: ${isVisible}`)
  polarGridHelper.visible = isVisible
})

gui.add(settings, 'skybox', ['dawn+dusk', 'day', 'night']).onChange(timeOfDay => {
  skybox.setTexture(timeOfDay)
})

gui.add(settings, 'show stats').onChange(showStats => {
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
controls.addEventListener('change', (event) => {
  light.position.copy(camera.position)
  light.target.position.copy(controls.target)
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
const radius = 500
const radials = 16
const circles = 5
const divisions = 64
const color1 = "#81efff"
const color2 = color1
const polarGridHelper = new THREE.PolarGridHelper(radius, radials, circles, divisions, color1, color2)
polarGridHelper.visible = false
scene.add(polarGridHelper)




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

  for (const key in AIRCRAFT.aircraft) {

    const aircraft = AIRCRAFT.aircraft[key];

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

window.addEventListener('resize', () => {
  UTILS.sizes.width = window.innerWidth
  UTILS.sizes.height = window.innerHeight

  console.log(`window resize - w: ${UTILS.sizes.width} h: ${UTILS.sizes.height}`)

  orbitCamera.aspect = UTILS.sizes.width / UTILS.sizes.height
  orbitCamera.updateProjectionMatrix()

  followCamera.aspect = UTILS.sizes.width / UTILS.sizes.height
  followCamera.updateProjectionMatrix()

  renderer.setSize(UTILS.sizes.width, UTILS.sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})


let isFollowCamAttached = false

const pointerStart = new THREE.Vector2()
const pointerEnd = new THREE.Vector2()
const rotateStart = new THREE.Vector2()
const rotateEnd = new THREE.Vector2()
const rotateDelta = new THREE.Vector2()

function onPointerDown(event) {

  if (event.isPrimary === false) return

  pointerStart.set(event.clientX, event.clientY)

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
  if (event.isPrimary === false) return

  if (isFollowCamAttached) {
    const aircraft = UTILS.INTERSECTED?.aircraft

    if (event.pointerType === 'touch') {
      rotateEnd.set(event.pageX, event.pageY)
    } else {
      rotateEnd.set(event.clientX, event.clientY)
    }
    rotateDelta.subVectors(rotateEnd, rotateStart).multiplyScalar(1.0)
    rotateStart.copy(rotateEnd);

    aircraft.followCam.rotation.y -= 2 * Math.PI * rotateDelta.x / canvas.clientHeight
    aircraft.followCam.rotation.x -= 2 * Math.PI * rotateDelta.y / canvas.clientHeight
  }
}

function onPointerUp(event) {
  if (event.isPrimary === false) return

  pointerEnd.set(event.clientX, event.clientY)

  const isClick = pointerStart.distanceToSquared(pointerEnd) === 0
  const notInHUD = !HUD.isClientXYInHUDContainer(event.clientX, event.clientY)

  if (isClick && notInHUD) {
    pointer.set(
      (pointerEnd.x / window.innerWidth) * 2 - 1,
      -(pointerEnd.y / window.innerHeight) * 2 + 1
    )
  }

  document.removeEventListener('pointermove', onPointerMove)
  document.removeEventListener('pointerup', onPointerUp)
}



//
// HUD
//

function resetCameraToHome() {
  if (cameraMode === CAMERA_FOLLOW) {
    HUD.toggleFollow()
  }
  camera = orbitCamera
  cameraMode = CAMERA_GHOST
  controls.enabled = true
  controls.reset()
}


HUD.hud.homeButton.addEventListener('click', (e) => {
  resetCameraToHome()
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
  if (!HUD.isVisible()) return
  console.log("click - HUD.closeButton")
  deselectAirCraftAndHideHUD()
  e.stopPropagation()
})

HUD.hud.infoButton.addEventListener('click', (e) => {
  if (!HUD.isVisible()) return
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
  if (!HUD.isVisible()) return
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
  rotateStart.set(0, 0)
  rotateEnd.set(0, 0)
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

let mapGroup = undefined
let poi = undefined
let poiController = undefined

function loadFallbackGridPlane() {
  gui.remove(showMapController)
  showGridController.setValue(true)

  //
  // Fallback to default origin
  //
  UTILS.initOrigin([
    import.meta.env.VITE_DEFAULT_ORIGIN_LONGITUDE,
    import.meta.env.VITE_DEFAULT_ORIGIN_LATITUDE,
  ])
  console.error(`FALL BACK TO DEFAULT ORIGIN: `)
  console.error(UTILS.origin)

  longitudeController.setValue(import.meta.env.VITE_DEFAULT_ORIGIN_LONGITUDE)
  latitudeController.setValue(import.meta.env.VITE_DEFAULT_ORIGIN_LATITUDE)

  //
  // Starting parsing ADSB messages
  //

  ADSB.start(scene, clock)

  // enable HUD
  HUD.enableHUD()

  resetCameraToHome()
}

if (import.meta.env.VITE_OPTIONAL_GEOJSON_MAP) {

  const loader = new THREE.FileLoader()
  loader.load(`geojson/${import.meta.env.VITE_OPTIONAL_GEOJSON_MAP}`,
    (data) => {

      console.log(`[ ${import.meta.env.VITE_OPTIONAL_GEOJSON_MAP} - loaded... ]`)

      //
      // init map and POI
      //

      const res = MAPS.init(scene, JSON.parse(data))
      console.log(res)
      mapGroup = res.mapGroup
      poi = res.poi

      console.log(Object.keys(poi))

      poiController = gui.add(settings, 'poi', Object.keys(poi)).onChange(key => {
        if (key !== MAPS.POI_KEY_CURRENT_LNG_LAT) {
          console.log(poi[key])
          const lng = poi[key].longitude
          const lat = poi[key].latitude
          UTILS.initOrigin([
            lng, lat
          ])
          longitudeController.setValue(lng)
          latitudeController.setValue(lat)
        }
        reloadMap()
      })
      poiController.setValue(res.originId)


      //
      // Starting parsing ADSB messages
      //

      ADSB.start(scene, clock)

      // enable HUD
      HUD.enableHUD()
    },
    (xhr) => {
      if (xhr.total > 0) {
        console.log(`${import.meta.env.VITE_OPTIONAL_GEOJSON_MAP} - ` + (xhr.loaded / xhr.total * 100) + '% loaded')
      }
    },
    (err) => {
      console.error(`[*** Error Loading Map ***]`)
      console.error(`\tunable to load: 'geojson/${import.meta.env.VITE_OPTIONAL_GEOJSON_MAP}'`)
      console.error(err)
      console.error('[***************]')

      loadFallbackGridPlane()
    }
  )
} else {
  loadFallbackGridPlane()
}

function reloadMap() {
  console.log('[reloadMap...]')
  scene.remove(mapGroup)
  mapGroup = undefined
  const loader = new THREE.FileLoader();
  loader.load(`geojson/${import.meta.env.VITE_OPTIONAL_GEOJSON_MAP}`,
    (data) => {

      console.log(`[ ${import.meta.env.VITE_OPTIONAL_GEOJSON_MAP} - loaded... ]`)

      //
      // init map and POI
      //

      const res = MAPS.init(scene, JSON.parse(data), true)
      mapGroup = res.mapGroup
      console.log(res)

      resetCameraToHome()
    },
    (xhr) => {
      if (xhr.total > 0) {
        console.log(`${import.meta.env.VITE_OPTIONAL_GEOJSON_MAP} - ` + (xhr.loaded / xhr.total * 100) + '% loaded')
      }
    },
    (err) => {
      console.error(`[*** Error Loading Map ***]`)
      console.error(`\tunable to load: 'geojson/${import.meta.env.VITE_OPTIONAL_GEOJSON_MAP}'`)
      console.error(err)
      console.error('[***************]')

      loadFallbackGridPlane()
    }
  )
}




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