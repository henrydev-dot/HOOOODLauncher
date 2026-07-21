"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { LauncherNav } from "@/components/LauncherNav";

/**
 * White-label wrapper for every launcher page (`/[slug]`, `/[slug]/token/...`,
 * `/[slug]/create-token`, `/[slug]/admin`). Applies the launcher's theme color
 * and shows its own header — HOODIEPAD's global nav is hidden on these routes.
 */
export default function LauncherLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  const tc = useTranslations("common");
  const { data: launcher } = useQuery({
    queryKey: ["launcher", params.slug],
    queryFn: () => api.launcher(params.slug),
  });

  const themeStyle = launcher
    ? ({ "--color-robin": launcher.themeColor } as CSSProperties)
    : undefined;

  return (
    <div style={themeStyle} className="flex min-h-screen flex-col">
      {launcher && <LauncherNav launcher={launcher} />}
      <div className="flex-1">{children}</div>
      <footer className="border-t-2 border-black py-4 text-center">
        <Link
          href="/"
          className="font-body text-base uppercase tracking-wide text-white/25 hover:text-white/50"
        >
          {tc("poweredBy")} HOODIEPAD
        </Link>
      </footer>
    </div>
  );
}
