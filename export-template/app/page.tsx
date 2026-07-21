"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { fetchLauncher, formatWad, shortAddress } from "@/lib/api";
import { config } from "@/lib/config";

export default function HomePage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["launcher", config.slug],
    queryFn: fetchLauncher,
  });

  return (
    <div className="space-y-8">
      <section className="pixel-panel p-6 sm:p-8">
        <h1
          className="font-pixel text-lg leading-relaxed sm:text-2xl"
          style={{ color: config.themeColor }}
        >
          {config.mascot} {config.name}
        </h1>
        <p className="mt-4 font-vt text-2xl text-white/70">
          Every token here trades against{" "}
          <span style={{ color: config.themeColor }}>$HOODIE</span> on a bonding
          curve. Hit the target, graduate to the DEX. No presale, no team
          allocation.
        </p>
        {data && (
          <div className="mt-6 flex flex-wrap gap-6 font-vt text-xl text-white/60">
            <span>
              TOKENS: <b className="text-white">{data.tokenCount}</b>
            </span>
            <span>
              VOLUME:{" "}
              <b className="text-white">{formatWad(data.volumeHoodie, 2)}</b>{" "}
              $HOODIE
            </span>
            <span>
              CURATOR: <b className="text-white">{shortAddress(data.owner)}</b>
            </span>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 font-pixel text-sm text-white/80">TOKEN LIST</h2>

        {isLoading && (
          <div className="pixel-panel p-6 font-vt text-2xl text-white/50">
            LOADING…
          </div>
        )}

        {isError && (
          <div className="pixel-panel p-6 font-vt text-2xl text-white/50">
            API UNREACHABLE ({config.apiUrl}). Set NEXT_PUBLIC_API_URL or edit
            launcher.config.json.
          </div>
        )}

        {data && data.tokens.length === 0 && (
          <div className="pixel-panel p-6 font-vt text-2xl text-white/50">
            NO TOKENS YET. BE THE FIRST.
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {data?.tokens.map((token) => (
            <Link
              key={token.address}
              href={`/token/${token.address}`}
              className="pixel-panel block p-4 transition-transform hover:-translate-y-1"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-pixel text-xs">{token.symbol}</span>
                {token.graduated ? (
                  <span
                    className="font-pixel text-[10px]"
                    style={{ color: config.themeColor }}
                  >
                    GRADUATED
                  </span>
                ) : (
                  <span className="font-pixel text-[10px] text-white/40">
                    CURVE
                  </span>
                )}
              </div>
              <div className="mt-2 truncate font-vt text-2xl text-white/80">
                {token.name}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 font-vt text-lg text-white/50">
                <span>
                  PRICE{" "}
                  <b className="text-white">
                    {formatWad(token.lastPriceHoodie, 6)}
                  </b>
                </span>
                <span>
                  VOL{" "}
                  <b className="text-white">{formatWad(token.volumeHoodie, 1)}</b>
                </span>
                <span>
                  TRADES <b className="text-white">{token.tradeCount}</b>
                </span>
                <span>
                  HOLDERS <b className="text-white">{token.holderCount}</b>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
