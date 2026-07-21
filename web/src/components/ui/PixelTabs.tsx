"use client";

import React from "react";

export interface TabItem {
  id: string;
  label: React.ReactNode;
}

export function PixelTabs({
  tabs,
  active,
  onChange,
  className = "",
  size = "md",
}: {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`} role="tablist">
      {tabs.map((t) => {
        const isActive = t.id === active;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(t.id)}
            className={`font-pixel uppercase border-2 transition-transform duration-75 hover:-translate-y-px ${
              size === "sm" ? "px-2 py-1 text-[8px]" : "px-3 py-2 text-[10px]"
            } ${
              isActive
                ? "bg-robin text-black border-black shadow-pixel-sm"
                : "bg-panel text-white/70 border-black hover:text-robin"
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
