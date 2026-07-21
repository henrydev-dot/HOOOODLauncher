import type { Metadata } from "next";
import Link from "next/link";
import { Providers } from "@/components/Providers";
import { ConnectButton } from "@/components/ConnectButton";
import { config } from "@/lib/config";
import "./globals.css";

export const metadata: Metadata = {
  title: `${config.name} — powered by HOODIEPAD`,
  description: `Launch and trade tokens against $HOODIE on ${config.name}.`,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scheme={config.scheme}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>
          <header className="border-b-2 border-white/20 bg-panel">
            <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
              <Link href="/" className="flex items-center gap-3">
                <span className="text-2xl">{config.mascot}</span>
                <span
                  className="font-pixel text-sm sm:text-base"
                  style={{ color: config.themeColor }}
                >
                  {config.name}
                </span>
              </Link>
              <ConnectButton />
            </div>
          </header>
          <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
          <footer className="mx-auto max-w-5xl px-4 py-8 text-center font-vt text-lg text-white/40">
            powered by HOODIEPAD · all trades settle in $HOODIE
          </footer>
        </Providers>
      </body>
    </html>
  );
}
