"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type { Launcher } from "@/lib/types";
import { getMascot } from "@/components/mascots";

const ConnectButton = dynamic(
  () => import("@rainbow-me/rainbowkit").then((m) => m.ConnectButton),
  { ssr: false }
);

/** White-label header for a launcher: the launcher's own logo, name, theme,
 *  menu and socials. No HOODIEPAD branding. */
export function LauncherNav({ launcher }: { launcher: Launcher }) {
  const t = useTranslations("launcher");
  const [open, setOpen] = useState(false);
  const Mascot = getMascot(launcher.mascotId).Component;
  const base = `/${launcher.slug}`;

  const links = [
    { href: base, label: t("tokens") },
    { href: `${base}/create-token`, label: t("createToken") },
    { href: `${base}/admin`, label: t("adminPanel") },
  ];

  const socials = launcher.features.socialLinks
    ? [
        launcher.social.x && { label: "X", href: launcher.social.x },
        launcher.social.telegram && {
          label: "Telegram",
          href: launcher.social.telegram,
        },
        launcher.social.website && {
          label: "Web",
          href: launcher.social.website,
        },
      ].filter(Boolean as unknown as (v: unknown) => v is { label: string; href: string })
    : [];

  return (
    <header className="sticky top-0 z-50 border-b-2 border-black bg-ink/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <Link href={base} className="flex items-center gap-3 group shrink-0">
          {launcher.logoDataUrl ? (
            <Image
              src={launcher.logoDataUrl}
              alt={launcher.name}
              width={36}
              height={36}
              className="pixelated border-2 border-black"
              unoptimized
            />
          ) : (
            <Mascot size={36} color={launcher.themeColor} still />
          )}
          <span
            className="font-pixel text-sm uppercase group-hover:animate-blink"
            style={{ color: launcher.themeColor }}
          >
            {launcher.name}
          </span>
        </Link>

        {/* Desktop menu */}
        <nav className="ml-8 hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="font-body text-xl uppercase tracking-wide text-white/70 transition-colors hover:text-[var(--color-robin)]"
            >
              {l.label}
            </Link>
          ))}
          {socials.map((s) => (
            <a
              key={s.href}
              href={s.href}
              target="_blank"
              rel="noreferrer"
              className="font-body text-xl uppercase tracking-wide text-white/40 hover:text-[var(--color-robin)]"
            >
              {s.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <ConnectButton
            showBalance={false}
            accountStatus="address"
            chainStatus="icon"
          />
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            className="flex h-10 w-10 items-center justify-center border-2 border-black bg-panel shadow-pixel-sm md:hidden"
            style={{ color: launcher.themeColor }}
          >
            <span className="font-pixel text-base leading-none">
              {open ? "✕" : "≡"}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="flex flex-col border-t-2 border-black bg-ink md:hidden">
          {[...links, ...socials].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="border-b border-white/10 px-5 py-4 font-body text-2xl uppercase tracking-wide text-white/80 hover:bg-panel"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
