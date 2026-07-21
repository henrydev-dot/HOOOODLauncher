"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { HoodieCat } from "./mascots";

const ConnectButton = dynamic(
  () => import("@rainbow-me/rainbowkit").then((m) => m.ConnectButton),
  { ssr: false }
);

export function Nav() {
  const t = useTranslations("nav");
  return (
    <header className="sticky top-0 z-50 border-b-2 border-black bg-ink/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 group">
          <HoodieCat size={32} still />
          <span className="font-pixel text-sm text-robin group-hover:animate-blink">
            HOODIEPAD
          </span>
        </Link>
        <nav className="ml-6 hidden items-center gap-5 md:flex">
          <Link
            href="/explore"
            className="font-pixel text-[10px] uppercase text-white/70 hover:text-robin"
          >
            {t("explore")}
          </Link>
          <Link
            href="/create"
            className="font-pixel text-[10px] uppercase text-white/70 hover:text-robin"
          >
            {t("create")}
          </Link>
          <Link
            href="/docs"
            className="font-pixel text-[10px] uppercase text-white/70 hover:text-robin"
          >
            {t("docs")}
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <LocaleSwitcher />
          <ConnectButton
            showBalance={false}
            accountStatus="address"
            chainStatus="icon"
          />
        </div>
      </div>
      <nav className="flex items-center justify-center gap-6 border-t border-white/10 py-2 md:hidden">
        <Link href="/explore" className="font-pixel text-[9px] uppercase text-white/70">
          {t("explore")}
        </Link>
        <Link href="/create" className="font-pixel text-[9px] uppercase text-white/70">
          {t("create")}
        </Link>
        <Link href="/docs" className="font-pixel text-[9px] uppercase text-white/70">
          {t("docs")}
        </Link>
      </nav>
    </header>
  );
}
