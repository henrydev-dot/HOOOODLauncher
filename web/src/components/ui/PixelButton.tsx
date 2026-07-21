"use client";

import React from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost" | "mint";

const styles: Record<Variant, string> = {
  primary:
    "bg-robin text-black border-black hover:brightness-110",
  secondary:
    "bg-panel text-white border-black hover:border-robin hover:text-robin",
  danger: "bg-danger text-black border-black hover:brightness-110",
  mint: "bg-mint text-black border-black hover:brightness-110",
  ghost:
    "bg-transparent text-robin border-robin shadow-none hover:bg-robin hover:text-black",
};

export function PixelButton({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "px-3 py-1.5 text-[10px]",
    md: "px-5 py-3 text-xs",
    lg: "px-8 py-4 text-sm",
  } as const;
  return (
    <button
      className={`font-pixel uppercase tracking-wide border-2 shadow-pixel transition-transform duration-75 hover:-translate-x-px hover:-translate-y-px active:translate-x-0.5 active:translate-y-0.5 active:shadow-pixel-sm disabled:opacity-40 disabled:pointer-events-none ${styles[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
