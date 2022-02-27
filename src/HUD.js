import * as UTILS from "./utils.js"

//
// aircraft info HTML HUD
//

/*
https://www.google.com/search?q=flight status AAL961
https://www.google.com/search?q=about 737 MAX 8 Boeing
https://www.google.com/search?q=about American American Airlines Inc.
https://www.google.com/search?q=aerodrome MROC
*/

// TODO periodically clear out photos
const aircraftPhotos = {}

const HUD_DEFAULT_PHOTO = "./static/aircraft.jpg"
const NOT_AVAILABLE = "n/a"

class _HUD {
  constructor() {
    this.aircraft = null
    this.hud = this._getHud()
    this.isHUDDialogShown = false
    this.isRightDialogShown = false
    this.isFollowCamActive = false
    this._reset()
  }

  _getHud() {
    const dialog = document.getElementById("hud-dialog")
    return {
      leftButtonContainer: document.getElementById("hud-left"),
      rightButtonContainer: document.getElementById("hud-right"),

      homeButton: document.getElementById("home"),
      settingsButton: document.getElementById("settings"),
      fullscreenButton: document.getElementById("full-screen"),
      cameraButton: document.getElementById("camera"),
      infoButton: document.getElementById("info"),
      closeButton: document.getElementById("close"),

      dialog: dialog,
      photo: dialog.querySelector("#photo"),
      photographer: dialog.querySelector("#photographer"),
      callsign: dialog.querySelector("#callsign"),
      airline: dialog.querySelector("#airline"),
      aircraftType: dialog.querySelector("#aircraftType"),
      origin_short: dialog.querySelector("#origin_short"),
      origin_long: dialog.querySelector("#origin_long"),
      destination_short: dialog.querySelector("#destination_short"),
      destination_long: dialog.querySelector("#destination_long"),
      telemetry_heading: dialog.querySelector("#telemetry_heading"),
      telemetry_ground_speed: dialog.querySelector("#telemetry_ground_speed"),
      telemetry_altitude: dialog.querySelector("#telemetry_altitude"),
    }
  }

  _showPhoto() {
    if (!this.hud || this.aircraftPhotoShown) return
    const aircraft = this.aircraft
    this.hud.photo.src =
      aircraft.photo?.["thumbnail_large"]["src"] ?? HUD_DEFAULT_PHOTO
    this.hud.photographer.text = `Photographer: ${aircraft.photo?.["photographer"] ?? NOT_AVAILABLE
      }`
    this.hud.photographer.href = `${aircraft.photo?.["link"] ?? "#"}`
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
  }

  _showAircraftInfo() {
    if (!this.hud || this.aircraftInfoShown) return
    const aircraft = this.aircraft
    console.log(aircraft.flightInfo)
    this.hud.callsign.text = `${aircraft.flightInfo?.["ident"] ?? NOT_AVAILABLE
      }`
    this.hud.callsign.href = `https://www.google.com/search?q=flight status ${aircraft.flightInfo?.["ident"] ?? NOT_AVAILABLE
      }`
    this.hud.airline.text = `${aircraft.flightInfo?.["airlineCallsign"] ?? NOT_AVAILABLE
      } | ${aircraft.flightInfo?.["airline"] ?? NOT_AVAILABLE}`
    this.hud.airline.href = `https://www.google.com/search?q=about ${aircraft.flightInfo?.["airlineCallsign"]} ${aircraft.flightInfo?.["airline"]}`
    this.hud.aircraftType.text = `Type: ${aircraft.flightInfo?.["type"] ?? NOT_AVAILABLE
      } | ${aircraft.flightInfo?.["manufacturer"] ?? NOT_AVAILABLE}`
    this.hud.aircraftType.href = `https://www.google.com/search?q=about ${aircraft.flightInfo?.["type"]} ${aircraft.flightInfo?.["manufacturer"]}`
    this.hud.origin_short.text = `O: ${aircraft.flightInfo?.["origin"] ?? NOT_AVAILABLE
      }`
    this.hud.origin_short.href = `https://www.google.com/search?q=aerodrome ${aircraft.flightInfo?.["origin"]}`
    this.hud.origin_long.text = `Origin: ${aircraft.flightInfo?.["origin"] ?? NOT_AVAILABLE
      }, ${aircraft.flightInfo?.["originName"] ?? NOT_AVAILABLE}`
    this.hud.origin_long.href = `https://www.google.com/search?q=aerodrome ${aircraft.flightInfo?.["origin"]}`
    this.hud.destination_short.text = `D: ${aircraft.flightInfo?.["destination"] ?? NOT_AVAILABLE
      }`
    this.hud.destination_short.href = `https://www.google.com/search?q=aerodrome ${aircraft.flightInfo?.["destination"]}`
    this.hud.destination_long.text = `Dest: ${aircraft.flightInfo?.["destination"] ?? NOT_AVAILABLE
      }, ${aircraft.flightInfo?.["destinationName"] ?? NOT_AVAILABLE}`
    this.hud.destination_long.href = `https://www.google.com/search?q=aerodrome ${aircraft.flightInfo?.["destination"]}`
    this.aircraftInfoShown = true
  }

  _updateTelemetry() {
    if (!this.hud || !this.aircraft) return

    const aircraft = this.aircraft

    const heading = aircraft?.hdg ? aircraft.hdg + "°" : NOT_AVAILABLE
    const groundSpeed = aircraft?.spd ? aircraft.spd + " kt" : NOT_AVAILABLE
    const altitude = aircraft?.alt ? aircraft.alt + "'" : NOT_AVAILABLE
    this.hud.telemetry_heading.innerText = `H: ${heading}`
    this.hud.telemetry_ground_speed.innerText = `GSPD: ${groundSpeed}`
    this.hud.telemetry_altitude.innerText = `ALT: ${altitude}`
  }

  isClientXYInHUDContainer(clientX, clientY) {
    const leftHUDRect = this.hud.leftButtonContainer.getBoundingClientRect()
    const rightHUDRect = this.hud.rightButtonContainer.getBoundingClientRect()
    const inLeftHUD =
      clientX >= leftHUDRect.left &&
      clientX <= leftHUDRect.right &&
      clientY <= leftHUDRect.bottom &&
      clientY >= leftHUDRect.top
    const inRightHUD =
      clientX >= rightHUDRect.left &&
      clientX <= rightHUDRect.right &&
      clientY <= rightHUDRect.bottom &&
      clientY >= rightHUDRect.top
    return this.isVisisble() && (inLeftHUD || inRightHUD)
  }

  isVisisble() {
    return this.aircraft !== null
  }

  _isFollowCamActive() {
    return this.hud.cameraButton.classList.contains("active")
  }

  hide() {
    this._reset()
    this.toggleRightActions()
  }

  show(aircraft) {
    if (!this.isVisisble()) this.toggleRightActions()
    this._reset()
    this.aircraft = aircraft
    this.needsFetchAircraftInfo = true
    this.needsFetchAircraftPhoto = true
    console.log(`show AIRCRAFT...`)
  }

  update() {
    if (!this.isVisisble()) return

    this._updateTelemetry()

    if (this.needsFetchAircraftInfo) {
      this._fetchAircraftInfo()
    }

    if (this.needsFetchAircraftPhoto) {
      this._fetchAircraftPhoto()
    }
  }

  enableHUD() {
    const param = {
      opacity: 1,
      display: "flex",
      duration: 0.25,
    }

    console.log(param)

    gsap.to("#hud-left", param)
    gsap.to("#hud-dialog-container", param)
  }


  toggleRightActions() {
    this.isRightDialogShown = !this.isRightDialogShown

    console.log("toggleRightActions...", this.isRightDialogShown)

    if (this.isHUDDialogShown) this.toggleDialog()
    if (this.isFollowCamActive) this.toggleFollow()

    const param = this.isRightDialogShown
      ? {
        opacity: 1,
        display: "flex",
        duration: 0.25,
      }
      : {
        opacity: 0,
        display: "none",
        duration: 0.25,
      }

    console.log(param)

    gsap.to("#hud-right", param)
  }

  toggleSettings() {
    let settingsButton = this.hud.settingsButton
    if (settingsButton.classList.contains("active")) {
      settingsButton.classList.remove("active")
    } else {
      settingsButton.classList.add("active")
    }
  }

  toggleFollow() {
    let follow = this.hud.cameraButton
    this.isFollowCamActive = !this.isFollowCamActive

    if (this.isFollowCamActive) {
      follow.classList.add("active")
    } else {
      follow.classList.remove("active")
    }
  }

  toggleDialog() {
    this.isHUDDialogShown = !this.isHUDDialogShown
    let info = this.hud.infoButton
    if (info.classList.contains("active")) {
      info.classList.remove("active")
    } else {
      info.classList.add("active")
    }

    const param = this.isHUDDialogShown
      ? {
        y: "0%",
        duration: 0.25,
        autoAlpha: 1,
        display: "flex",
      }
      : {
        y: "100%",
        duration: 0.25,
        autoAlpha: 0,
        display: "none",
      }

    gsap.to("#hud-dialog", param)
  }

  _fetchAircraftPhoto() {
    const aircraft = this.aircraft

    if (!aircraft?.hex) {
      return
    }

    console.log("~~~~ FETCH PHOTO ~~~~")

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
      .then((response) => response.json())
      .then((data) => {
        console.log(data)
        if (Array.isArray(data["photos"]) && data["photos"].length > 0) {
          const photo = data["photos"][0]
          if ("thumbnail" in photo) {
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
      .then((response) => response.json())
      .then((data) => {
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
