import { useEffect, useState } from "react";

export default function Loader() {
  const [progress9, setProgress9] = useState(95);
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress9((prev) => (prev + 1) % 100);
    }, 100);

    return () => clearInterval(interval);
  }, []);
  return (
    <div className="mt-44">
      <div className="relative col-span-1 md:col-span-2 lg:col-span-3">
        <div className="flex items-center gap-4 justify-center">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 border-2 border-cyan-400 rounded-full drop-shadow-[0_0_12px_rgba(6,182,212,0.8)]" />
            <div className="absolute inset-1 border border-cyan-400 rounded-full drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
            <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
              <circle
                cx="40"
                cy="40"
                r="30"
                stroke="rgba(6, 182, 212, 0.2)"
                strokeWidth="3"
                fill="none"
              />
              <circle
                cx="40"
                cy="40"
                r="30"
                stroke="#06b6d4"
                strokeWidth="3"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 30}`}
                strokeDashoffset={`${2 * Math.PI * 30 * (1 - progress9 / 100)}`}
                className="drop-shadow-[0_0_12px_rgba(6,182,212,0.8)] transition-all duration-300"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-cyan-400 font-mono text-sm font-bold drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]">
                {progress9}%
              </span>
            </div>
          </div>
          <div className="flex-1 max-w-2xl">
            <div
              className="border border-cyan-400 bg-black/50 backdrop-blur-sm p-4 relative"
              style={{
                clipPath:
                  "polygon(0 0, calc(100% - 40px) 0, 100% 20px, calc(100% - 20px) 100%, 20px 100%, 0 80%)",
              }}
            >
              <div className="text-cyan-400 font-mono text-sm mb-3 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]">
                LOADING...
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-800 relative overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-cyan-300 transition-all duration-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                    style={{ width: `${progress9}%` }}
                  />
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: 40 }).map((_, i) => (
                    <div
                      key={i}
                      className={`flex-1 h-1 transition-all duration-300 ${
                        i < (progress9 / 100) * 40
                          ? "bg-cyan-400 drop-shadow-[0_0_4px_rgba(6,182,212,0.8)]"
                          : "bg-gray-700"
                      }`}
                      style={{
                        transform: `skewX(${Math.sin(i * 0.5) * 10}deg)`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
