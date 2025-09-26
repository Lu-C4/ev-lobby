import React from "react";

const glassyCyan = {
  background: "rgba(15, 23, 42, 0.85)", // dark slate transparent background like slate-900
  border: "1px solid rgba(6, 182, 212, 0.5)", // 1px border, cyan-400 50% opacity
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  color: "rgba(132, 211, 255, 0.85)", // cyan text slightly muted
  transition: "all 0.3s ease",
};

function TabButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...glassyCyan,
        clipPath: "polygon(0 0, 100% 0, 95% 100%, 5% 100%)", // original shape
        padding: "8px 20px", // same padding
        fontSize: "0.85rem",
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: "1px",
        cursor: "pointer",
        boxShadow: active
          ? "0 0 12px rgba(6, 182, 212, 0.9)"
          : "0 0 6px rgba(6, 182, 212, 0.4)",
        background: active ? "rgba(6, 182, 212, 0.25)" : glassyCyan.background,
        color: active ? "rgba(255, 255, 255, 0.95)" : glassyCyan.color,
        borderColor: active ? "rgba(6, 182, 212, 0.9)" : glassyCyan.border,
        transition: "all 0.3s ease",
      }}
      className="hover:scale-105"
    >
      {label}
    </button>
  );
}

export default function SmallTabNavbar({ activeTab, setActiveTab }) {
  const tabs = ["Stats", "Survival durations", "Armory", "Equipped Skins"];

  return (
    <div
      className="flex items-center gap-3 px-4 py-2"
      style={{
        ...glassyCyan,
        borderRadius: "8px",
        justifyContent: "center",
        width: "fit-content",
        margin: "0 auto",
      }}
    >
      {tabs.map((tab) => (
        <TabButton
          key={tab}
          label={tab}
          active={activeTab === tab}
          onClick={() => setActiveTab(tab)}
        />
      ))}
    </div>
  );
}
