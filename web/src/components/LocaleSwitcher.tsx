"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();

  const setLocale = (l: "tr" | "en") => {
    document.cookie = `locale=${l};path=/;max-age=31536000`;
    router.refresh();
  };

  return (
    <div className="flex border-2 border-black shadow-pixel-sm">
      {(["tr", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          className={`px-2 py-1 font-pixel text-[9px] uppercase ${
            locale === l
              ? "bg-robin text-black"
              : "bg-panel text-white/60 hover:text-robin"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
