import * as THREE from "three"
import type { BinaryBufferReader } from "./binary-buffer-reader"
import { readEVSkinnedModelFile, readEVObjectModelFile } from "./ev-model-parser"

// Custom Toon Shader for .evobj files
const toonVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const toonFragmentShader = `
  uniform vec3 color;
  uniform sampler2D map;
  uniform bool hasTexture;
  uniform vec3 emissive;
  uniform float emissiveIntensity;
  uniform sampler2D emissiveMap;
  uniform bool hasEmissiveMap;
  uniform float opacity;
  
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  
  void main() {
    vec3 normal = normalize(vNormal);
    vec3 lightDirection = normalize(vec3(1.0, 1.0, 1.0));
    
    // Calculate lighting
    float NdotL = dot(normal, lightDirection);
    
    // Toon shading - quantize the lighting into discrete steps
    float toonShading = 1.0;
    if (NdotL > 0.8) {
      toonShading = 1.0;
    } else if (NdotL > 0.5) {
      toonShading = 0.8;
    } else if (NdotL > 0.2) {
      toonShading = 0.6;
    } else {
      toonShading = 0.4;
    }
    
    // Base color
    vec3 baseColor = color;
    if (hasTexture) {
      vec4 texColor = texture2D(map, vUv);
      baseColor *= texColor.rgb;
    }
    
    // Apply toon shading
    vec3 finalColor = baseColor * toonShading;
    
    // Add emissive
    vec3 emissiveColor = emissive * emissiveIntensity;
    if (hasEmissiveMap) {
      vec4 emissiveTex = texture2D(emissiveMap, vUv);
      emissiveColor *= emissiveTex.rgb;
    }
    finalColor += emissiveColor;
    
    // Add ambient lighting
    finalColor += baseColor * 0.3;
    
    gl_FragColor = vec4(finalColor, opacity);
  }
`

// Create a material from the parsed material data
function createMaterial(materialData: any, textures: THREE.Texture[]): THREE.Material {
  if (!materialData) {
    return new THREE.MeshBasicMaterial({ color: 0xff00ff, wireframe: true })
  }

  // Handle material data based on whether it's from evskin or evobj
  const materialProps = materialData.material || materialData

  if (materialData.shader === 2) {  
    // Unlit color material
    return new THREE.MeshBasicMaterial({
      color: materialProps.color,
      transparent: materialProps.colorAlpha < 0.99,
      opacity: materialProps.colorAlpha,
    })
  } else if (materialData.shader === 1) {
    // Toon material - use custom toon shader for better visual consistency
    const uniforms = {
      color: { value: materialProps.color || new THREE.Color(0xffffff) },
      map: { value: null },
      hasTexture: { value: false },
      emissive: { value: new THREE.Color(0, 0, 0) },
      emissiveIntensity: { value: 1.0 },
      emissiveMap: { value: null },
      hasEmissiveMap: { value: false },
      opacity: { value: materialProps.colorAlpha || 1.0 },
    }

    // Apply main texture if available
    if (materialProps.mainTextureIndex !== undefined && textures[materialProps.mainTextureIndex]) {
      uniforms.map.value = textures[materialProps.mainTextureIndex]
      uniforms.hasTexture.value = true
    }

    const toonMaterial = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: toonVertexShader,
      fragmentShader: toonFragmentShader,
      transparent: materialProps.colorAlpha < 0.99,
      side: THREE.DoubleSide,
    })

    // Set toon material properties in userData for potential future use
    if (materialProps.ambientColor) {
      toonMaterial.userData.ambientColor = materialProps.ambientColor
    }
    if (materialProps.specularColor) {
      toonMaterial.userData.specularColor = materialProps.specularColor
    }
    if (materialProps.rimColor) {
      toonMaterial.userData.rimColor = materialProps.rimColor
    }
    toonMaterial.userData.glossiness = materialProps.glossiness || 0
    toonMaterial.userData.rimAmount = materialProps.rimAmount || 0
    toonMaterial.userData.rimThreshold = materialProps.rimThreshold || 0
    toonMaterial.userData.outlineThickness = materialProps.outlineThickness || 0
    toonMaterial.userData.outlineColor = materialProps.outlineColor || new THREE.Color(0x000000)

    return toonMaterial
  }

  // Standard material (shader type 0) - use custom toon shader for consistency
  const uniforms = {
    color: { value: materialProps.color || new THREE.Color(0xffffff) },
    map: { value: null },
    hasTexture: { value: false },
    emissive: { value: materialProps.emissionColor || new THREE.Color(0, 0, 0) },
    emissiveIntensity: { value: materialProps.emissionIntensity || 1.0 },
    emissiveMap: { value: null },
    hasEmissiveMap: { value: false },
    opacity: { value: materialProps.colorAlpha || 1.0 },
  }

  // Apply textures if available
  if (materialProps.colorMapIndex !== undefined && textures[materialProps.colorMapIndex]) {
    uniforms.map.value = textures[materialProps.colorMapIndex]
    uniforms.hasTexture.value = true
  }

  if (materialProps.emissionMapIndex !== undefined && textures[materialProps.emissionMapIndex]) {
    uniforms.emissiveMap.value = textures[materialProps.emissionMapIndex]
    uniforms.hasEmissiveMap.value = true
  }

  const toonMaterial = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: toonVertexShader,
    fragmentShader: toonFragmentShader,
    transparent: materialProps.colorAlpha < 0.99,
    side: THREE.DoubleSide,
  })

  // Store original material properties in userData
  toonMaterial.userData.metalness = materialProps.metallic || 0
  toonMaterial.userData.roughness = 1.0 - (materialProps.glossiness || 0)

  return toonMaterial
}

// Load textures from the parsed texture data
async function loadTextures(textureUrls: string[]): Promise<THREE.Texture[]> {
  const textureLoader = new THREE.TextureLoader()
  const textures: THREE.Texture[] = []

  for (const url of textureUrls) {
    try {
      const texture = await new Promise<THREE.Texture>((resolve, reject) => {
        textureLoader.load(
          url,
          (texture: THREE.Texture) => {
            texture.wrapS = THREE.RepeatWrapping
            texture.wrapT = THREE.RepeatWrapping
            resolve(texture)
          },
          undefined,
          reject,
        )
      })
      textures.push(texture)
    } catch (error) {
      console.error("Failed to load texture:", error)
      textures.push(new THREE.Texture())
    }
  }

  return textures
}

// Build a hierarchy of transforms
function buildTransformHierarchy(transforms: any[]): [THREE.Object3D, THREE.Object3D[]] {
  const objects = transforms.map((transform) => {
    const obj = new THREE.Object3D()
    obj.name = transform.name
    return obj
  })

  let rootObject: THREE.Object3D | null = null
  const rootObjects = []

  for (let i = 0; i < transforms.length; i++) {
    const transform = transforms[i]
    const obj = objects[i]

    obj.position.copy(transform.position)
    obj.quaternion.copy(transform.rotation)
    obj.scale.copy(transform.scale)

    if (transform.parentIndex >= 0) {
      objects[transform.parentIndex].add(obj)
    } else {
      rootObjects.push(obj)
    }
  }

  if (rootObjects.length === 1) {
    rootObject = rootObjects[0] 
  } else {
    rootObject = new THREE.Group()
    rootObject.name = "Model"
    rootObjects.forEach((obj) => rootObject.add(obj))
  }

  return [rootObject, objects]
}

// Create a skinned mesh from the parsed mesh data
function createSkinnedMesh(meshData: any, materials: THREE.Material[]): THREE.SkinnedMesh {
  const geometry = new THREE.BufferGeometry()

  // Set vertex positions
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(meshData.vertexBuffer, 3))

  // Set normals if available
  if (meshData.normalBuffer) {
    geometry.setAttribute("normal", new THREE.Float32BufferAttribute(meshData.normalBuffer, 3))
  }

  // Set up bone indices and weights for skinning
  const skinIndices: number[] = []
  const skinWeights: number[] = []

  meshData.boneWeights.forEach((bw: any) => {
    // Ensure bone indices are valid
    skinIndices.push(
      Math.max(0, bw.boneIndex0),
      Math.max(0, bw.boneIndex1),
      Math.max(0, bw.boneIndex2),
      Math.max(0, bw.boneIndex3)
    )

    // Normalize weights to ensure they sum to 1
    const sum = bw.weight0 + bw.weight1 + bw.weight2 + bw.weight3
    if (sum > 0) {
      const scale = 1.0 / sum
      skinWeights.push(
        bw.weight0 * scale,
        bw.weight1 * scale,
        bw.weight2 * scale,
        bw.weight3 * scale
      )
    }
     else {
      skinWeights.push(1, 0, 0, 0)
    }
  })

  geometry.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(skinIndices, 4))
  geometry.setAttribute("skinWeight", new THREE.Float32BufferAttribute(skinWeights, 4))

  // Set up submeshes with indices
  let indexOffset = 0
  const indices: number[] = []

  meshData.submeshes.forEach((submesh: any) => {
    const submeshIndices = Array.from(submesh.indexBuffer).map((index: any) => Number(index))
    indices.push(...submeshIndices)

    // Add material group
    geometry.addGroup(indexOffset, submeshIndices.length, submesh.materialIndex)
    indexOffset += submeshIndices.length
  })

  geometry.setIndex(indices)

  // Create the skinned mesh
  const mesh = new THREE.SkinnedMesh(geometry, materials)
  mesh.castShadow = true
  mesh.receiveShadow = true

  // Set bind matrix if available
  if (meshData.bindMatrix) {
    mesh.bindMatrix.fromArray(meshData.bindMatrix)
    mesh.bindMatrixInverse.copy(mesh.bindMatrix).invert()
  }

  return mesh
}

// Create a standard mesh from the parsed mesh data
function createMesh(meshData: any, materials: THREE.Material[]): THREE.Mesh {
  const geometry = new THREE.BufferGeometry()

  // Set vertex positions
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(meshData.vertexBuffer, 3))

  // Set normals if available
  if (meshData.normalBuffer) {
    geometry.setAttribute("normal", new THREE.Float32BufferAttribute(meshData.normalBuffer, 3))
  }

  // Set UVs if available
  if (meshData.uvBuffer) {
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(meshData.uvBuffer, 2))
  }

  // Set up submeshes with indices
  let indexOffset = 0
  const indices: number[] = []

  meshData.submeshes.forEach((submesh: any, index: number) => {
    const submeshIndices = Array.from(submesh.indexBuffer as number[])
    indices.push(...submeshIndices)

    // For object models, we don't have material indices in the submesh
    geometry.addGroup(indexOffset, submeshIndices.length, index)
    indexOffset += submeshIndices.length
  })

  geometry.setIndex(indices)

  // Create the mesh
  const mesh = new THREE.Mesh(geometry, materials)
  mesh.castShadow = true
  mesh.receiveShadow = true

  return mesh
}

// Build the object hierarchy for an object model
function buildObjectHierarchy(rootObject: any, meshes: any[], materials: THREE.Material[]): THREE.Object3D {
  const group = new THREE.Group()

  // Set transform
  group.position.copy(rootObject.transform.position)
  group.quaternion.copy(rootObject.transform.rotation)
  group.scale.copy(rootObject.transform.scale)

  // Set name if available
  if (rootObject.name) {
    group.name = rootObject.name
  }

  // Add mesh if this object has one
  if (rootObject.targetObjectIndex !== undefined && rootObject.materialIndices) {
    const meshData = meshes[rootObject.targetObjectIndex]
    const meshMaterials = rootObject.materialIndices.map((index: number) => materials[index])
    const mesh = createMesh(meshData, meshMaterials)
    group.add(mesh)
  }

  // Process children recursively
  if (rootObject.children) {
    rootObject.children.forEach((child: any) => {
      const childObject = buildObjectHierarchy(child, meshes, materials)
      group.add(childObject)
    })
  }

  return group
}

export async function loadEVSkinnedModel(reader: BinaryBufferReader): Promise<THREE.Object3D> {
  try {
    // Parse the model file
    const modelData = readEVSkinnedModelFile(reader)

    // Load textures
    const textures = await loadTextures(modelData.textures)

    // Create materials
    const materials = (modelData.materialsEx || modelData.materials).map((material: any) =>
      createMaterial(material, textures),
    )

    // Build transform hierarchy
    const [rootObject, objects] = buildTransformHierarchy(modelData.transforms)
    

    // Create skinned meshes
    modelData.meshes.forEach((meshData: any, index: number) => {
      const mesh = createSkinnedMesh(meshData, materials)

      // Find the transform that uses this mesh
      for (let i = 0; i < modelData.transforms.length; i++) {
        if (modelData.transforms[i].meshIndex === index) {
          objects[i].add(mesh)

          // Set up skeleton
          const bones: THREE.Bone[] = []
          const boneMap = new Map<number, THREE.Bone>()

          // First pass: Create all bones
          meshData.bones.forEach((boneIndex: number) => {
            const bone = new THREE.Bone()
            const transform = modelData.transforms[boneIndex]

            // Apply transform
            bone.position.copy(transform.position)
            bone.quaternion.copy(transform.rotation)
            bone.scale.copy(transform.scale)

            bones.push(bone)
            boneMap.set(boneIndex, bone)
          })

          // Second pass: Set up hierarchy
          meshData.bones.forEach((boneIndex: number) => {
            const transform = modelData.transforms[boneIndex]
            const bone = boneMap.get(boneIndex)

            if (bone && transform.parentIndex >= 0) {
              const parentBone = boneMap.get(transform.parentIndex)
              if (parentBone && parentBone !== bone) {
                parentBone.add(bone)
              }
            }
          })

          // Create and bind skeleton
          const skeleton = new THREE.Skeleton(bones)
          if (meshData.bindposes) {
            skeleton.boneInverses = meshData.bindposes.map((matrix: any) => new THREE.Matrix4().fromArray(matrix))
          }
          mesh.bind(skeleton)

          break
        }
      }
    })

    return rootObject
  } catch (error) {
    console.error("Error loading skinned model:", error)
    throw error
  }
}

export async function loadEVObjectModel(reader: BinaryBufferReader): Promise<THREE.Object3D> {
  try {
    // Parse the model file
    const modelData = readEVObjectModelFile(reader)

    // Load textures
    const textures = await loadTextures(modelData.textures)

    // Create materials
    const materials = (modelData.materialsEx || modelData.materials).map((material: any) =>
      createMaterial(material, textures),
    )

    // Build object hierarchy
    const rootObject = buildObjectHierarchy(modelData.rootObject, modelData.meshes, materials)

    return rootObject
  } catch (error) {
    console.error("Error loading object model:", error)
    throw error
  }
}
