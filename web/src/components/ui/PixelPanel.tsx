import React from "react";

export function PixelPanel({
  className = "",
  title,
  accent = false,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & {
  title?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={`bg-panel border-2 ${
        accent ? "border-robin shadow-pixel-robin" : "border-black shadow-pixel"
      } ${className}`}
      {...rest}
    >
      {title !== undefined && (
        <div className="border-b-2 border-black bg-black/40 px-4 py-2 font-pixel text-[10px] uppercase tracking-wider text-robin">
          {title}
        </div>
      )}
      {children}
    </div>
  );
}
