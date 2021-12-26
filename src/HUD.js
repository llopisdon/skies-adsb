import * as UTILS from './utils.js'

//
// aircraft info HTML HUD
//

const aircraftPhotos = {}

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
    spinner: container.querySelector("#spinner"),
  }
}

function setupAnimationEventListeners(hud) {
  hud.container.addEventListener('animationstart', () => {
  })
  hud.container.addEventListener('animationend', () => {

    if (hud.container.classList.contains('show')) {
      hud.container.classList.remove('show')
      hud.container.className = "position-absolute bottom-0 end-0"
    }

    if (hud.container.classList.contains('hide')) {
      hud.container.classList.remove('hide')
      hud.container.classList.add('hidden')
      HUD._reset()
    }
  })
}

const HUD_P = getHUD("portrait-hud")
setupAnimationEventListeners(HUD_P)
const HUD_L = getHUD("landscape-hud")
setupAnimationEventListeners(HUD_L)


class _HUD {

  constructor(landscape = false) {
    this.aircraft = null
    this.hud = null
    this.toggleOrientation(landscape)
    this._reset()
  }

  toggleOrientation(landscape = false) {
    if (landscape) {
      this.hud = HUD_L
    } else {
      this.hud = HUD_P
    }
  }

  _showPhoto() {
    if (!this.hud || this.aircraftPhotoShown) return
    const aircraft = this.aircraft
    this.hud.photo.src = aircraft.photo?.['thumbnail']['src'] ?? HUD_DEFAULT_PHOTO
    this.hud.photo.style.display = 'inline'
    this.hud.photographer.innerText = `Photographer: ${aircraft.photo['photographer'] || NOT_AVAILABLE}`
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
    this.hud.photo.style.display = 'inline'
    this.hud.photographer.innerText = `Photographer: ${NOT_AVAILABLE}`
  }

  _clearAircraftInfo() {
    if (!this.hud) return
    this.hud.callsign.innerText = NOT_AVAILABLE
    this.hud.airline.innerText = NOT_AVAILABLE
    this.hud.aircraftType.innerText = NOT_AVAILABLE
    this.hud.origin.innerText = `Origin: ${NOT_AVAILABLE}`
    this.hud.destination.innerText = `Dest: ${NOT_AVAILABLE}`
    this.hud.telemetry.innerText = `H: ${NOT_AVAILABLE} | GSPD: ${NOT_AVAILABLE} | ALT: ${NOT_AVAILABLE}`
    this.hud.spinner.className = 'position-absolute top-50 start-50 translate-middle'
  }

  _showAircraftInfo() {
    if (!this.hud || this.aircraftInfoShown) return
    const aircraft = this.aircraft
    console.log(aircraft.flightInfo)
    this.hud.callsign.innerText = `${aircraft.flightInfo?.['ident'] ?? NOT_AVAILABLE}`
    this.hud.airline.innerText = `${aircraft.flightInfo?.['airlineCallsign'] ?? NOT_AVAILABLE} | ${aircraft.flightInfo?.['airline'] ?? NOT_AVAILABLE}`
    this.hud.aircraftType.innerText = `Type: ${aircraft.flightInfo?.['type'] ?? NOT_AVAILABLE} | ${aircraft.flightInfo?.['manufacturer'] ?? NOT_AVAILABLE}`
    this.hud.origin.innerText = `Origin: ${aircraft.flightInfo?.['origin'] ?? NOT_AVAILABLE}, ${aircraft.flightInfo?.['originName'] ?? NOT_AVAILABLE}`
    this.hud.destination.innerText = `Dest: ${aircraft.flightInfo?.['destination'] ?? NOT_AVAILABLE}, ${aircraft.flightInfo?.['destinationName'] ?? NOT_AVAILABLE}`
    this.hud.spinner.className = 'hidden'
    this.aircraftInfoShown = true
  }

  _updateTelemetry() {
    if (!this.hud || !this.aircraft) return

    const aircraft = this.aircraft

    const heading = (aircraft?.hdg) ? aircraft.hdg + '°' : NOT_AVAILABLE
    const groundSpeed = (aircraft?.spd) ? aircraft.spd + ' kt' : NOT_AVAILABLE
    const altitude = (aircraft?.alt) ? aircraft.alt + "'" : NOT_AVAILABLE
    this.hud.telemetry.innerText = `H: ${heading} | GSPD: ${groundSpeed} | ALT: ${altitude}`
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
    this.hud.container.style.visibility = "visible"
    this.hud.container.className = "position-absolute bottom-0 end-0"
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
export const HUD = new _HUD(UTILS.isLandscape())
console.log(HUD)

