"use client";

import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  PerspectiveCamera,
} from "@react-three/drei";
import ModelLoader from "./model-loader";
import EVSkinRenderer from "./evskin-renderer";
import { Vector3 } from "@react-three/fiber";

// Simple in-memory cache so we don't fetch the same model twice
const modelCache = new Map<string, ArrayBuffer>();

interface SkinViewerProps {
  skin_url: string;
  skin_type: string;
  className?: string;
  sword?: boolean;
  position?:
    | number
    | Vector3
    | [x: number, y: number, z: number]
    | readonly [x: number, y: number, z: number]
    | Readonly<Vector3>;
  objectPosition?:
    | number
    | Vector3
    | [x: number, y: number, z: number]
    | readonly [x: number, y: number, z: number]
    | Readonly<Vector3>;
}

export default function SkinViewer({
  skin_url,
  skin_type,
  className,
  position,
  objectPosition = null,
}: SkinViewerProps) {
  const [modelBuffer, setModelBuffer] = useState<ArrayBuffer | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let isMounted = true;

    const fetchModel = async () => {
      try {
        if (modelCache.has(skin_url)) {
          setModelBuffer(modelCache.get(skin_url)!);
          setLoading(false);
          return;
        }

        const response = await fetch(skin_url);
        if (!response.ok) throw new Error("Failed to fetch model");

        const buffer = await response.arrayBuffer();

        modelCache.set(skin_url, buffer);

        if (isMounted) setModelBuffer(buffer);
        setLoading(false);
      } catch (err) {
        console.error("Error loading model:", err);
      }
    };

    fetchModel();

    return () => {
      isMounted = false;
    };
  }, [skin_url]);

  return (
    <div className={`relative  ${className}`}>
      {loading && (
        <div className=" absolute inset-0 flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
        </div>
      )}
      <Canvas className="w-full h-full">
        <PerspectiveCamera
          zoom={skin_type === "evobj" ? 9 : 1}
          makeDefault
          position={
            position
              ? position
              : skin_type === "evobj"
              ? [-3.1, 0, 8]
              : [0, 0, 3.05]
          }
          rotation={[0, Math.PI, 0]} // Rotate 180° around Y-axis
        />

        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <Environment preset="city" />
        <OrbitControls
          autoRotate
          autoRotateSpeed={1.5}
          enableZoom={false}
          enablePan={false}
        />
        {modelBuffer &&
          (skin_type === "evskin" ? (
            <EVSkinRenderer position={objectPosition} buffer={modelBuffer} />
          ) : (
            <ModelLoader
              autoRotate
              buffer={modelBuffer}
              modelType={skin_type}
              position={objectPosition || null}
            />
          ))}
      </Canvas>
    </div>
  );
}
