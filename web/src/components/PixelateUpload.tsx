"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { PixelButton } from "./ui/PixelButton";

/**
 * Client-side logo upload with pixelation preview:
 * image is downscaled to a small grid on a canvas, then re-exported so the
 * result is a chunky 8-bit data URL (pinned to IPFS via /api/pin later).
 */
export function PixelateUpload({
  value,
  onChange,
  gridSize = 24,
}: {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  gridSize?: number;
}) {
  const t = useTranslations("create");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const small = document.createElement("canvas");
        small.width = gridSize;
        small.height = gridSize;
        const sctx = small.getContext("2d");
        if (!sctx) return;
        sctx.drawImage(img, 0, 0, gridSize, gridSize);

        const out = document.createElement("canvas");
        const size = 192;
        out.width = size;
        out.height = size;
        const octx = out.getContext("2d");
        if (!octx) return;
        octx.imageSmoothingEnabled = false;
        octx.drawImage(small, 0, 0, gridSize, gridSize, 0, 0, size, size);
        onChange(out.toDataURL("image/png"));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex h-24 w-24 items-center justify-center border-2 border-black bg-ink shadow-pixel-sm">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="logo" className="h-full w-full" />
        ) : (
          <span className="font-pixel text-2xl text-white/20">?</span>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        <PixelButton
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => inputRef.current?.click()}
        >
          {t("logoUpload")}
        </PixelButton>
        {value && (
          <PixelButton
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange(null)}
          >
            {t("logoRemove")}
          </PixelButton>
        )}
      </div>
    </div>
  );
}
