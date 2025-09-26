// SciFiUsernameInput.jsx
import React, { useState, useRef, useEffect } from "react";
import { User } from "lucide-react";

export default function UsernameInput({
  value: controlledValue,
  onChange,
  placeholder = "Enter username",
  id = "sci-fi-username",
  className = "", // use this to control width: e.g., w-64, max-w-md
}) {
  const [value, setValue] = useState(controlledValue ?? "");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (controlledValue !== undefined && controlledValue !== value) {
      setValue(controlledValue);
    }
  }, [controlledValue]);

  const handleChange = (e) => setValue(e.target.value);

  const handleSubmit = () => onChange?.(value);

  const clear = () => {
    setValue("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={`relative ${className}`} aria-live="polite">
      <div
        className={`
          flex items-center gap-2 p-2.5 rounded-xl transition-all
          border border-cyan-300/10
          backdrop-blur-md bg-gradient-to-br from-[#061e2da6] to-[#020a14b4]
          shadow-[0_6px_18px_rgba(0,0,0,0.5)]
          ${
            focused
              ? "shadow-[0_8px_30px_rgba(0,200,255,0.14),_0_0_18px_rgba(0,200,255,0.06)_inset] -translate-y-[1px]"
              : ""
          }
        `}
      >
        {/* Neon accent bar */}
        <div
          aria-hidden
          className="w-[6px] h-9 rounded-[6px] bg-gradient-to-b from-cyan-400 to-cyan-600 shadow-[0_0_12px_rgba(0,200,255,0.6)] flex-shrink-0"
        />

        {/* Input wrapper */}
        <div className="relative flex-1">
          <label
            htmlFor={id}
            className={`
              absolute left-3 transition-all pointer-events-none font-bold tracking-wide
              ${
                value || focused
                  ? "text-[12px] -top-2 text-cyan-300 drop-shadow-[0_0_8px_rgba(0,220,255,0.45)] px-1"
                  : "text-[14px] top-1/2 -translate-y-1/2 text-cyan-100/60"
              }
            `}
          >
            <span className="flex items-center gap-1">
              <User size={14} />
              {placeholder}
            </span>
          </label>

          <input
            id={id}
            ref={inputRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            aria-label="username"
            type="text"
            autoComplete="username"
            className="w-full bg-transparent border-none outline-none text-cyan-50 px-3 pt-[10px] pb-2 text-[15px] font-semibold caret-cyan-400"
          />
        </div>

        {/* Clear button */}
        {value && (
          <button
            onClick={clear}
            aria-label="clear username"
            title="Clear"
            className="bg-transparent border-none text-cyan-100/90 p-2 rounded-lg flex items-center justify-center cursor-pointer shadow-[0_4px_12px_rgba(0,200,255,0.06)] hover:scale-105 transition-transform"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <path
                d="M6 6L18 18"
                stroke="rgba(0,220,255,0.95)"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <path
                d="M6 18L18 6"
                stroke="rgba(0,220,255,0.95)"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          aria-label="submit username"
          className={`
            bg-gradient-to-b from-cyan-400/10 to-cyan-700/5
            border border-cyan-300/10 p-2 rounded-lg flex items-center justify-center cursor-pointer
            ${focused ? "shadow-[0_8px_30px_rgba(0,200,255,0.08)]" : ""}
          `}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <path
              d="M5 12h14"
              stroke="rgba(0,220,255,0.95)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12 5l7 7-7 7"
              stroke="rgba(0,220,255,0.95)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
