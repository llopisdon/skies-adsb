import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Stats from 'stats.js'
import { Text } from 'troika-three-text'

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

const origin = {
  lat: 0,
  lng: 0
}

let MIA_distance = 0.0;

let theta = 0.0;


const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 10000)
camera.position.z = 10
scene.add(camera)


// renderer
const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

// stats
const stats = new Stats()
stats.showPanel(0)
document.body.appendChild(stats.dom)

// controls
const controls = new OrbitControls(camera, renderer.domElement)

// window resize event listeners
window.addEventListener('resize', () => {
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight
  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

// fullscreen toggle on double click event listener
window.addEventListener('dblclick', () => {
  const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement

  if (!fullscreenElement) {
    if (renderer.domElement.requestFullscreen) {
      renderer.domElement.requestFullscreen()
    }
    else if (renderer.domElement.webkitRequestFullscreen) {
      renderer.domElement.webkitRequestFullscreen()
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


const airCraftGeometry = new THREE.BufferGeometry()
const airCraftVertices = new Float32Array([
  0, 0, -3,
  1.5, 0, 1,
  -1.5, 0, 1
])
airCraftGeometry.setAttribute('position', new THREE.BufferAttribute(airCraftVertices, 3))
const airCraftMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide })

const airCraftHeightLineMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff })

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

const aircrafts = {}

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
    this.screen_pos = null

    // aircraft mesh
    this.mesh = new THREE.Mesh(airCraftGeometry, airCraftMaterial)
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
    this.text.anchorX = -1
    this.text.anchorY = 1
    this.text.color = 0xED225D
    this.text.font = "/Orbitron-VariableFont_wght.ttf"
    scene.add(this.text)

    scene.add(this.mesh)
  }

  clear() {
    console.log(`*** CLEAR -- ${this.hex} | ${this.callsign}`)
    scene.remove(this.text)
    this.text.dispose()
    //this.myText.dispose()
    scene.remove(this.mesh)
    //this.mesh.dispose()
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

      // TODO port this
      //this.screen_pos = screenPosition([this.pos.x, this.pos.y, this.pos.z]);

      // position is in world coordinates
      const xPos = this.pos.x * SCALE
      const yPos = this.pos.y * SCALE
      const zPos = this.pos.z * SCALE
      this.mesh.position.set(xPos, yPos, zPos)
      this.heightLinePos.setY(1, -yPos)
      this.heightLinePos.needsUpdate = true

      this.text.text = `${this.callsign || this.hex}\n${this.hdg}\n${this.spd}\n${this.alt}`
      this.text.position.set(xPos, yPos, zPos)
      this.text.sync()

    } else {
      //this.log()
    }

    this.ttl = 10
  }

  updateText() {
    this.text.rotation.y = Math.atan2(
      (camera.position.x - this.text.position.x),
      (camera.position.z - this.text.position.z)
    )
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


//
// map of Miami from Aventura down to Homestead and the start
// of Key Largo
//

const miami_zones = {
  miami: [

    25.948669112748266, -80.43271670476722,
    25.8928534282351, -80.48375193552148,

    25.8928534282351, -80.48375193552148,
    25.431235820739357, -80.47575511939485,

    25.431235820739357, -80.47575511939485,
    25.256592897804143, -80.43642705362019,

    25.256592897804143, -80.43642705362019,
    25.36851626011684, -80.32426923641101,

    25.36851626011684, -80.32426923641101,
    25.535111743711642, -80.33737859166922,

    25.535111743711642, -80.33737859166922,
    25.570518093399123, -80.30418133812982,

    25.570518093399123, -80.30418133812982,
    25.60356116306042, -80.30890293558856,

    25.60356116306042, -80.30890293558856,
    25.628735188777313, -80.29919230212914,

    25.628735188777313, -80.29919230212914,
    25.633331611781017, -80.28122763010862,

    25.633331611781017, -80.28122763010862,
    25.7035691865122, -80.2482114753804,

    25.7035691865122, -80.2482114753804,
    25.713849718181162, -80.25088189959969,

    25.713849718181162, -80.25088189959969,
    25.757773991460517, -80.1911635250368,

    25.757773991460517, -80.1911635250368,
    25.770487756321238, -80.18803413298363,

    25.770487756321238, -80.18803413298363,
    25.77168581052713, -80.18503005900213,

    25.77168581052713, -80.18503005900213,
    25.789979650723467, -80.18551687068077,

    25.789979650723467, -80.18551687068077,
    25.803176671047787, -80.18549348712156,

    25.803176671047787, -80.18549348712156,
    25.81431102610217, -80.18573696686298,

    25.81431102610217, -80.18573696686298,
    25.82226912020597, -80.17822678190922,

    25.82226912020597, -80.17822678190922,
    25.83324020812688, -80.18148708056135,

    25.83324020812688, -80.18148708056135,
    25.8445349472668, -80.1737802766347,

    25.8445349472668, -80.1737802766347,
    25.857314855516805, -80.17138211132766,

    25.857314855516805, -80.17138211132766,
    25.86797158446253, -80.17115497540321,

    25.86797158446253, -80.17115497540321,
    25.87071260695447, -80.16516095745702,

    25.87071260695447, -80.16516095745702,
    25.87899759507804, -80.16354110102078,

    25.87899759507804, -80.16354110102078,
    25.900003273685183, -80.14359217677391,

    25.900003273685183, -80.14359217677391,
    25.91224373504403, -80.12902627394939,

    25.91224373504403, -80.12902627394939,
    25.929597147757274, -80.1312082872461,

    25.929597147757274, -80.1312082872461,
    25.953248113399685, -80.11937213362876,

    25.953248113399685, -80.11937213362876,
    25.948669112748266, -80.43271670476722,

  ],

  miami_beach: [
    25.898697287719266, -80.12260058222626,
    25.83687151441013, -80.12029099140425,

    25.83687151441013, -80.12029099140425,
    25.766433909560874, -80.13097284895602,

    25.766433909560874, -80.13097284895602,
    25.774753444398414, -80.14136600765507,

    25.774753444398414, -80.14136600765507,
    25.811144549390278, -80.14540779159357,

    25.811144549390278, -80.14540779159357,
    25.848563740937582, -80.13212764436705,

    25.848563740937582, -80.13212764436705,
    25.856617713526198, -80.14569649044633,

    25.856617713526198, -80.14569649044633,
    25.893503089830137, -80.1376129225693,

    25.893503089830137, -80.1376129225693,
    25.898697287719266, -80.12260058222626,
  ],
  dodge_island: [
    25.78021282215412, -80.17976295507094,
    25.767213890726424, -80.14511909274083,

    25.767213890726424, -80.14511909274083,
    25.767473883309304, -80.16417321702238,

    25.767473883309304, -80.16417321702238,
    25.777613149792064, -80.18236124474569,

    25.777613149792064, -80.18236124474569,
    25.78021282215412, -80.17976295507094,
  ],
  fisher_island: [
    25.76352841318556, -80.14845094861667,
    25.763911021820963, -80.1385582407135,

    25.763911021820963, -80.1385582407135,
    25.762489897816412, -80.13424914708693,

    25.762489897816412, -80.13424914708693,
    25.75691455475821, -80.13722302860386,

    25.75691455475821, -80.13722302860386,
    25.756313276633175, -80.13989345282312,

    25.756313276633175, -80.13989345282312,
    25.76216194370716, -80.14845094861667,

    25.76216194370716, -80.14845094861667,
    25.76352841318556, -80.14845094861667,
  ],
  virginia_key: [
    25.75680278287766, -80.14822543312141,
    25.748275273258145, -80.14434117983555,

    25.748275273258145, -80.14434117983555,
    25.740840534617853, -80.14652607230883,

    25.740840534617853, -80.14652607230883,
    25.732530570366638, -80.1654618070774,

    25.732530570366638, -80.1654618070774,
    25.741496559681405, -80.16157755379155,

    25.741496559681405, -80.16157755379155,
    25.748275273258145, -80.16716116788996,

    25.748275273258145, -80.16716116788996,
    25.74652596484437, -80.15817883216641,

    25.74652596484437, -80.15817883216641,
    25.75680278287766, -80.14822543312141,
  ],
  key_biscayne: [
    25.72793797246458, -80.15380904721982,
    25.725094846768428, -80.14846819895178,

    25.725094846768428, -80.14846819895178,
    25.70825340104827, -80.15308074972872,

    25.70825340104827, -80.15308074972872,
    25.701253657459755, -80.15769330050568,

    25.701253657459755, -80.15769330050568,
    25.68397127826974, -80.15745053467532,

    25.68397127826974, -80.15745053467532,
    25.673906965623583, -80.15453734471092,

    25.673906965623583, -80.15453734471092,
    25.672156563617833, -80.1533235155591,

    25.672156563617833, -80.1533235155591,
    25.66624876708588, -80.1589071296575,

    25.66624876708588, -80.1589071296575,
    25.68594028348931, -80.17444414280094,

    25.68594028348931, -80.17444414280094,
    25.69906615317391, -80.16886052870252,

    25.69906615317391, -80.16886052870252,
    25.70934707379787, -80.17395861114022,

    25.70934707379787, -80.17395861114022,
    25.72793797246458, -80.15380904721982,
  ],

  watson_island: [
    25.787344312312538, -80.17862464704623,
    25.78696177923357, -80.17352656444582,

    25.78696177923357, -80.17352656444582,
    25.781770136874332, -80.17249480963383,

    25.781770136874332, -80.17249480963383,
    25.783682873656364, -80.1777142751533,

    25.783682873656364, -80.1777142751533,
    25.787344312312538, -80.17862464704623,
  ],

  star_island: [
    25.781496886244728, -80.16763949287153,
    25.78264453465905, -80.16703257827623,

    25.78264453465905, -80.16703257827623,
    25.77854573933698, -80.15677572161587,

    25.77854573933698, -80.15677572161587,
    25.77723409492376, -80.1574433276707,

    25.77723409492376, -80.1574433276707,
    25.781496886244728, -80.16763949287153,
  ],

  palm_island: [
    25.784338662023856, -80.16521183449038,
    25.785704876143512, -80.16436215405697,

    25.785704876143512, -80.16436215405697,
    25.781715486798767, -80.15586534972294,

    25.781715486798767, -80.15586534972294,
    25.780677130579203, -80.15665433869681,

    25.780677130579203, -80.15665433869681,
    25.784338662023856, -80.16521183449038,
  ],

  hibisbus_island: [
    25.780130623654948, -80.15234524507028,
    25.78034922672676, -80.14997827814864,

    25.78034922672676, -80.14997827814864,
    25.775102641824656, -80.1490072147962,

    25.775102641824656, -80.1490072147962,
    25.77482937583766, -80.15143487317734,

    25.77482937583766, -80.15143487317734,
    25.780130623654948, -80.15234524507028,
  ],

  fpl_island: [
    25.77165078406918, -80.15044488404715,
    25.771938027232576, -80.14766346397104,

    25.771938027232576, -80.14766346397104,
    25.769858371024476, -80.14625999512529,

    25.769858371024476, -80.14625999512529,
    25.77165078406918, -80.15044488404715,
  ],

  coast_guard_island: [
    25.772190800641244, -80.14642585962524,
    25.77242059418189, -80.1453668785871,

    25.77242059418189, -80.1453668785871,
    25.770226047702163, -80.14381030404908,

    25.770226047702163, -80.14381030404908,
    25.769651552392702, -80.14461410893347,

    25.769651552392702, -80.14461410893347,
    25.769996249912094, -80.14509894362564,

    25.769996249912094, -80.14509894362564,
    25.772190800641244, -80.14642585962524,
  ],

  flagler_island: [
    25.7859830396654, -80.15264102905283,
    25.785615939550624, -80.15193292590007,

    25.785615939550624, -80.15193292590007,
    25.785316462299605, -80.15196511240701,

    25.785316462299605, -80.15196511240701,
    25.784582256807223, -80.1528985211084,

    25.784582256807223, -80.1528985211084,
    25.785113590183766, -80.15332767453434,

    25.785113590183766, -80.15332767453434,
    25.78542272850749, -80.15335986104128,

    25.78542272850749, -80.15335986104128,
    25.78563526063762, -80.15282341925887,

    25.78563526063762, -80.15282341925887,
    25.7859830396654, -80.15264102905283,
  ],

  biscayne_island: [
    25.790875864787118, -80.17910386657958,
    25.791070820388644, -80.17192248238817,

    25.791070820388644, -80.17192248238817,
    25.78964113853367, -80.17188639503041,

    25.78964113853367, -80.17188639503041,
    25.789348701485196, -80.1746290342191,

    25.789348701485196, -80.1746290342191,
    25.78973861738956, -80.17455685950361,

    25.78973861738956, -80.17455685950361,
    25.78967363149453, -80.17932039072605,

    25.78967363149453, -80.17932039072605,
    25.790875864787118, -80.17910386657958,
  ],

  san_marco_island: [
    25.791200790611555, -80.17044290072059,
    25.791298268185276, -80.16636502929532,

    25.791298268185276, -80.16636502929532,
    25.78999856061349, -80.16640111665308,

    25.78999856061349, -80.16640111665308,
    25.789771110323706, -80.17051507543609,

    25.789771110323706, -80.17051507543609,
    25.791200790611555, -80.17044290072059,
  ],

  san_marino_island: [
    25.79272793005909, -80.1639110889686,
    25.792987866729447, -80.16214280843907,

    25.792987866729447, -80.16214280843907,
    25.788796318425884, -80.16196237165033,

    25.788796318425884, -80.16196237165033,
    25.78895878429868, -80.16380282689538,

    25.78895878429868, -80.16380282689538,
    25.79272793005909, -80.1639110889686,
  ],

  venitian_1_island: [
    25.794872390545756, -80.16015800376304,
    25.794937373591317, -80.15824537380252,

    25.794937373591317, -80.15824537380252,
    25.787236634721758, -80.15784841286732,

    25.787236634721758, -80.15784841286732,
    25.7871066601538, -80.15965278075461,

    25.7871066601538, -80.15965278075461,
    25.794872390545756, -80.16015800376304,
  ],

  venitian_2_island: [
    25.79360521403752, -80.1559357829068,
    25.793800165151154, -80.15445620123921,

    25.793800165151154, -80.15445620123921,
    25.78895878429868, -80.15402315294627,

    25.78895878429868, -80.15402315294627,
    25.788698838795362, -80.15582752083355,

    25.788698838795362, -80.15582752083355,
    25.79360521403752, -80.1559357829068,
  ],

  belle_isle: [
    25.79264195550039, -80.14957097425284,
    25.792739431889267, -80.14801921786977,

    25.792739431889267, -80.14801921786977,
    25.792089587783085, -80.1469365971374,

    25.792089587783085, -80.1469365971374,
    25.790367483676214, -80.14596223847826,

    25.790367483676214, -80.14596223847826,
    25.789392696681027, -80.1473335580726,

    25.789392696681027, -80.1473335580726,
    25.789977569839742, -80.1494627121796,

    25.789977569839742, -80.1494627121796,
    25.791602202366022, -80.15011228461901,

    25.791602202366022, -80.15011228461901,
    25.79264195550039, -80.14957097425284,
  ],

  MIA: [

    25.80725733784828, -80.32027718094126,
    25.807566418429847, -80.26551720379271,

    25.807566418429847, -80.26551720379271,
    25.786778953538978, -80.26577469584825,

    25.786778953538978, -80.26577469584825,
    25.785001417500574, -80.32044884231163,

    25.785001417500574, -80.32044884231163,
    25.80725733784828, -80.32027718094126,

  ],

  OPF: [
    25.91290396499723, -80.29212383026062,
    25.914432461193798, -80.26007873962944,

    25.914432461193798, -80.26007873962944,
    25.898600647846294, -80.25983597379131,

    25.898600647846294, -80.25983597379131,
    25.899692565254608, -80.29151691566534,

    25.899692565254608, -80.29151691566534,
    25.91290396499723, -80.29212383026062,
  ],

  MEA: [

    25.654181615486056, -80.44725057017055,
    25.65561292662431, -80.41693718966411,

    25.65561292662431, -80.41693718966411,
    25.641949710878553, -80.4162154425092,

    25.641949710878553, -80.4162154425092,
    25.641299042536232, -80.44696187130859,

    25.641299042536232, -80.44696187130859,
    25.654181615486056, -80.44725057017055,
  ],

  HAFB: [
    25.503383951489532, -80.40926842686983,
    25.5027325297022, -80.37014973107341,

    25.5027325297022, -80.37014973107341,
    25.478497129446772, -80.38934820539417,

    25.478497129446772, -80.38934820539417,
    25.477975884365364, -80.41085627061064,

    25.477975884365364, -80.41085627061064,
    25.503383951489532, -80.40926842686983,
  ],

  HX51: [
    25.503645481454456, -80.55762728482092,
    25.50346123230872, -80.5431332792867,

    25.50346123230872, -80.5431332792867,
    25.499545871143113, -80.54282706790218,

    25.499545871143113, -80.54282706790218,
    25.499407679593816, -80.55558587559075,

    25.499407679593816, -80.55558587559075,
    25.491023761589204, -80.55548380512924,

    25.491023761589204, -80.55548380512924,
    25.491069828671073, -80.55752521435942,

    25.491069828671073, -80.55752521435942,
    25.503645481454456, -80.55762728482092,
  ]
}


const mia_poi = {
  MIA: [
    25.799740325918425, -80.28758238380416,
  ],

  HX51: [
    25.502903180543875, -80.55383172752417,
  ],


  OPF: [
    25.90416305, -80.273665572,
  ],

  B2121: [
    25.797851473225546, -80.18387284800328,
  ],

  MEA: [
    25.649205063859373, -80.42923599495592,
  ],

  HAFB: [
    25.496127474507176, -80.39529010255902,
  ],

  HOME: [
    25.766529, -80.256884,
  ],

};




const miami_map = {}
const poiVertices = []
const poiLabels = []


navigator.geolocation.getCurrentPosition((pos) => {

  console.log(`ORIGIN lat: ${pos.coords.latitude} lng: ${pos.coords.longitude}`)

  origin.lat = pos.coords.latitude
  origin.lng = pos.coords.longitude

  // TODO start websocket connection once geolocation has been updated
  // TODO update geometries once geolocation has been updated

  // const { x, y } = getXY(origin, { latitude: 25.799740325918425, longitude: -80.28758238380416 })
  // console.log(`mia: ${x} ${y}`)

  for (const key in miami_zones) {
    const zone = miami_zones[key]
    miami_map[key] = []
    let points = []
    for (let i = 0; i < zone.length; i += 2) {
      const { x, y } = getXY(origin, { lat: zone[i], lng: zone[i + 1] })
      points.push(new THREE.Vector3(x * SCALE, 0, y * SCALE))
    }
    let geometry = new THREE.BufferGeometry().setFromPoints(points)
    let lineSegments = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({
      color: new THREE.Color('#81efff')
    }))
    scene.add(lineSegments)
  }


  // fill('#ED225D');
  // points of interest (poi)

  for (const key in mia_poi) {
    const ref_pt = mia_poi[key]
    console.log(`${key} -> ${ref_pt}`)
    const { x, y } = getXY(origin, { lat: ref_pt[0], lng: ref_pt[1] })
    poiVertices.push(new THREE.Vector3(x * SCALE, 0, y * SCALE))

    const label = new Text()
    label.text = key
    label.fontSize = 1
    label.anchorX = 'center'
    label.color = 0xED225D
    label.font = "/Orbitron-VariableFont_wght.ttf"

    label.position.x = x * SCALE
    label.position.y = 1.75
    label.position.z = y * SCALE

    poiLabels.push(label)
    scene.add(label)
  }
  const poiGeometry = new THREE.BufferGeometry().setFromPoints(poiVertices)
  const poiMaterial = new THREE.PointsMaterial({ color: 0xff0000 })
  const poiMesh = new THREE.Points(poiGeometry, poiMaterial)
  scene.add(poiMesh)

}, (error) => {
  console.log("UNABLE TO GET GEOLOCATION | REASON -> " + error.message)
})


//const s = new WebSocket('wss://' + self.location.host + ':30006');
//const s = new WebSocket('wss://raspberrypi.local:30006');
const s = new WebSocket('ws://192.168.86.34:30006')
s.addEventListener('message', (event) => {
  const reader = new FileReader()
  reader.onload = () => {
    const result = reader.result

    // TODO parse SBS data here...

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


function draw(deltaTime) {


  //
  // aircraft
  //


  for (const key in aircrafts) {
    const ac = aircrafts[key];
    // TODO
    // draw height reference
    /*
    stroke(0, 0, 255);
    line(ac.pos.x, 0, ac.pos.z, ac.pos.x, ac.pos.y, ac.pos.z);
    push();
    translate(ac.pos.x, ac.pos.y, ac.pos.z);
    noFill();
    stroke(0, 255, 0);
    */

    // TODO
    // drawAircraft(ac.hdg);

    // TODO
    // draw aircraft info
    /*
    push();
    translate(8, 0, 0);

    fill('#ED225D');
    //fill(128, 0, 0);
    //fill('#d65a7e');
    textFont(myFont);

    textSize(14);

    let callsign = "";
    if (ac.callsign === "" || ac.callsign === undefined) {
      callsign = `#${ac.hex}`;
    } else {
      callsign = `${ac.callsign}`;
    }

    translate(0, 18, 0);
    text(callsign, 0, 0);

    textSize(12);
    translate(0, 12, 0);
    text(ac.alt, 0, 0);
    translate(0, 12, 0);
    text(ac.hdg, 0, 0);
    translate(0, 12, 0);
    text(ac.bearing.toFixed(1), 0, 0);

    pop();
    pop();
    */

    ac.ttl -= 100 * deltaTime

    if (ac.hasValidTelemetry()) {
      //console.log(ac.ttl)
    }

    ac.updateText()


    if (ac.ttl < 0) {
      ac.clear()
      delete aircrafts[key]
    }
  }

  for (const label of poiLabels) {
    label.rotation.y = Math.atan2((camera.position.x - label.position.x), (camera.position.z - label.position.z))
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