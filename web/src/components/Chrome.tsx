"use client";

import { usePathname } from "next/navigation";
import { Nav } from "./Nav";
import { Footer } from "./Footer";

/** First path segments that belong to the HOODIEPAD platform itself. */
const APP_ROUTES = new Set(["", "explore", "create", "docs"]);

/**
 * Renders the global HOODIEPAD nav/footer only on platform pages. Launcher
 * pages (`/[slug]/...`) are white-labeled: they show their own header/footer
 * instead, so HOODIEPAD branding never appears there.
 */
export function Chrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const first = pathname.split("/")[1] ?? "";
  const isLauncherRoute = !APP_ROUTES.has(first);

  return (
    <>
      {!isLauncherRoute && <Nav />}
      <main className="flex-1">{children}</main>
      {!isLauncherRoute && <Footer />}
    </>
  );
}
