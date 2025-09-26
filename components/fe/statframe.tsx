import React from "react";

// Shared "glassy" style
const glassyCyan = {
  background: "rgba(15, 23, 42, 0.85)",
  border: "1px solid rgba(6, 182, 212, 0.5)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  color: "#dfffff",
};
type FrameProps = {
  name: string;
  value: string | number;
  style?: React.CSSProperties;
};
export default function Frame({ name, value, style }: FrameProps) {
  return (
    <div
      className="flex items-center justify-between px-4 py-2"
      style={{
        width: "160px",
        height: "48px",
        clipPath: "polygon(10% 0%, 100% 0%, 90% 100%, 0 100%)",
        fontSize: "0.9rem",
        ...glassyCyan, // base style
        ...style, // customizations like clipPath, borders, etc.
      }}
    >
      <span className="text-xs text-[#9fe] uppercase tracking-widest">
        {name}
      </span>
      <span className="text-base font-bold">{value}</span>
    </div>
  );
}
