"use client";

import { useState } from "react";
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
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/explore", label: t("explore") },
    { href: "/create", label: t("create") },
    { href: "/docs", label: t("docs") },
  ];

  return (
    <header className="sticky top-0 z-50 border-b-2 border-black bg-ink/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <HoodieCat size={32} still />
          <span className="font-pixel text-sm text-robin group-hover:animate-blink">
            HOODIEPAD
          </span>
        </Link>

        {/* Desktop nav — larger, readable */}
        <nav className="ml-8 hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="font-body text-xl uppercase tracking-wide text-white/70 transition-colors hover:text-robin"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <LocaleSwitcher />
          <ConnectButton
            showBalance={false}
            accountStatus="address"
            chainStatus="icon"
          />
          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            className="flex h-10 w-10 items-center justify-center border-2 border-black bg-panel text-robin shadow-pixel-sm md:hidden"
          >
            <span className="font-pixel text-base leading-none">
              {open ? "✕" : "≡"}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {open && (
        <nav className="flex flex-col border-t-2 border-black bg-ink md:hidden">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="border-b border-white/10 px-5 py-4 font-body text-2xl uppercase tracking-wide text-white/80 hover:bg-panel hover:text-robin"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
