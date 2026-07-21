"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useReadContract } from "wagmi";
import { TradePanel } from "@/components/TradePanel";
import { bondingCurveAbi } from "@/lib/abis";
import { fetchToken, fetchTrades, formatWad, shortAddress } from "@/lib/api";
import { config } from "@/lib/config";

export default function TokenPage() {
  const params = useParams<{ address: string }>();
  const address = (params.address ?? "").toLowerCase() as `0x${string}`;
  const validAddress = /^0x[0-9a-f]{40}$/.test(address);

  const { data: token } = useQuery({
    queryKey: ["token", address],
    queryFn: () => fetchToken(address),
    enabled: validAddress,
  });

  const { data: trades } = useQuery({
    queryKey: ["trades", address],
    queryFn: () => fetchTrades(address),
    enabled: validAddress,
  });

  // Live curve state straight from the chain (falls back to API data).
  const { data: state } = useReadContract({
    address: config.contracts.curve,
    abi: bondingCurveAbi,
    functionName: "getState",
    args: [address],
    query: { enabled: validAddress, refetchInterval: 10_000 },
  });

  if (!validAddress) {
    return (
      <div className="pixel-panel p-6 font-vt text-2xl text-white/60">
        INVALID TOKEN ADDRESS.{" "}
        <Link href="/" className="underline" style={{ color: config.themeColor }}>
          BACK TO LIST
        </Link>
      </div>
    );
  }

  const graduated = state?.[4] ?? token?.graduated ?? false;
  const realHoodie = state?.[2] ?? BigInt(token?.realHoodieReserve ?? "0");
  const target = state?.[5] ?? 0n;
  const progressPct = graduated
    ? 100
    : target > 0n
      ? Math.min(100, Number((realHoodie * 10_000n) / target) / 100)
      : 0;

  return (
    <div className="space-y-6">
      <Link href="/" className="font-vt text-xl text-white/50 hover:text-white">
        ← BACK
      </Link>

      <div className="pixel-panel p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="font-pixel text-base sm:text-xl">
            {token?.name ?? shortAddress(address)}{" "}
            <span style={{ color: config.themeColor }}>
              {token ? `$${token.symbol}` : ""}
            </span>
          </h1>
          {graduated && (
            <span
              className="font-pixel text-[10px]"
              style={{ color: config.themeColor }}
            >
              GRADUATED
            </span>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-6 font-vt text-xl text-white/60">
          <span>
            PRICE{" "}
            <b className="text-white">
              {formatWad(token?.lastPriceHoodie ?? "0", 6)}
            </b>{" "}
            $HOODIE
          </span>
          <span>
            VOL <b className="text-white">{formatWad(token?.volumeHoodie ?? "0", 1)}</b>
          </span>
          <span>
            HOLDERS <b className="text-white">{token?.holderCount ?? "—"}</b>
          </span>
          <span>
            CREATOR{" "}
            <b className="text-white">
              {token ? shortAddress(token.creator) : "—"}
            </b>
          </span>
        </div>

        {/* Graduation progress */}
        <div className="mt-5">
          <div className="mb-1 flex justify-between font-vt text-lg text-white/60">
            <span>GRADUATION PROGRESS</span>
            <span className="text-white">{progressPct.toFixed(1)}%</span>
          </div>
          <div className="h-5 border-2 border-white/30 bg-black">
            <div
              className="h-full"
              style={{
                width: `${progressPct}%`,
                backgroundColor: config.themeColor,
                boxShadow: `2px 0 0 0 #000 inset`,
              }}
            />
          </div>
          <div className="mt-1 font-vt text-lg text-white/40">
            {formatWad(realHoodie, 1)} / {target > 0n ? formatWad(target, 1) : "?"}{" "}
            $HOODIE raised
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Recent trades */}
        <div className="pixel-panel p-4">
          <h2 className="mb-3 font-pixel text-xs text-white/80">RECENT TRADES</h2>
          {!trades || trades.length === 0 ? (
            <div className="font-vt text-xl text-white/40">NO TRADES YET</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full font-vt text-lg">
                <thead className="text-left text-white/40">
                  <tr>
                    <th className="pr-4">SIDE</th>
                    <th className="pr-4">$HOODIE</th>
                    <th className="pr-4">TOKENS</th>
                    <th className="pr-4">TRADER</th>
                    <th>TIME</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((t) => (
                    <tr key={t.id} className="border-t border-white/10">
                      <td
                        className="pr-4"
                        style={{ color: t.isBuy ? config.themeColor : "#FF5C5C" }}
                      >
                        {t.isBuy ? "BUY" : "SELL"}
                      </td>
                      <td className="pr-4">{formatWad(t.hoodieAmount, 2)}</td>
                      <td className="pr-4">{formatWad(t.tokenAmount, 2)}</td>
                      <td className="pr-4 text-white/60">
                        {shortAddress(t.trader)}
                      </td>
                      <td className="text-white/40">
                        {new Date(Number(t.timestamp) * 1000).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Trade panel */}
        <div>
          {graduated ? (
            <div className="pixel-panel p-6 font-vt text-xl text-white/60">
              THIS TOKEN GRADUATED — trade it on the DEX pair{" "}
              <span className="text-white">
                {token?.pair ? shortAddress(token.pair) : ""}
              </span>
              .
            </div>
          ) : (
            <TradePanel token={address} symbol={token?.symbol ?? "TOKEN"} />
          )}
        </div>
      </div>
    </div>
  );
}
