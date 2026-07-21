"use client";

import React from "react";

export const PixelInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }
>(function PixelInput({ className = "", error = false, ...rest }, ref) {
  return (
    <input
      ref={ref}
      className={`w-full bg-ink border-2 px-3 py-2 font-body text-xl text-white outline-none placeholder:text-white/30 tabular ${
        error
          ? "border-danger"
          : "border-black focus:border-robin"
      } shadow-pixel-sm ${className}`}
      {...rest}
    />
  );
});

export function PixelTextarea({
  className = "",
  ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full bg-ink border-2 border-black px-3 py-2 font-body text-xl text-white outline-none placeholder:text-white/30 focus:border-robin shadow-pixel-sm ${className}`}
      {...rest}
    />
  );
}
