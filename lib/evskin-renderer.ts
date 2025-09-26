import * as THREE from "three"

// Binary Buffer Reader implementation
export class BinaryBufferReader {
  private _buffer: ArrayBuffer
  private _index: number

  constructor(buffer: ArrayBuffer) {
    this._buffer = buffer
    this._index = 0
  }

  chompInt16(): number {
    const view = this._buffer.slice(this._index, this._index + 2)
    this._index += 2
    return new Int16Array(view)[0]
  }

  chompUint16(): number {
    const view = this._buffer.slice(this._index, this._index + 2)
    this._index += 2
    return new Uint16Array(view)[0]
  }

  chompUint32(): number {
    const view = this._buffer.slice(this._index, this._index + 4)
    this._index += 4
    return new Uint32Array(view)[0]
  }

  chompByte(): number {
    const view = this._buffer.slice(this._index, this._index + 1)
    this._index += 1
    return new Uint8Array(view)[0]
  }

  chompByteArray(length: number): Uint8Array {
    const view = this._buffer.slice(this._index, this._index + length)
    this._index += length
    return new Uint8Array(view)
  }

  chompUint16Array(length: number): Uint16Array {
    const view = this._buffer.slice(this._index, this._index + 2 * length)
    this._index += 2 * length
    return new Uint16Array(view)
  }

  chompFloat32(): number {
    const view = this._buffer.slice(this._index, this._index + 4)
    this._index += 4
    return new Float32Array(view)[0]
  }

  chompFloat32Array(length: number): Float32Array {
    const view = this._buffer.slice(this._index, this._index + 4 * length)
    this._index += 4 * length
    return new Float32Array(view)
  }

  chompString(): string {
    const length = this.chompByte()
    const view = this._buffer.slice(this._index, this._index + length)
    this._index += length
    return Array.prototype.slice
      .call(new Uint8Array(view))
      .map((byte) => String.fromCharCode(byte))
      .join("")
  }

  chompVector3(): THREE.Vector3 {
    return new THREE.Vector3(this.chompFloat32(), this.chompFloat32(), this.chompFloat32())
  }

  chompMatrix4(): THREE.Matrix4 {
    const matrix = new THREE.Matrix4()
    matrix.set(
      this.chompFloat32(),
      this.chompFloat32(),
      this.chompFloat32(),
      this.chompFloat32(),
      this.chompFloat32(),
      this.chompFloat32(),
      this.chompFloat32(),
      this.chompFloat32(),
      this.chompFloat32(),
      this.chompFloat32(),
      this.chompFloat32(),
      this.chompFloat32(),
      this.chompFloat32(),
      this.chompFloat32(),
      this.chompFloat32(),
      this.chompFloat32(),
    )
    return matrix
  }

  chompQuaternion(): THREE.Quaternion {
    return new THREE.Quaternion(this.chompFloat32(), this.chompFloat32(), this.chompFloat32(), this.chompFloat32())
  }

  chompColorRGB24(): THREE.Color {
    const view = this._buffer.slice(this._index, this._index + 3)
    this._index += 3
    const bytes = new Uint8Array(view)
    return new THREE.Color(bytes[0] / 255, bytes[1] / 255, bytes[2] / 255)
  }
}

// File format readers
const readVector3 = (reader: BinaryBufferReader) => {
  return new THREE.Vector3(reader.chompFloat32(), reader.chompFloat32(), reader.chompFloat32())
}

const readVector4 = (reader: BinaryBufferReader) => {
  return new THREE.Vector4(
    reader.chompFloat32(),
    reader.chompFloat32(),
    reader.chompFloat32(),
    reader.chompFloat32(),
  )
}

const readMatrix4 = (reader: BinaryBufferReader) => {
  const matrix = new THREE.Matrix4()
  matrix.set(
    reader.chompFloat32(),
    reader.chompFloat32(),
    reader.chompFloat32(),
    reader.chompFloat32(),
    reader.chompFloat32(),
    reader.chompFloat32(),
    reader.chompFloat32(),
    reader.chompFloat32(),
    reader.chompFloat32(),
    reader.chompFloat32(),
    reader.chompFloat32(),
    reader.chompFloat32(),
    reader.chompFloat32(),
    reader.chompFloat32(),
    reader.chompFloat32(),
    reader.chompFloat32(),
  )
  return matrix
}

const readColor = (reader: BinaryBufferReader) => {
  const r = reader.chompByte() / 255
  const g = reader.chompByte() / 255
  const b = reader.chompByte() / 255
  return new THREE.Color(r, g, b)
}

const readColorWithAlpha = (reader: BinaryBufferReader) => {
  const r = reader.chompByte() / 255
  const g = reader.chompByte() / 255
  const b = reader.chompByte() / 255
  const a = reader.chompByte() / 255
  return [new THREE.Color(r, g, b), a]
}

const readArray = (elementReader: Function, reader: BinaryBufferReader) => {
  const count = reader.chompUint16()
  const result = []
  for (let i = 0; i < count; ++i) {
    result.push(elementReader(reader))
  }
  return result
}

const readTriangle = (reader: BinaryBufferReader) => {
  return [reader.chompUint16(), reader.chompUint16(), reader.chompUint16()]
}

const readUV = (reader: BinaryBufferReader) => {
  return [reader.chompUint16(), reader.chompUint16()]
}

const readVertexBuffer = (reader: BinaryBufferReader, ignoreZero = false) => {
  if (reader.chompByte() === 0) {
    return undefined
  }

  const minX = reader.chompFloat32()
  const minY = reader.chompFloat32()
  const minZ = reader.chompFloat32()
  const maxX = reader.chompFloat32()
  const maxY = reader.chompFloat32()
  const maxZ = reader.chompFloat32()

  const rangeX = maxX - minX
  const rangeY = maxY - minY
  const rangeZ = maxZ - minZ

  const vertices = readArray(readTriangle, reader)

  return new Float32Array(
    vertices.flatMap((vertex) => {
      const [x, y, z] = vertex
      return ignoreZero && x === 0 && y === 0 && z === 0
        ? [0, 0, 0]
        : [rangeX * (x / 65535) + minX, rangeY * (y / 65535) + minY, rangeZ * (z / 65535) + minZ]
    }),
  )
}

const readUVBuffer = (reader: BinaryBufferReader) => {
  if (reader.chompByte() === 0) {
    return undefined
  }

  const minU = reader.chompFloat32()
  const minV = reader.chompFloat32()
  const maxU = reader.chompFloat32()
  const maxV = reader.chompFloat32()

  const rangeU = maxU - minU
  const rangeV = maxV - minV

  const uvs = readArray(readUV, reader)

  return new Float32Array(
    uvs.flatMap((uv) => {
      const [u, v] = uv
      return [rangeU * (u / 65535) + minU, rangeV * (v / 65535) + minV]
    }),
  )
}

const readTransform = (reader: BinaryBufferReader) => {
  return {
    name: reader.chompString(),
    parentIndex: reader.chompInt16(),
    position: new THREE.Vector3(reader.chompFloat32(), reader.chompFloat32(), reader.chompFloat32()),
    rotation: new THREE.Quaternion(
      reader.chompFloat32(),
      reader.chompFloat32(),
      reader.chompFloat32(),
      reader.chompFloat32(),
    ),
    scale: new THREE.Vector3(reader.chompFloat32(), reader.chompFloat32(), reader.chompFloat32()),
    meshIndex: reader.chompInt16(),
  }
}

const readSubmesh = (reader: BinaryBufferReader) => {
  const indexCount = reader.chompUint16()
  const indexBuffer = reader.chompUint16Array(indexCount)
  return { indexBuffer }
}

const readSubmeshWithMaterial = (reader: BinaryBufferReader) => {
  const materialIndex = reader.chompInt16()
  const indexCount = reader.chompUint16()
  const indexBuffer = reader.chompUint16Array(indexCount)
  return { materialIndex, indexBuffer }
}

const readBoneWeight = (reader: BinaryBufferReader) => {
  return {
    boneIndex0: reader.chompUint16(),
    boneIndex1: reader.chompUint16(),
    boneIndex2: reader.chompUint16(),
    boneIndex3: reader.chompUint16(),
    weight0: reader.chompFloat32(),
    weight1: reader.chompFloat32(),
    weight2: reader.chompFloat32(),
    weight3: reader.chompFloat32(),
  }
}

const readSkinnedMesh = (reader: BinaryBufferReader) => {
  const normalCount = reader.chompUint16()
  const normalBuffer = reader.chompFloat32Array(normalCount * 3)

  const vertexCount = reader.chompUint16()
  const vertexBuffer = reader.chompFloat32Array(vertexCount * 3)

  return {
    normalBuffer,
    vertexBuffer,
    submeshes: readArray(readSubmeshWithMaterial, reader),
    bindposes: readArray(readMatrix4, reader),
    bones: readArray((r: BinaryBufferReader) => r.chompUint16(), reader),
    boneWeights: readArray(readBoneWeight, reader),
  }
}

const readTexture = (reader: BinaryBufferReader) => {
  const format = reader.chompByte()
  const size = reader.chompUint32()
  const data = reader.chompByteArray(size)

  if (typeof btoa !== "undefined") {
    let binary = ""
    for (let i = 0; i < data.length; ++i) {
      binary += String.fromCharCode(data[i])
    }
    const base64 = btoa(binary)

    switch (format) {
      case 0:
        return `data:image/png;base64,${base64}`
      case 1:
        return `data:image/jpeg;base64,${base64}`
      default:
        throw new Error("Unsupported texture format")
    }
  }

  return null
}

const readMaterial = (reader: BinaryBufferReader) => {
  const features = reader.chompByte()
  const result: any = { features }

  if ((features & 128) !== 0) {
    result.features2 = reader.chompByte()
  }

  if ((features & 1) !== 0) {
    const [color, alpha] = readColorWithAlpha(reader)
    result.color = color
    result.colorAlpha = alpha
  }

  if ((features & 2) !== 0) {
    result.colorMapIndex = reader.chompUint16()
  }

  if ((features & 4) !== 0) {
    result.emissionColor = readColor(reader)
  }

  if ((features & 8) !== 0) {
    result.emissionMapIndex = reader.chompUint16()
  }

  if ((features & 16) !== 0) {
    result.emissionIntensity = reader.chompFloat32()
  }

  if ((features & 32) !== 0) {
    result.metallic = reader.chompFloat32()
  }

  if ((features & 64) !== 0) {
    result.metallicMapIndex = reader.chompUint16()
  }

  if ((features & 128) !== 0) {
    if ((result.features2 & 1) !== 0) {
      result.roughness = reader.chompFloat32()
    }

    if ((result.features2 & 2) !== 0) {
      result.roughnessMapIndex = reader.chompInt16()
    }

    if ((result.features2 & 4) !== 0) {
      result.occlusionMapIndex = reader.chompInt16()
    }

    if ((result.features2 & 8) !== 0) {
      result.occlusionMultiplier = reader.chompFloat32()
    }

    if ((result.features2 & 16) !== 0) {
      result.normalMapIndex = reader.chompInt16()
    }

    if ((result.features2 & 32) !== 0) {
      result.uvScaleOffset = new THREE.Vector4(
        reader.chompFloat32(),
        reader.chompFloat32(),
        reader.chompFloat32(),
        reader.chompFloat32(),
      )
    }
  }

  return result
}

const readToonMaterial = (reader: BinaryBufferReader) => {
  return {
    color: readColorWithAlpha(reader)[0],
    mainTextureIndex: reader.chompUint16(),
    ambientColor: new THREE.Vector4(
      reader.chompFloat32(),
      reader.chompFloat32(),
      reader.chompFloat32(),
      reader.chompFloat32(),
    ),
    specularColor: new THREE.Vector4(
      reader.chompFloat32(),
      reader.chompFloat32(),
      reader.chompFloat32(),
      reader.chompFloat32(),
    ),
    glossiness: reader.chompFloat32(),
    rimColor: new THREE.Vector4(
      reader.chompFloat32(),
      reader.chompFloat32(),
      reader.chompFloat32(),
      reader.chompFloat32(),
    ),
    rimAmount: reader.chompFloat32(),
    rimThreshold: reader.chompFloat32(),
    outlineThickness: reader.chompFloat32(),
    outlineColor: readColorWithAlpha(reader)[0],
  }
}

const readUnlitColorMaterial = (reader: BinaryBufferReader) => {
  return {
    color: readColor(reader),
  }
}

const readMaterialEx = (reader: BinaryBufferReader) => {
  const shader = reader.chompByte()
  let material = null

  switch (shader) {
    case 0:
      material = readMaterial(reader)
      break
    case 1:
      material = readToonMaterial(reader)
      break
    case 2:
      material = readUnlitColorMaterial(reader)
      break
  }

  return {
    shader,
    material,
  }
}

const readEVSkinnedModelFile = (reader: BinaryBufferReader) => {
  const magic = reader.chompByte()
  const features = reader.chompByte()

  if (magic !== 4) {
    throw new Error(
      "evskin file format error: expected first byte to be 0x04. The file being parsed is probably not an evskin.",
    )
  }

  const result: any = {
    features,
    textures: readArray(readTexture, reader),
  }

  if ((features & 8) !== 0) {
    result.materialsEx = readArray(readMaterialEx, reader)
  } else {
    result.materials = readArray(readMaterial, reader)
  }

  result.transforms = readArray(readTransform, reader)
  result.meshes = readArray(readSkinnedMesh, reader)

  return result
}

// Material builders
const buildEVMaterial = (
  material: any,
  shadowStrength: number,
  useShadowHack: boolean,
  textures: Promise<THREE.Texture>[],
  lightmapIndex: number,
  skinning: boolean,
) => {
  const shadowInvStrength = (1 - shadowStrength).toString()

  const defines: any = {
    TOON: "",
    SHADOW_INV_STRENGTH: shadowInvStrength,
  }

  const materialOptions: any = {
    color: material.color,
    opacity: material.colorAlpha,
    transparent: material.colorAlpha < 0.99,
    dithering: true,
    skinning,
    shadowSide: THREE.DoubleSide,
    defines,
  }

  if (useShadowHack) {
    materialOptions.defines.EV_USE_SHADOW_HACK = ""
  }

  // Load gradient map for toon shading
  const gradientMapPromise = new THREE.TextureLoader().loadAsync(
    "https://threejs.org/examples/textures/gradientMaps/threeTone.jpg",
  )
  gradientMapPromise.then((texture) => {
    materialOptions.gradientMap = texture
    threeMaterial.needsUpdate = true
  })

  if ((material.features & 2) !== 0) {
    textures[material.colorMapIndex].then((texture) => {
      threeMaterial.map = texture
      threeMaterial.needsUpdate = true
    })
  }

  if ((material.features & 4) !== 0) {
    // Enhance emission color intensity for better glow effect
    materialOptions.emissive = material.emissionColor
    if (material.emissionColor.r > 0.5 || material.emissionColor.g > 0.5 || material.emissionColor.b > 0.5) {
      // Boost bright emission colors
      materialOptions.emissive = new THREE.Color(
        Math.min(material.emissionColor.r * 1.5, 1),
        Math.min(material.emissionColor.g * 1.5, 1),
        Math.min(material.emissionColor.b * 1.5, 1),
      )
    }
  }

  if ((material.features & 8) !== 0) {
    textures[material.emissionMapIndex].then((texture) => {
      threeMaterial.emissiveMap = texture
      threeMaterial.needsUpdate = true
    })
  }

  if ((material.features & 16) !== 0) {
    // Enhance emission intensity for better glow
    materialOptions.emissiveIntensity = material.emissionIntensity * 1.5
  } else if ((material.features & 4) !== 0) {
    // Add default emission intensity if emission color is present but no intensity specified
    materialOptions.emissiveIntensity = 1.2
  }

  // Use MeshStandardMaterial for better PBR rendering
  const threeMaterial = new THREE.MeshStandardMaterial(materialOptions)

  // Add some metalness and roughness for better material appearance
  threeMaterial.metalness = 0.3
  threeMaterial.roughness = 0.7

  if (lightmapIndex >= 0) {
    textures[lightmapIndex].then((texture) => {
      threeMaterial.lightMap = texture
      threeMaterial.needsUpdate = true
    })
  }

  return threeMaterial
}

const buildEVMaterialEx = (
  materialEx: any,
  shadowStrength: number,
  useShadowHack: boolean,
  textures: Promise<THREE.Texture>[],
  lightmapIndex: number,
  skinning: boolean,
) => {
  switch (materialEx.shader) {
    case 0:
      return buildEVMaterial(materialEx.material, shadowStrength, useShadowHack, textures, lightmapIndex, skinning)
    case 2:
      return new THREE.MeshBasicMaterial({
        color: materialEx.material.color,
        shadowSide: THREE.DoubleSide,
      })
    default:
      return new THREE.MeshBasicMaterial({ color: 0xff00ff })
  }
}

const buildMaterialInstanceSet = (
  materials: any[],
  shadowStrength: number,
  useShadowHack: boolean,
  lightmapIndices: number[][],
  textures: Promise<THREE.Texture>[],
  skinning: boolean,
) => {
  return materials.map((material, index) => {
    const result: any = {
      [-1]: buildEVMaterial(material, shadowStrength, useShadowHack, textures, -1, skinning),
    }

    if (index < lightmapIndices.length) {
      lightmapIndices[index].forEach((lightmapIndex) => {
        result[lightmapIndex] = buildEVMaterial(
          material,
          shadowStrength,
          useShadowHack,
          textures,
          lightmapIndex,
          skinning,
        )
      })
    }

    return result
  })
}

const buildMaterialInstanceSetEx = (
  materialsEx: any[],
  shadowStrength: number,
  useShadowHack: boolean,
  lightmapIndices: number[][],
  textures: Promise<THREE.Texture>[],
  skinning: boolean,
) => {
  return materialsEx.map((materialEx, index) => {
    const result: any = {
      [-1]: buildEVMaterialEx(materialEx, shadowStrength, useShadowHack, textures, -1, skinning),
    }

    if (index < lightmapIndices.length) {
      lightmapIndices[index].forEach((lightmapIndex) => {
        result[lightmapIndex] = buildEVMaterialEx(
          materialEx,
          shadowStrength,
          useShadowHack,
          textures,
          lightmapIndex,
          skinning,
        )
      })
    }

    return result
  })
}

// Model builders
const buildTransformHierarchy = (transforms: any[]) => {
  const objects = transforms.map((transform, index) => {
    const object = new THREE.Group()
    object.name = transform.name
    return object
  })

  let root: THREE.Object3D | null = null
  const rootObjects = []

  for (let i = 0; i < objects.length; ++i) {
    const transform = transforms[i]

    if (transform.parentIndex >= 0) {
      objects[transform.parentIndex].add(objects[i])
    } else {
      rootObjects.push(objects[i])
    }
  }

  if (rootObjects.length === 1) {
    root = rootObjects[0]
  } else {
    root = new THREE.Group()
    root.name = "SkinnedModel"
    rootObjects.forEach((obj) => root!.add(obj))
  }

  for (let i = 0; i < objects.length; ++i) {
    const transform = transforms[i]
    objects[i].position.copy(transform.position)
    objects[i].quaternion.copy(transform.rotation)
    objects[i].scale.copy(transform.scale)
  }

  return [root, objects]
}

const buildSkinnedMeshes = (meshes: any[], bones: THREE.Object3D[], materials: any[][]) => {
  return meshes.map((mesh) => {
    const geometry = new THREE.BufferGeometry()

    geometry.setAttribute("normal", new THREE.Float32BufferAttribute(mesh.normalBuffer, 3))
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(mesh.vertexBuffer, 3))

    const skinWeights = mesh.boneWeights.flatMap((bw: any) => [bw.weight0, bw.weight1, bw.weight2, bw.weight3])
    const skinIndices = mesh.boneWeights.flatMap((bw: any) => [
      bw.boneIndex0,
      bw.boneIndex1,
      bw.boneIndex2,
      bw.boneIndex3,
    ])

    geometry.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(skinIndices, 4))
    geometry.setAttribute("skinWeight", new THREE.Float32BufferAttribute(skinWeights, 4))

    const offsets = [0]
    const indices = mesh.submeshes.flatMap((submesh: any, i: number) => {
      offsets[i + 1] = offsets[i] + submesh.indexBuffer.length
      return Array.from(submesh.indexBuffer)
    })

    geometry.setIndex(indices)

    for (let i = 0; i < mesh.submeshes.length; ++i) {
      geometry.addGroup(offsets[i], mesh.submeshes[i].indexBuffer.length, mesh.submeshes[i].materialIndex)
    }

    const meshMaterials = mesh.submeshes.map((submesh: any) => materials[submesh.materialIndex])
    const isOpaque = meshMaterials.reduce((acc: boolean, mat: any) => acc && (!mat || !mat.transparent), true)

    const skinnedMesh = new THREE.SkinnedMesh(geometry, materials)
    skinnedMesh.castShadow = true // Enable shadow casting
    skinnedMesh.receiveShadow = isOpaque

    const skeletonBones: THREE.Bone[] = []
    mesh.bones.forEach((boneIndex: number) => {
      skeletonBones.push(bones[boneIndex] as THREE.Bone)
    })

    skinnedMesh.skeleton = new THREE.Skeleton(skeletonBones, mesh.bindposes)

    return skinnedMesh
  })
}

export class SkinnedModel {
  threeObject: THREE.Object3D

  constructor(buffer: ArrayBuffer, shadowStrength: number) {
    const reader = new BinaryBufferReader(buffer)
    const modelFile = readEVSkinnedModelFile(reader)

    const texturePromises = modelFile.textures.map((textureData: string) => {
      return new Promise<THREE.Texture>((resolve) => {
        new THREE.TextureLoader().load(textureData, (texture) => {
          texture.wrapS = THREE.RepeatWrapping
          texture.wrapT = THREE.RepeatWrapping
          resolve(texture)
        })
      })
    })

    const [rootObject, transformObjects] = buildTransformHierarchy(modelFile.transforms)

    const materials =
      (modelFile.features & 8) !== 0
        ? modelFile.materialsEx.map((materialEx: any) =>
            buildEVMaterialEx(materialEx, shadowStrength, false, texturePromises, -1, true),
          )
        : modelFile.materials.map((material: any) =>
            buildEVMaterial(material, shadowStrength, false, texturePromises, -1, true),
          )

    const meshes = buildSkinnedMeshes(modelFile.meshes, transformObjects, materials)

    transformObjects.forEach((obj, i) => {
      if (modelFile.transforms[i].meshIndex >= 0) {
        obj.add(meshes[modelFile.transforms[i].meshIndex])
      }
    })

    rootObject.scale.x = -1
    this.threeObject = rootObject
  }
}

// Main function to load an evskin model
export function loadEVSkinModel(buffer: ArrayBuffer): THREE.Object3D {
  const model = new SkinnedModel(buffer, 0)
  return model.threeObject
}
