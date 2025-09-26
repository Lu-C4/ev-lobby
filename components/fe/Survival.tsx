import { useState, useEffect } from "react";
import { fetchSurvivalScore } from "@/lib/evapi";
export default function SurvialStats({ caption, userData }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    async function loadData() {
      const rawValue = await fetchSurvivalScore(userData);

      if (rawValue) {
        const parsedData = Object.keys(rawValue)
          .filter((key) => key !== "0" && key !== "caption")
          .sort((a, b) => parseInt(a) - parseInt(b))
          .map((key) => {
            const [map, bestTime] = rawValue[key];
            return { map, bestTime };
          });

        setData(parsedData);
      }
    }

    loadData();
  }, [userData]);
  return (
    <div className="w-full max-w-3xl mx-auto">
      <h2 className="text-xl font-bold text-cyan-400 mb-6 text-center uppercase tracking-wider">
        {caption}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {data.map((entry, index) => (
          <div
            key={index}
            className="relative p-4 bg-slate-900 border-2 border-cyan-400/50 group hover:bg-cyan-400/10 transition-colors duration-300 cursor-pointer"
            style={{
              clipPath: "polygon(10% 0%, 100% 0%, 90% 100%, 0% 100%)",
            }}
          >
            {/* Top-left diagonal line */}
            <div
              className="absolute top-0 left-0 w-full h-px bg-cyan-400/50 group-hover:bg-cyan-400 transition-colors duration-300"
              style={{
                transform: "rotate(-45deg) scaleX(0.5)",
                transformOrigin: "top left",
              }}
            />
            {/* Bottom-right diagonal line */}
            <div
              className="absolute bottom-0 right-0 w-full h-px bg-cyan-400/50 group-hover:bg-cyan-400 transition-colors duration-300"
              style={{
                transform: "rotate(-45deg) scaleX(0.5)",
                transformOrigin: "bottom right",
              }}
            />

            <div className="flex flex-col items-center text-center">
              <span className="text-lg font-semibold text-cyan-200 group-hover:text-white transition-colors duration-300 mb-1">
                {entry.map}
              </span>
              <span className="text-sm text-cyan-400 group-hover:text-cyan-200 transition-colors duration-300 font-mono">
                {entry.bestTime}
              </span>
            </div>
            <div className="absolute top-2 right-2 text-cyan-600 text-xs font-bold group-hover:text-cyan-400 transition-colors duration-300">
              #{index + 1}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
