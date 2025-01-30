import * as THREE from 'three'
import { vertexShader, fragmentShader } from './shaders'

const BLADE_WIDTH = 0.08 // Reducido de 0.1
const BLADE_HEIGHT = 0.6
const BLADE_HEIGHT_VARIATION = 0.2
const BLADE_VERTEX_COUNT = 5
const BLADE_TIP_OFFSET = 0.08 // Reducido de 0.1

function interpolate(val, oldMin, oldMax, newMin, newMax) {
  return ((val - oldMin) * (newMax - newMin)) / (oldMax - oldMin) + newMin
}

export class GrassGeometry extends THREE.BufferGeometry {
  constructor(size, count) {
    super()

    const positions = []
    const uvs = []
    const indices = []

    const gridSize = Math.sqrt(count)
    const stepSize = size / gridSize

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const x = (i * stepSize) - (size / 2) + (Math.random() * stepSize * 0.5)
        const z = (j * stepSize) - (size / 2) + (Math.random() * stepSize * 0.5)

        uvs.push(
          ...Array.from({ length: BLADE_VERTEX_COUNT }).flatMap(() => [
            (x + size/2) / size,
            (z + size/2) / size
          ])
        )

        const blade = this.computeBlade([x, 0, z], i * gridSize + j)
        positions.push(...blade.positions)
        indices.push(...blade.indices)
      }
    }

    this.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(positions), 3)
    )
    this.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), 2))
    this.setIndex(indices)
    this.computeVertexNormals()
  }

  computeBlade(center, index = 0) {
    const height = BLADE_HEIGHT + Math.random() * BLADE_HEIGHT_VARIATION
    const vIndex = index * BLADE_VERTEX_COUNT

    const yaw = Math.random() * Math.PI * 2
    const yawVec = [Math.sin(yaw), 0, -Math.cos(yaw)]
    const bend = Math.random() * Math.PI * 2
    const bendVec = [Math.sin(bend), 0, -Math.cos(bend)]

    const bl = yawVec.map((n, i) => n * (BLADE_WIDTH / 2) * 1 + center[i])
    const br = yawVec.map((n, i) => n * (BLADE_WIDTH / 2) * -1 + center[i])
    const tl = yawVec.map((n, i) => n * (BLADE_WIDTH / 4) * 1 + center[i])
    const tr = yawVec.map((n, i) => n * (BLADE_WIDTH / 4) * -1 + center[i])
    const tc = bendVec.map((n, i) => n * BLADE_TIP_OFFSET + center[i])

    tl[1] += height / 2
    tr[1] += height / 2
    tc[1] += height

    return {
      positions: [...bl, ...br, ...tr, ...tl, ...tc],
      indices: [
        vIndex,
        vIndex + 1,
        vIndex + 2,
        vIndex + 2,
        vIndex + 4,
        vIndex + 3,
        vIndex + 3,
        vIndex,
        vIndex + 2
      ]
    }
  }
}

const cloudTexture = new THREE.TextureLoader().load('/assets/cloud.jpg')
cloudTexture.wrapS = cloudTexture.wrapT = THREE.RepeatWrapping

class Grass extends THREE.Mesh {
  constructor(size, count) {
    const geometry = new GrassGeometry(size, count)
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uCloud: { value: cloudTexture },
        uTime: { value: 0 }
      },
      side: THREE.DoubleSide,
      vertexShader,
      fragmentShader
    })
    super(geometry, material)
  }

  update(time) {
    this.material.uniforms.uTime.value = time
  }
}

export default Grass