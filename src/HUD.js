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

const HUD_DEFAULT_PHOTO = "./static/Pan_Am_747.jpg"
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
    const flightAwareDiv = document.querySelector("#section_flightAware")
    const planespottersDiv = document.querySelector("#section_planespotters")
    const telemetryDiv = document.querySelector("#section_telemetry")

    return {
      leftButtonContainer: document.getElementById("hud-left"),
      rightButtonContainer: document.getElementById("hud-right"),

      homeButton: document.getElementById("home"),
      autoOrbitButton: document.getElementById("360"),
      settingsButton: document.getElementById("settings"),
      fullscreenButton: document.getElementById("full-screen"),
      cameraButton: document.getElementById("camera"),
      infoButton: document.getElementById("info"),
      closeButton: document.getElementById("close"),

      dialog: dialog,

      callsign: document.querySelector("#callsign"),

      flightAwareDiv: flightAwareDiv,
      airline: flightAwareDiv.querySelector("#airline"),
      aircraftType: flightAwareDiv.querySelector("#aircraftType"),
      origin_long: flightAwareDiv.querySelector("#origin_long"),
      destination_long: flightAwareDiv.querySelector("#destination_long"),

      planespottersDiv: planespottersDiv,
      photo: dialog.querySelector("#photo"),
      aircraftRegistration: planespottersDiv.querySelector("#aircraftRegistration"),
      photographer: planespottersDiv.querySelector("#photographer"),

      telemetryDiv: telemetryDiv,
      telemetry_heading: telemetryDiv.querySelector("#telemetry_heading"),
      telemetry_ground_speed: telemetryDiv.querySelector("#telemetry_ground_speed"),
      telemetry_altitude: telemetryDiv.querySelector("#telemetry_altitude"),
    }
  }

  _showPhoto() {
    if (!this.hud || this.aircraftPhotoShown) return
    const aircraft = this.aircraft
    this.hud.photo.src =
      aircraft.photo?.["thumbnail_large"]["src"] ?? HUD_DEFAULT_PHOTO
    this.hud.photographer.text = `PHOTOGRAPHER: ${aircraft.photo?.["photographer"] ?? NOT_AVAILABLE
      }`
    this.hud.photographer.href = `${aircraft.photo?.["link"] ?? "#"}`

    const link = aircraft.photo?.["link"]?.split("?")[0]
    if (link !== undefined) {
      const segments = link.split("/")
      const registrationInfo = segments[segments.length - 1]?.replace(/-/g, ' ').toUpperCase()
      if (registrationInfo !== undefined) {
        this.hud.aircraftRegistration.text = `REG: ${registrationInfo}`
        this.hud.aircraftRegistration.href = `https://www.google.com/search?q=about ${registrationInfo}`
      }
    }

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
    this.hud.photographer.text = `PHOTOGRAPHER: ${NOT_AVAILABLE}`
  }

  _clearAircraftInfo() {
    if (!this.hud) return

    this.hud.flightAwareDiv.style.display = "none"

    // flight aware info
    this.hud.airline.text = NOT_AVAILABLE
    this.hud.airline.href = ""
    this.hud.aircraftType.text = NOT_AVAILABLE
    this.hud.aircraftType.href = ""
    this.hud.origin_long.text = `ORG: ${NOT_AVAILABLE}`
    this.hud.origin_long.href = ""
    this.hud.destination_long.text = `DST: ${NOT_AVAILABLE}`
    this.hud.destination_long.href = ""

    // planespotters info
    this.hud.aircraftRegistration.text = `REG: ${NOT_AVAILABLE}`
    this.hud.aircraftRegistration.href = ""

    // ads-b telemetry
    this.hud.callsign.text = `CALLSIGN: ${NOT_AVAILABLE}`
    this.hud.callsign.href = ""
    this.hud.telemetry_heading.text = `H: ${NOT_AVAILABLE}`
    this.hud.telemetry_ground_speed.text = `GSPD: ${NOT_AVAILABLE}`
    this.hud.telemetry_altitude.text = `ALT: ${NOT_AVAILABLE}`
  }

  _showAircraftInfo() {
    if (!this.hud || this.aircraftInfoShown) return
    const aircraft = this.aircraft
    console.table(aircraft?.flightInfo)

    if (Object.keys(aircraft?.flightInfo ?? {}).length === 0) {
      this.hud.flightAwareDiv.style.display = "none"
      return
    }

    this.hud.flightAwareDiv.style.display = "block"

    this.hud.airline.text = `${aircraft?.flightInfo?.["airlineCallsign"] ?? NOT_AVAILABLE} | ${aircraft?.flightInfo?.["airline"] ?? NOT_AVAILABLE}`
    this.hud.airline.href = `https://www.google.com/search?q=about ${aircraft?.flightInfo?.["airlineCallsign"]} ${aircraft?.flightInfo?.["airline"]}`
    this.hud.aircraftType.text = `TYPE: ${aircraft?.flightInfo?.["type"] ?? NOT_AVAILABLE} | ${aircraft?.flightInfo?.["manufacturer"] ?? NOT_AVAILABLE}`
    this.hud.aircraftType.href = `https://www.google.com/search?q=about ${aircraft?.flightInfo?.["type"]} ${aircraft?.flightInfo?.["manufacturer"]}`
    this.hud.origin_long.text = `ORG: ${aircraft?.flightInfo?.["origin"] ?? NOT_AVAILABLE}, ${aircraft?.flightInfo?.["originName"] ?? NOT_AVAILABLE}`
    this.hud.origin_long.href = `https://www.google.com/search?q=aerodrome ${aircraft?.flightInfo?.["origin"]}`
    this.hud.destination_long.text = `DST: ${aircraft?.flightInfo?.["destination"] ?? NOT_AVAILABLE}, ${aircraft?.flightInfo?.["destinationName"] ?? NOT_AVAILABLE}`
    this.hud.destination_long.href = `https://www.google.com/search?q=aerodrome ${aircraft?.flightInfo?.["destination"]}`

    this.aircraftInfoShown = true
  }

  _updateTelemetry() {
    if (!this.hud || !this.aircraft) return

    const aircraft = this.aircraft

    this.hud.callsign.text = `CALLSIGN: ${aircraft?.callsign ?? NOT_AVAILABLE}`
    this.hud.callsign.href = `https://www.google.com/search?q=flight status ${aircraft?.callsign ?? NOT_AVAILABLE}`

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
    return inLeftHUD || inRightHUD
  }

  isVisible() {
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
    if (!this.isVisible()) this.toggleRightActions()
    this._reset()
    this.aircraft = aircraft
    this.needsFetchAircraftInfo = true
    this.needsFetchAircraftPhoto = true
    console.log(`[HUD] show aircraft: ${aircraft.hex} | ${aircraft?.callsign}`)
  }

  update() {
    if (!this.isVisible()) return

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

    console.log("HUD: enableHUD")
    //console.table(param)

    gsap.to("#hud-left", param)
    gsap.to("#hud-dialog-container", param)
  }


  toggleRightActions() {
    this.isRightDialogShown = !this.isRightDialogShown

    console.log("[HUD] toggleRightActions - isRightDialogShown: ", this.isRightDialogShown)

    if (this.isHUDDialogShown) this.toggleAircraftInfoDialogButton()
    if (this.isFollowCamActive) this.toggleFollowButton()

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

    // console.table(param)

    gsap.to("#hud-right", param)
  }

  toggleAutoOrbitButton() {
    let autoOrbitButton = this.hud.autoOrbitButton
    if (autoOrbitButton.classList.contains("active")) {
      autoOrbitButton.classList.remove("active")
    } else {
      autoOrbitButton.classList.add("active")
    }
  }

  toggleSettingsButton() {
    const settingsButton = this.hud.settingsButton
    if (settingsButton.classList.contains("active")) {
      settingsButton.classList.remove("active")
    } else {
      settingsButton.classList.add("active")
    }
  }

  toggleFollowButton() {
    const followButton = this.hud.cameraButton
    this.isFollowCamActive = !this.isFollowCamActive

    if (this.isFollowCamActive) {
      followButton.classList.add("active")
    } else {
      followButton.classList.remove("active")
    }
  }

  toggleAircraftInfoDialogButton() {
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

    console.log("=============================================")
    console.log("FETCH PHOTO:", aircraft.hex)

    if (aircraft.photoFuture) {
      if (aircraft.photo) {
        HUD._showPhoto()
      }
      this.needsFetchAircraftPhoto = false
      return
    }

    const photoUrl = `${UTILS.DATA_HOSTS["photos"]}/${aircraft.hex}`
    console.log(`fetchPhoto -> ${photoUrl}`)
    aircraft.photoFuture = fetch(photoUrl)
      .then((response) => response.json())
      .then((data) => {
        console.table(data)
        aircraft.photoData = data
        if (Array.isArray(data["photos"]) && data["photos"].length > 0) {
          const photo = data["photos"][0]
          if ("thumbnail" in photo) {
            aircraft.photo = photo
            console.table(aircraft.photo)
            HUD._showPhoto()
          }
        }
        if (!aircraft?.photo) {
          HUD._clearPhoto()
        }
      })

    this.needsFetchAircraftPhoto = false
  }

  _fetchAircraftInfo() {
    const aircraft = this.aircraft

    if (!aircraft?.callsign) {
      return
    }

    console.log("[HUD] Fetch Aircraft Flight Info: ", aircraft.callsign)

    if (aircraft.flightInfoFuture && aircraft.flightInfo) {
      console.log("\tFlight already fetched:", aircraft.callsign)
      HUD._showAircraftInfo()
      this.needsFetchAircraftInfo = false
      return
    }

    const url = `${UTILS.DATA_HOSTS["flight_info"]}/${aircraft.callsign}`
    aircraft.flightInfoFuture = fetch(url)
      .then((response) => response.json())
      .then((data) => {
        aircraft.flightInfo = data
        this.hud.flightAwareDiv.style.display = "block"
        HUD._showAircraftInfo()
      })

    this.needsFetchAircraftInfo = false
  }
}

// HUD
export const HUD = new _HUD()
