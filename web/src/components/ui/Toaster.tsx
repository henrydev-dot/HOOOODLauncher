"use client";

import { useToastStore } from "@/lib/store";

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismiss(t.id)}
          className={`border-2 border-black px-4 py-2 text-left font-body text-lg shadow-pixel ${
            t.kind === "success"
              ? "bg-mint text-black"
              : t.kind === "error"
                ? "bg-danger text-black"
                : "bg-panel text-white"
          }`}
        >
          {t.message}
        </button>
      ))}
    </div>
  );
}
