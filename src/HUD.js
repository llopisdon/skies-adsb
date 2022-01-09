import * as UTILS from './utils.js'

//
// aircraft info HTML HUD
//

/*

https://www.google.com/search?q=flight status AAL961
https://www.google.com/search?q=about 737 MAX 8 Boeing
https://www.google.com/search?q=about American American Airlines Inc.
https://www.google.com/search?q=aerodrome MROC

*/

const aircraftPhotos = {}

const HUD_DEFAULT_PHOTO = './static/aircraft.jpg'
const NOT_AVAILABLE = 'n/a'

const HUD_CLASS_NAME = "container-fluid position-absolute bottom-0"

function getHUDContainer(hudId) {
  const container = document.getElementById(hudId)
  return {
    container: container,
    photo: container.querySelector("#photo"),
    photographer: container.querySelector("#photographer"),
    callsign: container.querySelector("#callsign"),
    airline: container.querySelector("#airline"),
    aircraftType: container.querySelector("#aircraftType"),
    origin_short: container.querySelector("#origin_short"),
    origin_long: container.querySelector("#origin_long"),
    destination_short: container.querySelector("#destination_short"),
    destination_long: container.querySelector("#destination_long"),
    telemetry_heading: container.querySelector("#telemetry_heading"),
    telemetry_ground_speed: container.querySelector("#telemetry_ground_speed"),
    telemetry_altitude: container.querySelector("#telemetry_altitude"),
    spinner: container.querySelector("#spinner"),
  }
}

function setupEventListeners(hud) {
  hud.container.addEventListener('animationstart', () => {
  })
  hud.container.addEventListener('animationend', () => {
    if (hud.container.classList.contains('show')) {
      hud.container.classList.remove('show')
      hud.container.className = HUD_CLASS_NAME
    }

    if (hud.container.classList.contains('hide')) {
      hud.container.classList.remove('hide')
      hud.container.classList.add('hidden')
      HUD._reset()
    }
  })
}

const hudContainer = getHUDContainer("hud")
console.log(hudContainer)
setupEventListeners(hudContainer)

class _HUD {

  constructor() {
    this.aircraft = null
    this.hud = hudContainer
    this._reset()
  }

  _showPhoto() {
    if (!this.hud || this.aircraftPhotoShown) return
    const aircraft = this.aircraft
    this.hud.photo.src = aircraft.photo?.['thumbnail_large']['src'] ?? HUD_DEFAULT_PHOTO
    this.hud.photographer.text = `Photographer: ${aircraft.photo?.['photographer'] ?? NOT_AVAILABLE}`
    this.hud.photographer.href = `${aircraft.photo?.['link'] ?? '#'}`
    this.aircraftPhotoShown = true
  }

  _reset() {
    this.aircraft = null
    this.needsFetchAircraftInfo = false
    this.aircraftInfoShown = false
    this.needsFetchAircraftPhoto = false
    this.aircraftPhotoShown = false
    this._clearPhoto()
    this._clearAircraftInfo()
  }

  _clearPhoto() {
    this.hud.photo.src = HUD_DEFAULT_PHOTO
    this.hud.photographer.text = `Photographer: ${NOT_AVAILABLE}`
  }

  _clearAircraftInfo() {
    if (!this.hud) return
    this.hud.callsign.text = NOT_AVAILABLE
    this.hud.callsign.href = ""
    this.hud.airline.text = NOT_AVAILABLE
    this.hud.airline.href = ""
    this.hud.aircraftType.text = NOT_AVAILABLE
    this.hud.aircraftType.href = ""
    this.hud.origin_short.text = `O: ${NOT_AVAILABLE}`
    this.hud.origin_short.href = ""
    this.hud.origin_long.text = `Origin: ${NOT_AVAILABLE}`
    this.hud.origin_long.href = ""
    this.hud.destination_short.text = `D: ${NOT_AVAILABLE}`
    this.hud.destination_short.href = ""
    this.hud.destination_long.text = `Dest: ${NOT_AVAILABLE}`
    this.hud.destination_long.href = ""
    this.hud.telemetry_heading.text = `H: ${NOT_AVAILABLE}`
    this.hud.telemetry_ground_speed.text = `GSPD: ${NOT_AVAILABLE}`
    this.hud.telemetry_altitude.text = `ALT: ${NOT_AVAILABLE}`
    this.hud.spinner.className = 'position-absolute top-50 start-50 translate-middle'
  }

  _showAircraftInfo() {
    if (!this.hud || this.aircraftInfoShown) return
    const aircraft = this.aircraft
    console.log(aircraft.flightInfo)
    this.hud.callsign.text = `${aircraft.flightInfo?.['ident'] ?? NOT_AVAILABLE}`
    this.hud.callsign.href = `https://www.google.com/search?q=flight status ${aircraft.flightInfo?.['ident'] ?? NOT_AVAILABLE}`
    this.hud.airline.text = `${aircraft.flightInfo?.['airlineCallsign'] ?? NOT_AVAILABLE} | ${aircraft.flightInfo?.['airline'] ?? NOT_AVAILABLE}`
    this.hud.airline.href = `https://www.google.com/search?q=about ${aircraft.flightInfo?.['airlineCallsign']} ${aircraft.flightInfo?.['airline']}`
    this.hud.aircraftType.text = `Type: ${aircraft.flightInfo?.['type'] ?? NOT_AVAILABLE} | ${aircraft.flightInfo?.['manufacturer'] ?? NOT_AVAILABLE}`
    this.hud.aircraftType.href = `https://www.google.com/search?q=about ${aircraft.flightInfo?.['type']} ${aircraft.flightInfo?.['manufacturer']}`
    this.hud.origin_short.text = `O: ${aircraft.flightInfo?.['origin'] ?? NOT_AVAILABLE}`
    this.hud.origin_short.href = `https://www.google.com/search?q=aerodrome ${aircraft.flightInfo?.['origin']}`
    this.hud.origin_long.text = `Origin: ${aircraft.flightInfo?.['origin'] ?? NOT_AVAILABLE}, ${aircraft.flightInfo?.['originName'] ?? NOT_AVAILABLE}`
    this.hud.origin_long.href = `https://www.google.com/search?q=aerodrome ${aircraft.flightInfo?.['origin']}`
    this.hud.destination_short.text = `D: ${aircraft.flightInfo?.['destination'] ?? NOT_AVAILABLE}`
    this.hud.destination_short.href = `https://www.google.com/search?q=aerodrome ${aircraft.flightInfo?.['destination']}`
    this.hud.destination_long.text = `Dest: ${aircraft.flightInfo?.['destination'] ?? NOT_AVAILABLE}, ${aircraft.flightInfo?.['destinationName'] ?? NOT_AVAILABLE}`
    this.hud.destination_long.href = `https://www.google.com/search?q=aerodrome ${aircraft.flightInfo?.['destination']}`
    this.hud.spinner.className = 'hidden'
    this.aircraftInfoShown = true
  }

  _updateTelemetry() {
    if (!this.hud || !this.aircraft) return

    const aircraft = this.aircraft

    const heading = (aircraft?.hdg) ? aircraft.hdg + '°' : NOT_AVAILABLE
    const groundSpeed = (aircraft?.spd) ? aircraft.spd + ' kt' : NOT_AVAILABLE
    const altitude = (aircraft?.alt) ? aircraft.alt + "'" : NOT_AVAILABLE
    this.hud.telemetry_heading.innerText = `H: ${heading}`
    this.hud.telemetry_ground_speed.innerText = `GSPD: ${groundSpeed}`
    this.hud.telemetry_altitude.innerText = `ALT: ${altitude}`
  }

  hide(animate = true) {
    if (!this.hud || this.hud.container.classList.contains('hidden') || this.hud.container.classList.contains('hide')) {
      return;
    }

    if (animate) {
      this.hud.container.classList.add('hide')
    } else {
      this.hud.container.classList.remove('show')
      this.hud.container.classList.add('hidden')
    }
  }

  show(aircraft) {
    if (!this.hud || this.hud.container.classList.contains('show')) {
      return
    }
    this._reset()
    this.aircraft = aircraft
    this.needsFetchAircraftInfo = true
    this.needsFetchAircraftPhoto = true

    if (this.hud.container.className === HUD_CLASS_NAME) {
      return
    }

    this.hud.container.style.visibility = "visible"
    this.hud.container.className = HUD_CLASS_NAME
    this.hud.container.classList.add('show')
  }

  update() {
    if (!this.aircraft) return

    this._updateTelemetry()

    if (this.needsFetchAircraftInfo) {
      this._fetchAircraftInfo()
    }

    if (this.needsFetchAircraftPhoto) {
      this._fetchAircraftPhoto()
    }
  }

  _fetchAircraftPhoto() {
    const aircraft = this.aircraft

    if (!aircraft?.hex) {
      return
    }

    console.log('~~~~ FETCH PHOTO ~~~~')

    if (aircraft.photoFuture) {
      if (aircraft.photo) {
        HUD._showPhoto()
      } else {
        const aircraftTypeKey = aircraft.getAircraftTypeKey()
        if (aircraftTypeKey !== null && aircraftTypeKey in aircraftPhotos) {
          aircraft.photo = aircraftPhotos[aircraftTypeKey]
          HUD._showPhoto()
        }
      }
      this.needsFetchAircraftPhoto = false
      return
    }

    const photoUrl = `${UTILS.DATA_HOSTS["photos"]}/${aircraft.hex}`
    console.log(`fetchPhoto -> ${photoUrl}`)
    aircraft.photoFuture = fetch(photoUrl)
      .then(response => response.json())
      .then(data => {
        console.log(data)
        if (Array.isArray(data['photos']) && data['photos'].length > 0) {
          const photo = data['photos'][0]
          if ('thumbnail' in photo) {
            aircraft.photo = photo
            console.log(aircraft.photo)
            HUD._showPhoto()
          }
        }
        if (!aircraft?.photo) {
          const aircraftTypeKey = aircraft.getAircraftTypeKey()
          if (aircraftTypeKey !== null && aircraftTypeKey in aircraftPhotos) {
            aircraft.photo = aircraftPhotos[aircraftTypeKey]
            HUD._showPhoto()
          } else {
            HUD._clearPhoto()
          }
        }
      })

    this.needsFetchAircraftPhoto = false
  }

  _fetchAircraftInfo() {
    const aircraft = this.aircraft

    if (!aircraft?.callsign) {
      return
    }

    console.log("~~~ FETCH FLIGHT INFO ~~~")

    if (aircraft.flightInfoFuture && aircraft.flightInfo) {
      HUD._showAircraftInfo()
      this.needsFetchAircraftInfo = false
      return
    }

    const url = `${UTILS.DATA_HOSTS["flightinfo"]}/${aircraft.callsign}`
    aircraft.flightInfoFuture = fetch(url)
      .then(response => response.json())
      .then(data => {
        aircraft.flightInfo = data
        const aircraftTypeKey = aircraft.getAircraftTypeKey()
        const hasPhoto = aircraftTypeKey in aircraftPhotos
        if (!hasPhoto && aircraftTypeKey !== undefined && aircraft?.photo) {
          aircraftPhotos[aircraftTypeKey] = aircraft.photo
        }
        HUD._showAircraftInfo()
      })

    console.log("@@@@ FLIGHT INFO FETCHING.... @@@@")

    this.needsFetchAircraftInfo = false
  }
}

// HUD
export const HUD = new _HUD()
console.log(HUD)

