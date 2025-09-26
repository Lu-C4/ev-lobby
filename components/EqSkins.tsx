import { useEffect, useState } from "react";
import SkinViewer from "./skin-viewer";
import Loader from "@/components/Loader";

export function EquippedSkins({ userData }) {
  const [guns, setGuns] = useState(null);
  useEffect(() => {
    async function GetGuns() {
      async function Getlink(gun) {
        const data = await (
          await fetch(`https://ev.io/${gun[0].url}?_format=json`)
        ).json();
        return {
          url: data?.field_skin?.[0]?.url ?? data?.field_model?.[0]?.url,
          name: data?.title[0]?.value,
        };
      }

      const gunss = [
        "field_auto_rifle_skin",
        "field_sword_skin",
        "field_burst_rifle_skin",
        "field_sweeper_skin",
        "field_hand_cannon_skin",
        "field_laser_rifle_skin",
      ];
      var final_guns = await Promise.all(
        gunss.map((gun) => Getlink(userData[gun]))
      );

      final_guns[1]["type"] = "SW";
      setGuns(final_guns);
    }
    GetGuns();
  }, [userData]);

  if (!guns) {
    return <Loader />;
  }
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 p-6 place-items-center">
        {guns.map((gun, index) => {
          const isSword = gun.type === "SW";

          return (
            <div
              key={index}
              className={`relative p-6 border border-cyan-400/30 overflow-hidden group rounded-xl shadow-lg shadow-cyan-500/10
                ${isSword ? "h-[400px] w-[200px]" : "h-[250px] w-[390px]"}`}
              style={{
                background: "rgba(15, 23, 42, 0.4)", // dark bluish transparent
                backdropFilter: "blur(14px) saturate(180%)",
                WebkitBackdropFilter: "blur(14px) saturate(180%)",
              }}
            >
              {/* Glow border animation */}
              <div className="absolute inset-0 border border-transparent group-hover:border-cyan-400 transition-all duration-500 rounded-xl pointer-events-none" />

              {/* Segmented glow lines */}
              <div className="absolute top-0 left-0 w-1/3 h-px bg-cyan-400/40 group-hover:bg-cyan-400 transition-colors duration-300" />
              <div className="absolute top-0 right-0 w-1/3 h-px bg-cyan-400/40 group-hover:bg-cyan-400 transition-colors duration-300" />
              <div className="absolute bottom-0 left-0 w-1/3 h-px bg-cyan-400/40 group-hover:bg-cyan-400 transition-colors duration-300" />
              <div className="absolute bottom-0 right-0 w-1/3 h-px bg-cyan-400/40 group-hover:bg-cyan-400 transition-colors duration-300" />

              {/* Viewer */}
              <div className="w-full h-full flex items-center justify-center relative z-10">
                <SkinViewer
                  skin_url={gun.url}
                  skin_type="evobj"
                  position={isSword ? [0, 0, 23] : [0, 0, 8]}
                  objectPosition={isSword && [0, -0.6, 0]}
                  className={(isSword && "h-full") || "w-full"}
                />
              </div>

              {/* Label with glow */}
              <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-cyan-300 font-semibold tracking-wide text-lg z-10 drop-shadow-[0_0_6px_rgba(0,255,255,0.6)] text-center">
                {gun.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
