import type { BinaryBufferReader } from "./binary-buffer-reader"

// Helper functions for parsing EV model formats
export function readMultiple<T>(reader: BinaryBufferReader, parser: (reader: BinaryBufferReader) => T): T[] {
  const count = reader.chompUint16()
  const result: T[] = []
  for (let i = 0; i < count; ++i) {
    result.push(parser(reader))
  }
  return result
}

export function readTriangleIndices(reader: BinaryBufferReader): [number, number, number] {
  return [reader.chompUint16(), reader.chompUint16(), reader.chompUint16()]
}

export function readUVIndices(reader: BinaryBufferReader): [number, number] {
  return [reader.chompUint16(), reader.chompUint16()]
}

export function readVertexBuffer(reader: BinaryBufferReader, ignoreZero = false): Float32Array | undefined {
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

  const indices = readMultiple(reader, readTriangleIndices)

  return new Float32Array(
    indices.flatMap(([x, y, z]) => {
      if (ignoreZero && x === 0 && y === 0 && z === 0) {
        return [0, 0, 0]
      }
      return [rangeX * (x / 65535) + minX, rangeY * (y / 65535) + minY, rangeZ * (z / 65535) + minZ]
    }),
  )
}

export function readUVBuffer(reader: BinaryBufferReader): Float32Array | undefined {
  if (reader.chompByte() === 0) {
    return undefined
  }

  const minU = reader.chompFloat32()
  const minV = reader.chompFloat32()
  const maxU = reader.chompFloat32()
  const maxV = reader.chompFloat32()

  const rangeU = maxU - minU
  const rangeV = maxV - minV

  const indices = readMultiple(reader, readUVIndices)

  return new Float32Array(indices.flatMap(([u, v]) => [rangeU * (u / 65535) + minU, rangeV * (v / 65535) + minV]))
}

export function readTransform(reader: BinaryBufferReader) {
  return {
    name: reader.chompString(),
    parentIndex: reader.chompInt16(),
    position: reader.chompVector3(),
    rotation: reader.chompQuaternion(),
    scale: reader.chompVector3(),
    meshIndex: reader.chompInt16(),
  }
}

export function readSubmesh(reader: BinaryBufferReader) {
  const indexCount = reader.chompUint16()
  const indexBuffer = reader.chompUint16Array(indexCount)

  return {
    indexBuffer,
  }
}

export function readSubmeshWithMaterial(reader: BinaryBufferReader) {
  const materialIndex = reader.chompInt16()
  const indexCount = reader.chompUint16()
  const indexBuffer = reader.chompUint16Array(indexCount)

  return {
    materialIndex,
    indexBuffer,
  }
}

export function readBoneWeight(reader: BinaryBufferReader) {
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

export function readSkinnedMesh(reader: BinaryBufferReader) {
  const normalCount = reader.chompUint16()
  const normalBuffer = reader.chompFloat32Array(normalCount * 3)

  const vertexCount = reader.chompUint16()
  const vertexBuffer = reader.chompFloat32Array(vertexCount * 3)

  return {
    normalBuffer,
    vertexBuffer,
    submeshes: readMultiple(reader, readSubmeshWithMaterial),
    bindposes: readMultiple(reader, (r) => r.chompMatrix4()),
    bones: readMultiple(reader, (r) => r.chompUint16()),
    boneWeights: readMultiple(reader, readBoneWeight),
  }
}

export function readMesh(reader: BinaryBufferReader) {
  const features = reader.chompByte()
  const result: any = { features }

  result.vertexBuffer = readVertexBuffer(reader)
  result.submeshes = readMultiple(reader, readSubmesh)

  if ((features & 1) !== 0) {
    result.normalBuffer = readVertexBuffer(reader)
  }

  if ((features & 2) !== 0) {
    result.uvBuffer = readUVBuffer(reader)
  }

  if ((features & 4) !== 0) {
    result.lightUvBuffer = readUVBuffer(reader)
  }

  return result
}

export function readTexture(reader: BinaryBufferReader) {
  const format = reader.chompByte()
  const dataLength = reader.chompUint32()
  const data = reader.chompByteArray(dataLength)

  // Convert binary data to base64 string
  let base64 = ""
  for (let i = 0; i < data.length; ++i) {
    base64 += String.fromCharCode(data[i])
  }

  const base64Data = btoa(base64)

  switch (format) {
    case 0:
      return `data:image/png;base64,${base64Data}`
    case 1:
      return `data:image/jpeg;base64,${base64Data}`
    default:
      throw new Error(`Unsupported texture format: ${format}`)
  }
}

export function readMaterial(reader: BinaryBufferReader) {
  const features = reader.chompByte()
  const result: any = { features }

  let features2 = 0
  if ((features & 128) !== 0) {
    features2 = reader.chompByte()
    result.features2 = features2
  }

  if ((features & 1) !== 0) {
    const [color, alpha] = reader.chompColorRGBA()
    result.color = color
    result.colorAlpha = alpha
  }

  if ((features & 2) !== 0) {
    result.colorMapIndex = reader.chompUint16()
  }

  if ((features & 4) !== 0) {
    result.emissionColor = reader.chompColorRGB()
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
    if ((features2 & 1) !== 0) {
      result.roughness = reader.chompFloat32()
    }

    if ((features2 & 2) !== 0) {
      result.roughnessMapIndex = reader.chompInt16()
    }

    if ((features2 & 4) !== 0) {
      result.occlusionMapIndex = reader.chompInt16()
    }

    if ((features2 & 8) !== 0) {
      result.occlusionMultiplier = reader.chompFloat32()
    }

    if ((features2 & 16) !== 0) {
      result.normalMapIndex = reader.chompInt16()
    }

    if ((features2 & 32) !== 0) {
      result.uvScaleOffset = reader.chompVector4()
    }
  }

  return result
}

export function readMaterialEx(reader: BinaryBufferReader) {
  const shader = reader.chompByte()
  let material = null

  switch (shader) {
    case 0:
      material = readMaterial(reader)
      break
    case 1:
      // Toon material
      material = readToonMaterial(reader)
      break
    case 2:
      // Unlit color material
      material = readUnlitColorMaterial(reader)
      break
  }

  return {
    shader,
    material,
  }
}

export function readToonMaterial(reader: BinaryBufferReader) {
  const [color] = reader.chompColorRGBA()

  return {
    color,
    mainTextureIndex: reader.chompUint16(),
    ambientColor: reader.chompVector4(),
    specularColor: reader.chompVector4(),
    glossiness: reader.chompFloat32(),
    rimColor: reader.chompVector4(),
    rimAmount: reader.chompFloat32(),
    rimThreshold: reader.chompFloat32(),
    outlineThickness: reader.chompFloat32(),
    outlineColor: reader.chompColorRGB(),
  }
}

export function readUnlitColorMaterial(reader: BinaryBufferReader) {
  return {
    color: reader.chompColorRGB(),
  }
}

export function readObject(reader: BinaryBufferReader) {
  const features = reader.chompByte()
  const result: any = { features }

  result.transform = {
    position: reader.chompVector3(),
    rotation: reader.chompQuaternion(),
    scale: reader.chompVector3(),
  }

  result.children = readMultiple(reader, readObject)

  if ((features & 1) !== 0) {
    result.name = reader.chompString()
  }

  if (features !== 0) {
    result.targetObjectIndex = reader.chompUint16()
  }

  if ((features & 2) !== 0) {
    result.materialIndices = readMultiple(reader, (r) => r.chompUint16())
  }

  if ((features & 8) !== 0) {
    result.lightmapTextureIndex = reader.chompUint16()
    result.lightmapTilingX = reader.chompFloat32()
    result.lightmapTilingY = reader.chompFloat32()
    result.lightmapOffsetX = reader.chompFloat32()
    result.lightmapOffsetY = reader.chompFloat32()
  }

  return result
}

export function readEVSkinnedModelFile(reader: BinaryBufferReader) {
  const formatByte = reader.chompByte()
  const featuresByte = reader.chompByte()

  if (formatByte !== 4) {
    throw new Error(
      "evskin file format error: expected first byte to be 0x04. The file being parsed is probably not an evskin.",
    )
  }

  const result: any = {
    features: featuresByte,
    textures: readMultiple(reader, readTexture),
  }

  if ((featuresByte & 8) !== 0) {
    result.materialsEx = readMultiple(reader, readMaterialEx)
  } else {
    result.materials = readMultiple(reader, readMaterial)
  }

  result.transforms = readMultiple(reader, readTransform)
  result.meshes = readMultiple(reader, readSkinnedMesh)

  // Skip additional data that we don't need for rendering
  if ((featuresByte & 1) !== 0) {
    reader.chompString()
    readMultiple(reader, (r) => r.chompString())
  }

  if ((featuresByte & 2) !== 0) {
    reader.chompString()
    readMultiple(reader, (r) => readMultiple(r, (r2) => r2.chompString()))
  }

  return result
}

export function readEVObjectModelFile(reader: BinaryBufferReader) {
  const formatByte = reader.chompByte()
  const featuresByte = reader.chompByte()

  if (formatByte !== 6) {
    throw new Error(  
      "evobj file format error: expected first byte to be 0x06. The file being parsed is probably not an evobj.",
    )
  }

  const result: any = {
    features: featuresByte,
    meshes: readMultiple(reader, readMesh),
    textures: readMultiple(reader, readTexture),
  }

  if ((featuresByte & 4) !== 0) {
    result.materialsEx = readMultiple(reader, readMaterialEx)
  } else {
    result.materials = readMultiple(reader, readMaterial)
  }

  result.rootObject = readObject(reader)

  if ((featuresByte & 1) !== 0) {
    result.firstPersonOffset = reader.chompVector3()
  }

  if ((featuresByte & 2) !== 0) {
    result.playerBindPos = reader.chompVector3()
    result.playerBindRot = reader.chompQuaternion()
    result.playerBindScale = reader.chompVector3()
    result.playerBindParent = reader.chompString()
  }

  return result
}
