"use client";

import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { BinaryBufferReader } from "@/lib/binary-buffer-reader";
import { loadEVSkinnedModel, loadEVObjectModel } from "@/lib/ev-model-loader";
import type * as THREE from "three";
import { Vector3 } from "@react-three/fiber";
interface ModelLoaderProps {
  buffer: ArrayBuffer;
  modelType: string;
  autoRotate?: boolean;
  position?:
    | number
    | Vector3
    | [x: number, y: number, z: number]
    | readonly [x: number, y: number, z: number]
    | Readonly<Vector3>;
}

export default function ModelLoader({
  buffer,
  modelType,
  autoRotate = true,
  position = null,
}: ModelLoaderProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [model, setModel] = useState<THREE.Object3D | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Rotation state for smooth toggling ---
  const lastRotationRef = useRef<number>(0);
  const lastToggleTimeRef = useRef<number>(0);

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
    const loadModel = async () => {
      try {
        setLoading(true);
        setError(null);

        // Clear previous model if it exists
        if (groupRef.current && groupRef.current.children.length > 0) {
          const children = [...groupRef.current.children];
          children.forEach((child) => {
            groupRef.current?.remove(child);
          });
        }

        // Create a binary buffer reader
        const reader = new BinaryBufferReader(buffer);

        // Load the appropriate model type
        let loadedModel: THREE.Object3D | null = null;

        if (modelType === "evskin") {
          loadedModel = await loadEVSkinnedModel(reader);
        } else if (modelType === "evobj") {
          loadedModel = await loadEVObjectModel(reader);
        } else {
          throw new Error(`Unsupported model type: ${modelType}`);
        }

        if (loadedModel && groupRef.current) {
          // Add the model to the group
          groupRef.current.add(loadedModel);
          setModel(loadedModel);
        }
      } catch (err) {
        console.error("Error loading model:", err);
        setError(err instanceof Error ? err.message : "Failed to load model");
      } finally {
        setLoading(false);
      }
    };

    if (buffer) {
      loadModel();
    }

    return () => {
      // Cleanup
      if (groupRef.current) {
        const children = [...groupRef.current.children];
        children.forEach((child) => {
          groupRef.current?.remove(child);
        });
      }
    };
  }, [buffer, modelType]);

  // --- Smooth auto-rotation logic ---
  useFrame(({ clock }) => {
    if (groupRef.current && !loading && !error) {
      if (autoRotate) {
        // Only calculate delta from the moment auto-rotation was enabled
        const now = performance.now() / 1000;
        const elapsed = now - lastToggleTimeRef.current;
        groupRef.current.rotation.y = lastRotationRef.current + elapsed * 0.1;
      }
      // Do not update refs while auto-rotation is active
    }
  });

  return <group ref={groupRef} position={position ? position : [0, 0, 0]} />;
}
