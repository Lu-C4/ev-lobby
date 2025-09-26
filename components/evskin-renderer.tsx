"use client";

import { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import type * as THREE from "three";
import { Vector3 } from "@react-three/fiber";
interface EVSkinRendererProps {
  buffer: ArrayBuffer;
  autoRotate?: boolean;
  position?:
    | number
    | Vector3
    | [x: number, y: number, z: number]
    | readonly [x: number, y: number, z: number]
    | Readonly<Vector3>;
}

export default function EVSkinRenderer({
  buffer,
  autoRotate = true,
  position = null,
}: EVSkinRendererProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useThree();

  // Rotation state management
  const lastRotationRef = useRef<number>(0);
  const lastToggleTimeRef = useRef<number>(0);

  // Update rotation tracking when autoRotate changes
  useEffect(() => {
    if (autoRotate) {
      // When toggling ON, set the lastToggleTime to now
      lastToggleTimeRef.current = performance.now() / 1000;
    } else if (groupRef.current) {
      // When toggling OFF, store the current rotation
      lastRotationRef.current = groupRef.current.rotation.y;
    }
  }, [autoRotate]);

  useEffect(() => {
    if (!groupRef.current || !buffer) return;

    // Clear any existing children
    const children = [...groupRef.current.children];
    children.forEach((child) => {
      groupRef.current?.remove(child);
    });

    // Import THREE.js dynamically to avoid SSR issues
    import("three").then((THREE) => {
      // Custom Toon Shader
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
      `;

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
      `;

      // Binary Buffer Reader implementation
      class BinaryBufferReader {
        private _buffer: ArrayBuffer;
        private _index: number;

        constructor(buffer: ArrayBuffer) {
          this._buffer = buffer;
          this._index = 0;
        }

        chompInt16(): number {
          const view = this._buffer.slice(this._index, this._index + 2);
          this._index += 2;
          return new Int16Array(view)[0];
        }

        chompUint16(): number {
          const view = this._buffer.slice(this._index, this._index + 2);
          this._index += 2;
          return new Uint16Array(view)[0];
        }

        chompUint32(): number {
          const view = this._buffer.slice(this._index, this._index + 4);
          this._index += 4;
          return new Uint32Array(view)[0];
        }

        chompByte(): number {
          const view = this._buffer.slice(this._index, this._index + 1);
          this._index += 1;
          return new Uint8Array(view)[0];
        }

        chompByteArray(length: number): Uint8Array {
          const view = this._buffer.slice(this._index, this._index + length);
          this._index += length;
          return new Uint8Array(view);
        }

        chompUint16Array(length: number): Uint16Array {
          const view = this._buffer.slice(
            this._index,
            this._index + 2 * length
          );
          this._index += 2 * length;
          return new Uint16Array(view);
        }

        chompFloat32(): number {
          const view = this._buffer.slice(this._index, this._index + 4);
          this._index += 4;
          return new Float32Array(view)[0];
        }

        chompFloat32Array(length: number): Float32Array {
          const view = this._buffer.slice(
            this._index,
            this._index + 4 * length
          );
          this._index += 4 * length;
          return new Float32Array(view);
        }

        chompString(): string {
          const length = this.chompByte();
          const view = this._buffer.slice(this._index, this._index + length);
          this._index += length;
          return Array.prototype.slice
            .call(new Uint8Array(view))
            .map((byte) => String.fromCharCode(byte))
            .join("");
        }

        chompVector3(): THREE.Vector3 {
          return new THREE.Vector3(
            this.chompFloat32(),
            this.chompFloat32(),
            this.chompFloat32()
          );
        }

        chompMatrix4(): THREE.Matrix4 {
          const matrix = new THREE.Matrix4();
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
            this.chompFloat32()
          );
          return matrix;
        }

        chompQuaternion(): THREE.Quaternion {
          return new THREE.Quaternion(
            this.chompFloat32(),
            this.chompFloat32(),
            this.chompFloat32(),
            this.chompFloat32()
          );
        }

        chompColorRGB24(): THREE.Color {
          const view = this._buffer.slice(this._index, this._index + 3);
          this._index += 3;
          const bytes = new Uint8Array(view);
          return new THREE.Color(
            bytes[0] / 255,
            bytes[1] / 255,
            bytes[2] / 255
          );
        }
      }

      // File format readers
      const readArray = (
        elementReader: Function,
        reader: BinaryBufferReader
      ) => {
        const count = reader.chompUint16();
        const result = [];
        for (let i = 0; i < count; ++i) {
          result.push(elementReader(reader));
        }
        return result;
      };

      const readTriangle = (reader: BinaryBufferReader) => {
        return [
          reader.chompUint16(),
          reader.chompUint16(),
          reader.chompUint16(),
        ];
      };

      const readUV = (reader: BinaryBufferReader) => {
        return [reader.chompUint16(), reader.chompUint16()];
      };

      const readVertexBuffer = (
        reader: BinaryBufferReader,
        ignoreZero = false
      ) => {
        if (reader.chompByte() === 0) {
          return undefined;
        }

        const minX = reader.chompFloat32();
        const minY = reader.chompFloat32();
        const minZ = reader.chompFloat32();
        const maxX = reader.chompFloat32();
        const maxY = reader.chompFloat32();
        const maxZ = reader.chompFloat32();

        const rangeX = maxX - minX;
        const rangeY = maxY - minY;
        const rangeZ = maxZ - minZ;

        const vertices = readArray(readTriangle, reader);

        return new Float32Array(
          vertices.flatMap((vertex) => {
            const [x, y, z] = vertex;
            return ignoreZero && x === 0 && y === 0 && z === 0
              ? [0, 0, 0]
              : [
                  rangeX * (x / 65535) + minX,
                  rangeY * (y / 65535) + minY,
                  rangeZ * (z / 65535) + minZ,
                ];
          })
        );
      };

      const readUVBuffer = (reader: BinaryBufferReader) => {
        if (reader.chompByte() === 0) {
          return undefined;
        }

        const minU = reader.chompFloat32();
        const minV = reader.chompFloat32();
        const maxU = reader.chompFloat32();
        const maxV = reader.chompFloat32();

        const rangeU = maxU - minU;
        const rangeV = maxV - minV;

        const uvs = readArray(readUV, reader);

        return new Float32Array(
          uvs.flatMap((uv) => {
            const [u, v] = uv;
            return [rangeU * (u / 65535) + minU, rangeV * (v / 65535) + minV];
          })
        );
      };

      const readTransform = (reader: BinaryBufferReader) => {
        return {
          name: reader.chompString(),
          parentIndex: reader.chompInt16(),
          position: new THREE.Vector3(
            reader.chompFloat32(),
            reader.chompFloat32(),
            reader.chompFloat32()
          ),
          rotation: new THREE.Quaternion(
            reader.chompFloat32(),
            reader.chompFloat32(),
            reader.chompFloat32(),
            reader.chompFloat32()
          ),
          scale: new THREE.Vector3(
            reader.chompFloat32(),
            reader.chompFloat32(),
            reader.chompFloat32()
          ),
          meshIndex: reader.chompInt16(),
        };
      };

      const readSubmeshWithMaterial = (reader: BinaryBufferReader) => {
        const materialIndex = reader.chompInt16();
        const indexCount = reader.chompUint16();
        const indexBuffer = reader.chompUint16Array(indexCount);
        return { materialIndex, indexBuffer };
      };

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
        };
      };

      const readSkinnedMesh = (reader: BinaryBufferReader) => {
        const normalCount = reader.chompUint16();
        const normalBuffer = reader.chompFloat32Array(normalCount * 3);

        const vertexCount = reader.chompUint16();
        const vertexBuffer = reader.chompFloat32Array(vertexCount * 3);

        return {
          normalBuffer,
          vertexBuffer,
          submeshes: readArray(readSubmeshWithMaterial, reader),
          bindposes: readArray(
            (r: BinaryBufferReader) => r.chompMatrix4(),
            reader
          ),
          bones: readArray((r: BinaryBufferReader) => r.chompUint16(), reader),
          boneWeights: readArray(readBoneWeight, reader),
        };
      };

      const readTexture = (reader: BinaryBufferReader) => {
        const format = reader.chompByte();
        const size = reader.chompUint32();
        const data = reader.chompByteArray(size);

        if (typeof btoa !== "undefined") {
          let binary = "";
          for (let i = 0; i < data.length; ++i) {
            binary += String.fromCharCode(data[i]);
          }
          const base64 = btoa(binary);

          switch (format) {
            case 0:
              return `data:image/png;base64,${base64}`;
            case 1:
              return `data:image/jpeg;base64,${base64}`;
            default:
              throw new Error("Unsupported texture format");
          }
        }

        return null;
      };

      const readColorWithAlpha = (reader: BinaryBufferReader) => {
        const r = reader.chompByte() / 255;
        const g = reader.chompByte() / 255;
        const b = reader.chompByte() / 255;
        const a = reader.chompByte() / 255;
        return [new THREE.Color(r, g, b), a];
      };

      const readColor = (reader: BinaryBufferReader) => {
        const r = reader.chompByte() / 255;
        const g = reader.chompByte() / 255;
        const b = reader.chompByte() / 255;
        return new THREE.Color(r, g, b);
      };

      const readMaterial = (reader: BinaryBufferReader) => {
        const features = reader.chompByte();
        const result: any = { features };

        if ((features & 128) !== 0) {
          result.features2 = reader.chompByte();
        }

        if ((features & 1) !== 0) {
          const [color, alpha] = readColorWithAlpha(reader);
          result.color = color;
          result.colorAlpha = alpha;
        }

        if ((features & 2) !== 0) {
          result.colorMapIndex = reader.chompUint16();
        }

        if ((features & 4) !== 0) {
          result.emissionColor = readColor(reader);
        }

        if ((features & 8) !== 0) {
          result.emissionMapIndex = reader.chompUint16();
        }

        if ((features & 16) !== 0) {
          result.emissionIntensity = reader.chompFloat32();
        }

        if ((features & 32) !== 0) {
          result.metallic = reader.chompFloat32();
        }

        if ((features & 64) !== 0) {
          result.metallicMapIndex = reader.chompUint16();
        }

        if ((features & 128) !== 0) {
          if ((result.features2 & 1) !== 0) {
            result.roughness = reader.chompFloat32();
          }

          if ((result.features2 & 2) !== 0) {
            result.roughnessMapIndex = reader.chompInt16();
          }

          if ((result.features2 & 4) !== 0) {
            result.occlusionMapIndex = reader.chompInt16();
          }

          if ((result.features2 & 8) !== 0) {
            result.occlusionMultiplier = reader.chompFloat32();
          }

          if ((result.features2 & 16) !== 0) {
            result.normalMapIndex = reader.chompInt16();
          }

          if ((result.features2 & 32) !== 0) {
            result.uvScaleOffset = new THREE.Vector4(
              reader.chompFloat32(),
              reader.chompFloat32(),
              reader.chompFloat32(),
              reader.chompFloat32()
            );
          }
        }

        return result;
      };

      const readToonMaterial = (reader: BinaryBufferReader) => {
        return {
          color: readColorWithAlpha(reader)[0],
          mainTextureIndex: reader.chompUint16(),
          ambientColor: new THREE.Vector4(
            reader.chompFloat32(),
            reader.chompFloat32(),
            reader.chompFloat32(),
            reader.chompFloat32()
          ),
          specularColor: new THREE.Vector4(
            reader.chompFloat32(),
            reader.chompFloat32(),
            reader.chompFloat32(),
            reader.chompFloat32()
          ),
          glossiness: reader.chompFloat32(),
          rimColor: new THREE.Vector4(
            reader.chompFloat32(),
            reader.chompFloat32(),
            reader.chompFloat32(),
            reader.chompFloat32()
          ),
          rimAmount: reader.chompFloat32(),
          rimThreshold: reader.chompFloat32(),
          outlineThickness: reader.chompFloat32(),
          outlineColor: readColorWithAlpha(reader)[0],
        };
      };

      const readUnlitColorMaterial = (reader: BinaryBufferReader) => {
        return {
          color: readColor(reader),
        };
      };

      const readMaterialEx = (reader: BinaryBufferReader) => {
        const shader = reader.chompByte();
        let material = null;

        switch (shader) {
          case 0:
            material = readMaterial(reader);
            break;
          case 1:
            material = readToonMaterial(reader);
            break;
          case 2:
            material = readUnlitColorMaterial(reader);
            break;
        }

        return {
          shader,
          material,
        };
      };

      const readEVSkinnedModelFile = (reader: BinaryBufferReader) => {
        const magic = reader.chompByte();
        const features = reader.chompByte();

        if (magic !== 4) {
          throw new Error(
            "evskin file format error: expected first byte to be 0x04. The file being parsed is probably not an evskin."
          );
        }

        const result: any = {
          features,
          textures: readArray(readTexture, reader),
        };

        if ((features & 8) !== 0) {
          result.materialsEx = readArray(readMaterialEx, reader);
        } else {
          result.materials = readArray(readMaterial, reader);
        }

        result.transforms = readArray(readTransform, reader);
        result.meshes = readArray(readSkinnedMesh, reader);

        return result;
      };

      // Enhanced Material builders with toon shading
      const buildToonMaterial = (
        material: any,
        textures: Promise<THREE.Texture>[],
        lightmapIndex: number,
        skinning: boolean
      ) => {
        const uniforms = {
          color: { value: material.color || new THREE.Color(1, 1, 1) },
          map: { value: null },
          hasTexture: { value: false },
          emissive: {
            value: material.emissionColor || new THREE.Color(0, 0, 0),
          },
          emissiveIntensity: { value: material.emissionIntensity || 1.0 },
          emissiveMap: { value: null },
          hasEmissiveMap: { value: false },
          opacity: { value: material.colorAlpha || 1.0 },
        };

        // Load main texture
        if ((material.features & 2) !== 0 && textures[material.colorMapIndex]) {
          textures[material.colorMapIndex].then((texture) => {
            uniforms.map.value = texture;
            uniforms.hasTexture.value = true;
          });
        }

        // Load emissive texture
        if (
          (material.features & 8) !== 0 &&
          textures[material.emissionMapIndex]
        ) {
          textures[material.emissionMapIndex].then((texture) => {
            uniforms.emissiveMap.value = texture;
            uniforms.hasEmissiveMap.value = true;
          });
        }

        const toonMaterial = new THREE.ShaderMaterial({
          uniforms,
          vertexShader: toonVertexShader,
          fragmentShader: toonFragmentShader,
          transparent: material.colorAlpha < 0.99,
          side: THREE.DoubleSide,
        });

        // Add skinning support
        if (skinning) {
          toonMaterial.defines = { USE_SKINNING: "" };
          toonMaterial.vertexShader = `
            #define USE_SKINNING
            #include <skinning_pars_vertex>
            
            varying vec3 vNormal;
            varying vec3 vPosition;
            varying vec2 vUv;
            
            void main() {
              #include <skinbase_vertex>
              #include <begin_vertex>
              #include <skinning_vertex>
              
              vNormal = normalize(normalMatrix * normal);
              vPosition = (modelViewMatrix * vec4(transformed, 1.0)).xyz;
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
            }
          `;
        }

        return toonMaterial;
      };

      const buildEVMaterial = (
        material: any,
        shadowStrength: number,
        useShadowHack: boolean,
        textures: Promise<THREE.Texture>[],
        lightmapIndex: number,
        skinning: boolean
      ) => {
        // Use toon material for better colors
        return buildToonMaterial(material, textures, lightmapIndex, skinning);
      };

      const buildEVMaterialEx = (
        materialEx: any,
        shadowStrength: number,
        useShadowHack: boolean,
        textures: Promise<THREE.Texture>[],
        lightmapIndex: number,
        skinning: boolean
      ) => {
        switch (materialEx.shader) {
          case 0:
            return buildToonMaterial(
              materialEx.material,
              textures,
              lightmapIndex,
              skinning
            );
          case 1:
            return buildToonMaterial(
              materialEx.material,
              textures,
              lightmapIndex,
              skinning
            );
          case 2:
            return new THREE.MeshBasicMaterial({
              color: materialEx.material.color,
              side: THREE.DoubleSide,
            });
          default:
            return new THREE.MeshBasicMaterial({ color: 0xff00ff });
        }
      };

      const buildMaterialInstanceSet = (
        materials: any[],
        shadowStrength: number,
        useShadowHack: boolean,
        lightmapIndices: number[][],
        textures: Promise<THREE.Texture>[],
        skinning: boolean
      ) => {
        return materials.map((material, index) => {
          const result: any = {
            [-1]: buildEVMaterial(
              material,
              shadowStrength,
              useShadowHack,
              textures,
              -1,
              skinning
            ),
          };

          if (index < lightmapIndices.length) {
            lightmapIndices[index].forEach((lightmapIndex) => {
              result[lightmapIndex] = buildEVMaterial(
                material,
                shadowStrength,
                useShadowHack,
                textures,
                lightmapIndex,
                skinning
              );
            });
          }

          return result;
        });
      };

      const buildMaterialInstanceSetEx = (
        materialsEx: any[],
        shadowStrength: number,
        useShadowHack: boolean,
        lightmapIndices: number[][],
        textures: Promise<THREE.Texture>[],
        skinning: boolean
      ) => {
        return materialsEx.map((materialEx, index) => {
          const result: any = {
            [-1]: buildEVMaterialEx(
              materialEx,
              shadowStrength,
              useShadowHack,
              textures,
              -1,
              skinning
            ),
          };

          if (index < lightmapIndices.length) {
            lightmapIndices[index].forEach((lightmapIndex) => {
              result[lightmapIndex] = buildEVMaterialEx(
                materialEx,
                shadowStrength,
                useShadowHack,
                textures,
                lightmapIndex,
                skinning
              );
            });
          }

          return result;
        });
      };

      // Model builders
      const buildTransformHierarchy = (transforms: any[]) => {
        const objects = transforms.map((transform, index) => {
          const object = new THREE.Group();
          object.name = transform.name;
          return object;
        });

        let root: THREE.Object3D | null = null;
        const rootObjects = [];

        for (let i = 0; i < objects.length; ++i) {
          const transform = transforms[i];

          if (transform.parentIndex >= 0) {
            objects[transform.parentIndex].add(objects[i]);
          } else {
            rootObjects.push(objects[i]);
          }
        }

        if (rootObjects.length === 1) {
          root = rootObjects[0];
        } else {
          root = new THREE.Group();
          root.name = "SkinnedModel";
          rootObjects.forEach((obj) => root!.add(obj));
        }

        for (let i = 0; i < objects.length; ++i) {
          const transform = transforms[i];
          objects[i].position.copy(transform.position);
          objects[i].quaternion.copy(transform.rotation);
          objects[i].scale.copy(transform.scale);
        }

        return [root, objects];
      };

      const buildSkinnedMeshes = (
        meshes: any[],
        bones: THREE.Object3D[],
        materials: any[][]
      ) => {
        return meshes.map((mesh) => {
          const geometry = new THREE.BufferGeometry();

          geometry.setAttribute(
            "normal",
            new THREE.Float32BufferAttribute(mesh.normalBuffer, 3)
          );
          geometry.setAttribute(
            "position",
            new THREE.Float32BufferAttribute(mesh.vertexBuffer, 3)
          );

          const skinWeights = mesh.boneWeights.flatMap((bw: any) => [
            bw.weight0,
            bw.weight1,
            bw.weight2,
            bw.weight3,
          ]);
          const skinIndices = mesh.boneWeights.flatMap((bw: any) => [
            bw.boneIndex0,
            bw.boneIndex1,
            bw.boneIndex2,
            bw.boneIndex3,
          ]);

          geometry.setAttribute(
            "skinIndex",
            new THREE.Uint16BufferAttribute(skinIndices, 4)
          );
          geometry.setAttribute(
            "skinWeight",
            new THREE.Float32BufferAttribute(skinWeights, 4)
          );

          const offsets = [0];
          const indices = mesh.submeshes.flatMap((submesh: any, i: number) => {
            offsets[i + 1] = offsets[i] + submesh.indexBuffer.length;
            return Array.from(submesh.indexBuffer);
          });

          geometry.setIndex(indices);

          for (let i = 0; i < mesh.submeshes.length; ++i) {
            geometry.addGroup(
              offsets[i],
              mesh.submeshes[i].indexBuffer.length,
              mesh.submeshes[i].materialIndex
            );
          }

          const meshMaterials = mesh.submeshes.map(
            (submesh: any) => materials[submesh.materialIndex]
          );
          const isOpaque = meshMaterials.reduce(
            (acc: boolean, mat: any) => acc && (!mat || !mat.transparent),
            true
          );

          const skinnedMesh = new THREE.SkinnedMesh(geometry, materials);
          skinnedMesh.castShadow = true;
          skinnedMesh.receiveShadow = isOpaque;

          const skeletonBones: THREE.Bone[] = [];
          mesh.bones.forEach((boneIndex: number) => {
            skeletonBones.push(bones[boneIndex] as THREE.Bone);
          });

          skinnedMesh.skeleton = new THREE.Skeleton(
            skeletonBones,
            mesh.bindposes
          );

          return skinnedMesh;
        });
      };

      class SkinnedModel {
        threeObject: THREE.Object3D;

        constructor(buffer: ArrayBuffer, shadowStrength: number) {
          const reader = new BinaryBufferReader(buffer);
          const modelFile = readEVSkinnedModelFile(reader);

          const texturePromises = modelFile.textures.map(
            (textureData: string) => {
              return new Promise<THREE.Texture>((resolve) => {
                new THREE.TextureLoader().load(textureData, (texture) => {
                  texture.wrapS = THREE.RepeatWrapping;
                  texture.wrapT = THREE.RepeatWrapping;
                  texture.flipY = false;
                  resolve(texture);
                });
              });
            }
          );

          const [rootObject, transformObjects] = buildTransformHierarchy(
            modelFile.transforms
          );

          const materials =
            (modelFile.features & 8) !== 0
              ? modelFile.materialsEx.map((materialEx: any) =>
                  buildEVMaterialEx(
                    materialEx,
                    shadowStrength,
                    false,
                    texturePromises,
                    -1,
                    true
                  )
                )
              : modelFile.materials.map((material: any) =>
                  buildEVMaterial(
                    material,
                    shadowStrength,
                    false,
                    texturePromises,
                    -1,
                    true
                  )
                );

          const meshes = buildSkinnedMeshes(
            modelFile.meshes,
            transformObjects,
            materials
          );

          transformObjects.forEach((obj, i) => {
            if (modelFile.transforms[i].meshIndex >= 0) {
              obj.add(meshes[modelFile.transforms[i].meshIndex]);
            }
          });

          rootObject.scale.x = -1;
          this.threeObject = rootObject;
        }
      }

      // Load the model
      try {
        const model = new SkinnedModel(buffer, 0);

        if (groupRef.current) {
          groupRef.current.add(model.threeObject);
        }
      } catch (error) {
        console.error("Error loading evskin model:", error);
      }
    });

    return () => {
      // Cleanup
      if (groupRef.current) {
        const children = [...groupRef.current.children];
        children.forEach((child) => {
          groupRef.current?.remove(child);
        });
      }
    };
  }, [buffer]);

  // Update the rotation logic in useFrame
  useFrame(({ clock }) => {
    if (groupRef.current) {
      if (autoRotate) {
        // Only calculate delta from the moment auto-rotation was enabled
        const now = performance.now() / 1000;
        const elapsed = now - lastToggleTimeRef.current;
        groupRef.current.rotation.y = lastRotationRef.current + elapsed * 0.1;
      }
      // When not auto-rotating, the rotation stays at lastRotationRef.current
    }
  });

  return (
    <group ref={groupRef} position={position ? position : [0, -1.25, 0]} />
  );
}
