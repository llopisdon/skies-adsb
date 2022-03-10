import * as THREE from 'three'

//
// skybox
// source:
// https://threejs.org/manual/?q=canvas#en/canvas-textures
// https://www.w3schools.com/graphics/canvas_gradients.asp
// https://discourse.threejs.org/t/how-to-define-a-scene-background-with-gradients/3647/6
//


const gradients = {
  'dawn+dusk':
    [
      0, '#2d5277',
      0.45, '#4f809f',
      0.46, '#4f809f',
      0.46, '#82a7b3',
      0.47, '#82a7b3',
      0.47, '#b3b4a8',
      0.48, '#b3b4a8',
      0.48, '#e6aa6c',
      0.49, '#e6aa6c',
      0.49, '#e0682c',
      0.5, '#e0682c',
      0.5, '#5f3627',
      0.5, '#181413',
      1, '#181413'
    ],

  'day':
    [
      0, '#1f71a4',
      0.1, '#1f71a4',
      0.2, '#438dbc',
      0.48, '#438dbc',
      0.485, '#69a5ce',
      0.495, '#69a5ce',
      0.496, '#8abadb',
      0.5, '#8abadb',
      0.5, '#000',
      1, '#000',
    ],

  'night':
    [
      0, '#000',
      0.3, '#2b2233',
      0.41, '#2b2233',
      0.41, '#28293b',
      0.43, '#28293b',
      0.43, '#2f3749',
      0.45, '#2f3749',
      0.45, '#3b4558',
      0.46, '#3b4558',
      0.46, '#4a5468',
      0.47, '#83879d',
      0.48, '#83879d',
      0.48, '#211e27',
      0.5, '#211e27',
      0.5, '#000',
      0.1, '#000',
    ]
}


export class Skybox {
  constructor(scene) {
    this.mesh = null
    this.textures = {}

    for (let [key, colorStop] of Object.entries(gradients)) {
      const ctx = document.createElement('canvas').getContext('2d')
      const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height)
      for (let i = 0; i < colorStop.length - 2; i += 2) {
        gradient.addColorStop(colorStop[i], colorStop[i + 1])
      }
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
      const texture = new THREE.CanvasTexture(ctx.canvas)
      this.textures[key] = texture
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
