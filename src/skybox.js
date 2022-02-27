import * as THREE from 'three'

//
// skybox
// source:
// https://threejs.org/manual/?q=canvas#en/canvas-textures
// https://www.w3schools.com/graphics/canvas_gradients.asp
// https://discourse.threejs.org/t/how-to-define-a-scene-background-with-gradients/3647/6
//

export class Skybox {
  constructor(scene) {
    this.mesh = null
    this.textures = {}

    // dawn+dusk
    {
      const ctx = document.createElement('canvas').getContext('2d')
      const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height)
      gradient.addColorStop(0, '#2d5277')
      gradient.addColorStop(0.45, '#4f809f')
      gradient.addColorStop(0.46, '#4f809f')
      gradient.addColorStop(0.46, '#82a7b3')
      gradient.addColorStop(0.47, '#82a7b3')
      gradient.addColorStop(0.47, '#b3b4a8')
      gradient.addColorStop(0.48, '#b3b4a8')
      gradient.addColorStop(0.48, '#e6aa6c')
      gradient.addColorStop(0.49, '#e6aa6c')
      gradient.addColorStop(0.49, '#e0682c')
      gradient.addColorStop(0.5, '#e0682c')
      gradient.addColorStop(0.5, '#5f3627')
      gradient.addColorStop(0.5, '#181413')
      gradient.addColorStop(1, '#181413')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
      const texture = new THREE.CanvasTexture(ctx.canvas)
      this.textures['dawn+dusk'] = texture
    }

    // day
    {
      const ctx = document.createElement('canvas').getContext('2d')
      const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height)
      gradient.addColorStop(0, '#1f71a4')
      gradient.addColorStop(0.1, '#1f71a4')

      gradient.addColorStop(0.2, '#438dbc')
      gradient.addColorStop(0.48, '#438dbc')

      gradient.addColorStop(0.485, '#69a5ce')
      gradient.addColorStop(0.495, '#69a5ce')

      gradient.addColorStop(0.496, '#8abadb')
      gradient.addColorStop(0.5, '#8abadb')

      gradient.addColorStop(0.5, '#000')
      gradient.addColorStop(1, '#000')

      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
      const texture = new THREE.CanvasTexture(ctx.canvas)
      this.textures['day'] = texture
    }

    // night
    {
      const ctx = document.createElement('canvas').getContext('2d')
      const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height)
      gradient.addColorStop(0, '#000')
      gradient.addColorStop(0.3, '#2b2233')
      gradient.addColorStop(0.41, '#2b2233')
      gradient.addColorStop(0.41, '#28293b')
      gradient.addColorStop(0.43, '#28293b')
      gradient.addColorStop(0.43, '#2f3749')
      gradient.addColorStop(0.45, '#2f3749')
      gradient.addColorStop(0.45, '#3b4558')
      gradient.addColorStop(0.46, '#3b4558')
      gradient.addColorStop(0.46, '#4a5468')
      gradient.addColorStop(0.47, '#83879d')
      gradient.addColorStop(0.48, '#83879d')
      gradient.addColorStop(0.48, '#211e27')
      gradient.addColorStop(0.5, '#211e27')
      gradient.addColorStop(0.5, '#000')
      gradient.addColorStop(0.1, '#000')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
      const texture = new THREE.CanvasTexture(ctx.canvas)
      this.textures['night'] = texture
    }

    const geometry = new THREE.IcosahedronGeometry(3000, 2)
    this.mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial(
        {
          map: this.textures['dawn+dusk'],
          side: THREE.BackSide,
          depthWrite: false,
          fog: false
        }
      )
    )
    scene.add(this.mesh)
  }

  setTexture(textureName) {
    this.mesh.material.map = this.textures[textureName]
  }
}
