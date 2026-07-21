"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { HOODIE_ADDRESS, EXPLORER_URL } from "@/lib/config";
import { shortAddr } from "@/lib/format";

export function Footer() {
  const t = useTranslations("footer");
  return (
    <footer className="mt-16 border-t-2 border-black bg-panel/60">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 py-8 text-center">
        <div className="font-pixel text-[10px] text-robin">HOODIEPAD</div>
        <p className="max-w-xl font-body text-lg text-white/60">
          {t("tagline")}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 font-body text-lg">
          <Link href="/docs" className="text-white/60 hover:text-robin">
            {t("docs")}
          </Link>
          <a
            href={`${EXPLORER_URL}/token/${HOODIE_ADDRESS}`}
            target="_blank"
            rel="noreferrer"
            className="text-white/60 hover:text-robin tabular"
          >
            $HOODIE {shortAddr(HOODIE_ADDRESS)}
          </a>
        </div>
        <p className="font-body text-base text-white/30">{t("disclaimer")}</p>
      </div>
    </footer>
  );
}
