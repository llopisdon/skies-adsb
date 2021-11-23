import * as UTILS from './utils.js'

//
// aircraft info HTML HUD
//

const HUD_DEFAULT_PHOTO = './static/aircraft.jpg'
const NOT_AVAILABLE = 'n/a'

function getHUD(hudId) {
  const container = document.getElementById(hudId)
  return {
    container: container,
    photo: container.querySelector("#photo"),
    photographer: container.querySelector("#photographer"),
    callsign: container.querySelector("#callsign"),
    airline: container.querySelector("#airline"),
    aircraftType: container.querySelector("#aircraftType"),
    origin: container.querySelector("#origin"),
    destination: container.querySelector("#destination"),
    telemetry: container.querySelector("#telemetry"),
  }
}

function setupAnimationEventListeners(hud) {
  hud.container.addEventListener('animationstart', () => {
  })
  hud.container.addEventListener('animationend', () => {

    if (hud.container.classList.contains('show')) {
      hud.container.classList.remove('show')
      hud.container.className = ""
    }

    if (hud.container.classList.contains('hide')) {
      hud.container.classList.remove('hide')
      hud.container.classList.add('hidden')
    }
  })
}

const HUD_P = getHUD("portrait-hud")
setupAnimationEventListeners(HUD_P)
const HUD_L = getHUD("landscape-hud")
setupAnimationEventListeners(HUD_L)


class _HUD {

  constructor(landscape = false) {
    this.hud = undefined
    this.toggleOrientation(landscape)
    this.reset()
  }

  toggleOrientation(landscape = false) {
    if (landscape) {
      this.hud = HUD_L
    } else {
      this.hud = HUD_P
    }
  }

  showPhoto(aircraft) {
    if (this.hud === undefined) return
    this.hud.photo.src = aircraft.photo['thumbnail']['src'] || HUD_DEFAULT_PHOTO
    this.hud.photo.style.display = 'inline'
    this.hud.photographer.innerText = `Photographer: ${aircraft.photo['photographer'] || NOT_AVAILABLE}`
  }

  reset() {
    this.clearPhoto()
    this.clearAircraftInfo()
  }

  clearPhoto() {
    this.hud.photo.src = HUD_DEFAULT_PHOTO
    this.hud.photo.style.display = 'inline'
    this.hud.photographer.innerText = `Photographer: ${NOT_AVAILABLE}`
  }

  clearAircraftInfo() {
    if (this.hud === undefined) return
    this.hud.callsign.innerText = NOT_AVAILABLE
    this.hud.airline.innerText = NOT_AVAILABLE
    this.hud.aircraftType.innerText = NOT_AVAILABLE
    this.hud.origin.innerText = `Origin: ${NOT_AVAILABLE}`
    this.hud.destination.innerText = `Dest: ${NOT_AVAILABLE}`
    this.hud.telemetry.innerText = `H: ${NOT_AVAILABLE} | GSPD: ${NOT_AVAILABLE} | ALT: ${NOT_AVAILABLE}`
  }

  showAircraftInfo(aircraft) {
    if (this.hud === undefined) return
    console.log(aircraft.flightInfo)
    this.hud.callsign.innerText = `${aircraft.flightInfo['ident'] || NOT_AVAILABLE}`
    this.hud.airline.innerText = `${aircraft.flightInfo['airlineCallsign'] || NOT_AVAILABLE} | ${aircraft.flightInfo['airline'] || NOT_AVAILABLE}`
    this.hud.aircraftType.innerText = `Type: ${aircraft.flightInfo['type'] || NOT_AVAILABLE} | ${aircraft.flightInfo['manufacturer'] || NOT_AVAILABLE}`
    this.hud.origin.innerText = `Origin: ${aircraft.flightInfo['origin'] || NOT_AVAILABLE}, ${aircraft.flightInfo['originName'] || NOT_AVAILABLE}`
    this.hud.destination.innerText = `Dest: ${aircraft.flightInfo['destination'] || NOT_AVAILABLE}, ${aircraft.flightInfo['destinationName'] || NOT_AVAILABLE}`

  }

  updateTelemetry(aircraft) {
    if (this.hud === undefined) return
    const heading = (aircraft.hdg !== undefined) ? aircraft.hdg + '°' : NOT_AVAILABLE
    const groundSpeed = (aircraft.spd !== undefined) ? aircraft.spd + ' kt' : NOT_AVAILABLE
    const altitude = (aircraft.alt !== undefined) ? aircraft.alt + "'" : NOT_AVAILABLE
    this.hud.telemetry.innerText = `H: ${heading} | GSPD: ${groundSpeed} | ALT: ${altitude}`
  }

  hide(animate = true) {
    if (this.hud === undefined || this.hud.container.classList.contains('hidden') || this.hud.container.classList.contains('hide')) {
      return;
    }
    if (animate) {
      this.hud.container.classList.add('hide')
    } else {
      this.hud.container.className = "hidden"
    }
  }

  show() {
    if (this.hud === undefined || this.hud.container.classList.contains('show') || !this.hud.container.classList.contains('hidden')) {
      return
    }
    this.hud.container.classList.remove('hidden')
    this.hud.container.classList.add('show')
  }
}

// HUD
export const HUD = new _HUD(UTILS.isLandscape())
console.log(HUD)

