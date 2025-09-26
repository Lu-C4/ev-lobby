"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import SkinViewer from "./skin-viewer";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Loader from "@/components/Loader";

export default function Armory({ userData }) {
  const [rawSkinData, setRawSkinData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function getInitialSkinData() {
      const userId = userData["uid"][0]["value"];
      const skinData = await (
        await fetch(`https://ev.io/flags/${userId}`)
      ).json();
      console.log(skinData);

      setRawSkinData(skinData);
    }
    getInitialSkinData();
    setLoading(false);
  }, [userData]);

  if (rawSkinData === null || loading) {
    return <Loader />;
  }

  return (
    <>
      <LazyCarousel rawSkinData={rawSkinData} type="evobj" title={"Weapons"} />
      <LazyCarousel
        rawSkinData={rawSkinData}
        type="evskin"
        title={"Characters"}
      />
    </>
  );
}

function LazyCarousel({ rawSkinData, type, title }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [loadedSkins, setLoadedSkins] = useState(new Map());
  const transitioning = useRef(false);
  const loadingRef = useRef(new Set());

  // useEffect(() => {
  //   const filteredData = rawSkinData.filter((item) => {
  //     // We need to make a quick check to determine type without full API call
  //     // This is a heuristic - we'll verify when we actually load the skin
  //     return true; // Load all initially, filter during actual loading
  //   });
  //   setTotalCount(filteredData.length);
  // }, [rawSkinData, type]);

  const loadSkinMetadata = useCallback(
    async (skinDataItem, index) => {
      if (loadedSkins.has(index) || loadingRef.current.has(index)) {
        return;
      }

      loadingRef.current.add(index);

      try {
        const res = await fetch(
          `https://ev.io/node/${skinDataItem.entity_id}?_format=json`
        );
        const data = await res.json();

        // URL priority: field_skin -> field_model
        const url = data?.field_skin?.[0]?.url ?? data?.field_model?.[0]?.url;
        if (!url) {
          loadingRef.current.delete(index);
          return;
        }

        // Determine file type
        const skinType = url.endsWith(".evskin")
          ? "evskin"
          : url.endsWith(".evobj")
          ? "evobj"
          : "unknown";

        if (skinType !== type) {
          loadingRef.current.delete(index);
          return;
        }

        // Title from data
        const name = data?.title[0]?.value ?? null;

        // Check if sword
        const isSword = data?.field_parent_weapon?.[0]?.target_id === 262;

        const skinObj = {
          url,
          type: skinType,
          name,
          ...(isSword ? { isSword: true } : {}),
        };

        setLoadedSkins((prev) => new Map(prev.set(index, skinObj)));
      } catch (error) {
        console.error(`Error loading skin ${index}:`, error);
      } finally {
        loadingRef.current.delete(index);
      }
    },
    [loadedSkins, type]
  );

  useEffect(() => {
    const maxVisible = 5;
    const buffer = 2; // Load 2 extra skins on each side
    const half = Math.floor(maxVisible / 2);
    const start = activeIndex - half - buffer;
    const end = activeIndex + half + buffer;

    for (let i = start; i <= end; i++) {
      const index = (i + rawSkinData.length) % rawSkinData.length;
      if (index < rawSkinData.length) {
        loadSkinMetadata(rawSkinData[index], index);
      }
    }
  }, [activeIndex, rawSkinData, loadSkinMetadata]);

  const getFilteredSkins = () => {
    return Array.from(loadedSkins.entries())
      .filter(([_, skin]) => skin.type === type)
      .sort(([a], [b]) => a - b)
      .map(([index, skin]) => ({ ...skin, originalIndex: index }));
  };

  const filteredSkins = getFilteredSkins();
  const maxVisible = Math.min(filteredSkins.length, 5);

  const nextSlide = () => {
    if (transitioning.current || filteredSkins.length === 0) return;
    transitioning.current = true;
    setActiveIndex((prev) => (prev + 1) % filteredSkins.length);
    setTimeout(() => (transitioning.current = false), 500);
  };

  const prevSlide = () => {
    if (transitioning.current || filteredSkins.length === 0) return;
    transitioning.current = true;
    setActiveIndex(
      (prev) => (prev - 1 + filteredSkins.length) % filteredSkins.length
    );
    setTimeout(() => (transitioning.current = false), 500);
  };

  const getVisibleGuns = () => {
    if (filteredSkins.length === 0) return [];

    const total = Math.min(maxVisible, filteredSkins.length);
    const half = Math.floor(total / 2);
    const start = activeIndex - half + (total % 2 === 0 ? 1 : 0);

    return Array.from({ length: total }).map((_, i) => {
      const index = (start + i + filteredSkins.length) % filteredSkins.length;
      return { ...filteredSkins[index], index };
    });
  };

  const visibleGuns = getVisibleGuns();

  if (filteredSkins.length === 0) {
    return (
      <div
        className="relative mt-6 mb-3 w-full max-w-6xl mx-auto p-8 
                   bg-slate-900/40 border border-cyan-400/30 shadow-xl shadow-cyan-400/20 
                   rounded-lg overflow-hidden"
        style={{
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <h2 className="text-2xl font-bold text-cyan-400 mb-6 text-center uppercase tracking-wider">
          {title}
        </h2>
        <div className="flex justify-center items-center h-64">
          <div className="text-cyan-300">Loading {title.toLowerCase()}...</div>
        </div>
      </div>
    );
  }

  const itemWidth = 400;

  return (
    <div
      className="relative mt-6 mb-3 w-full max-w-6xl mx-auto p-8 
               bg-slate-900/40 border border-cyan-400/30 shadow-xl shadow-cyan-400/20 
               rounded-lg overflow-hidden"
      style={{
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <h2 className="text-2xl font-bold text-cyan-400 mb-6 text-center uppercase tracking-wider">
        {title}
      </h2>

      <div
        style={type == "evobj" ? { height: "15rem" } : { height: "30rem" }}
        className="relative  flex  items-center justify-center overflow-hidden"
      >
        <div className="relative w-full h-full flex justify-center items-end">
          {visibleGuns.map((gunObj, i) => {
            const position = i - Math.floor(visibleGuns.length / 2);
            const opacity = position === 0 ? 1 : 0.4;
            const translateX = position * itemWidth;

            return (
              <div
                key={gunObj.originalIndex}
                className="absolute transition-all  duration-500 ease-in-out flex flex-col items-center"
                style={{
                  transform: `translateX(calc(${translateX}px - ${
                    itemWidth / 2
                  }px))`,
                  opacity,
                  zIndex: position === 0 ? 20 : 10 - Math.abs(position),
                  width: `${itemWidth}px`,
                  height: type === "evskin" ? "48rem" : "300px",
                  left: "50%",
                }}
              >
                {/* Platform */}
                <div
                  className={`absolute bottom-0 w-48 h-24 transition-all duration-500 ease-in-out `}
                  style={{
                    transformStyle: "preserve-3d",
                    transform: `rotateX(70deg) scale(${
                      position === 0 ? 1.1 : 0.8
                    })`,
                    transformOrigin: "bottom center",
                    opacity: position === 0 ? 1 : 0.6,
                  }}
                >
                  <svg
                    width="192"
                    height="96"
                    viewBox="0 0 192 96"
                    className="absolute inset-0"
                  >
                    <path
                      d="M0 96 L48 0 L144 0 L192 96 Z"
                      fill="rgba(34, 197, 194, 0.1)"
                      stroke="#22c5c2"
                      strokeWidth="2"
                    />
                    <path
                      d="M48 0 L72 48 L96 0 L120 48 L144 0"
                      fill="none"
                      stroke="#22c5c2"
                      strokeWidth="1"
                      opacity="0.5"
                    />
                  </svg>
                </div>

                {/* Gun model */}
                <div className="h-full w-full relative z-10 flex items-center justify-center">
                  <SkinViewer
                    skin_url={gunObj.url}
                    skin_type={type}
                    className={
                      type === "evskin"
                        ? "bg-transparent w-full h-full "
                        : gunObj.isSword
                        ? "w-full h-full"
                        : ""
                    }
                    position={type === "evskin" && [0, 0, 5.3]}
                    objectPosition={type === "evskin" && [0, -2.2, 0]}
                    {...(gunObj.isSword &&
                      type === "evobj" && {
                        position: [0, 0, 25],
                        objectPosition: [0, -1, 0],
                        className: "h-full",
                      })}
                  />
                </div>
                <span className="mt-2 text-center text-cyan-300 font-semibold tracking-wide text-lg uppercase z-10">
                  {gunObj.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-cyan-400/20 hover:bg-cyan-400/40 transition-colors duration-200 rounded-full text-cyan-200 z-30"
        aria-label="Previous gun"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-cyan-400/20 hover:bg-cyan-400/40 transition-colors duration-200 rounded-full text-cyan-200 z-30"
        aria-label="Next gun"
      >
        <ChevronRight size={24} />
      </button>

      {/* Dots */}
      <div className="flex justify-center space-x-2 mt-8">
        {filteredSkins.map((_, index) => (
          <button
            key={index}
            onClick={() => setActiveIndex(index)}
            className={`w-3 h-3 rounded-full transition-colors duration-200 ${
              index === activeIndex ? "bg-cyan-400" : "bg-cyan-600/50"
            }`}
            aria-label={`Go to gun ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
