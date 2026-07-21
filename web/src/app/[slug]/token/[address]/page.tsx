"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import type { Address } from "viem";
import { useWriteContract } from "wagmi";
import type { CSSProperties } from "react";
import { api } from "@/lib/api";
import { graduationManagerAbi } from "@/lib/abi";
import { GRADUATION_ADDRESS, UNISWAP_POOL_URL } from "@/lib/config";
import { compact, fmtPrice, shortAddr } from "@/lib/format";
import { useToastStore } from "@/lib/store";
import { DEMO_MODE } from "@/hooks/useHoodie";
import { getMascot } from "@/components/mascots";
import { PixelPanel } from "@/components/ui/PixelPanel";
import { PixelBadge } from "@/components/ui/PixelBadge";
import { PixelButton } from "@/components/ui/PixelButton";
import { CandleChart } from "@/components/CandleChart";
import { TradePanel } from "@/components/TradePanel";
import { TradesList } from "@/components/TradesList";
import { HoldersTable } from "@/components/HoldersTable";
import { GraduationBar } from "@/components/GraduationBar";

export default function TokenPage({
  params,
}: {
  params: { slug: string; address: string };
}) {
  const t = useTranslations("token");
  const tc = useTranslations("common");
  const pushToast = useToastStore((s) => s.push);
  const { slug, address } = params;

  const { data: launcher } = useQuery({
    queryKey: ["launcher", slug],
    queryFn: () => api.launcher(slug),
  });
  const { data: token, isLoading } = useQuery({
    queryKey: ["token", address],
    queryFn: () => api.token(address),
  });
  const { data: trades } = useQuery({
    queryKey: ["trades", address],
    queryFn: () => api.trades(address),
    refetchInterval: 15_000,
  });
  const { data: holders } = useQuery({
    queryKey: ["holders", address],
    queryFn: () => api.holders(address),
  });

  const { writeContractAsync } = useWriteContract();

  if (isLoading) {
    return (
      <p className="py-24 text-center font-body text-2xl text-white/50">
        {tc("loading")}
      </p>
    );
  }
  if (!token) {
    return (
      <p className="py-24 text-center font-pixel text-sm text-danger">
        {t("notFound")}
      </p>
    );
  }

  const themeColor = launcher?.themeColor ?? "#CCFF00";
  const { Component: Mascot } = getMascot(token.mascotId);
  const readyToGraduate = !token.graduated && token.progressBps >= 10_000;

  const graduate = async () => {
    if (DEMO_MODE) {
      pushToast(tc("comingSoon"), "info");
      return;
    }
    try {
      await writeContractAsync({
        address: GRADUATION_ADDRESS,
        abi: graduationManagerAbi,
        functionName: "graduate",
        args: [token.address as Address],
      });
      pushToast(tc("txConfirmed"), "success");
    } catch {
      pushToast(tc("txFailed"), "error");
    }
  };

  return (
    <div
      className="mx-auto max-w-7xl px-4 py-8"
      style={{ "--color-robin": themeColor } as CSSProperties}
    >
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        {token.logoDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={token.logoDataUrl}
            alt={token.name}
            className="h-16 w-16 border-2 border-black"
          />
        ) : (
          <Mascot size={64} color={themeColor} />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-pixel text-lg text-white">{token.name}</h1>
            <span className="font-body text-2xl text-white/40">
              ${token.symbol}
            </span>
            {token.graduated && (
              <PixelBadge tone="mint">{tc("graduated")}</PixelBadge>
            )}
          </div>
          <p className="font-body text-lg text-white/50">
            {token.description} · {shortAddr(token.address)}
          </p>
        </div>
        <div className="flex gap-6 font-body text-lg tabular">
          <div>
            <div className="text-white/40">{tc("price")}</div>
            <div className="text-xl" style={{ color: themeColor }}>
              {fmtPrice(token.priceHoodie)} HOODIE
            </div>
          </div>
          <div>
            <div className="text-white/40">{tc("marketCap")}</div>
            <div className="text-xl text-white">
              {compact(token.marketCapHoodie)}
            </div>
          </div>
          <div>
            <div className="text-white/40">{tc("volume24h")}</div>
            <div className="text-xl text-white">{compact(token.volume24h)}</div>
          </div>
        </div>
      </div>

      {/* Graduation */}
      <div className="mt-6">
        <GraduationBar
          progressBps={token.progressBps}
          realHoodieReserve={Number(BigInt(token.realHoodieReserve) / 10n ** 18n)}
          color={themeColor}
        />
        <div className="mt-2 flex flex-wrap items-center gap-3">
          {token.graduated && token.pairAddress && (
            <a
              href={UNISWAP_POOL_URL(token.pairAddress)}
              target="_blank"
              rel="noreferrer"
            >
              <PixelButton size="sm" variant="mint">
                🦄 {t("uniswapPool")} →
              </PixelButton>
            </a>
          )}
          {readyToGraduate && (
            <PixelButton size="sm" onClick={graduate}>
              🎓 {t("graduateBtn")}
            </PixelButton>
          )}
        </div>
      </div>

      {/* Main grid */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex min-w-0 flex-col gap-6">
          <CandleChart tokenAddress={address} color={themeColor} />

          <PixelPanel title={t("holdersTitle")} className="p-4">
            <HoldersTable holders={holders ?? []} />
          </PixelPanel>

          {launcher?.features.chat !== false && (
            <PixelPanel title={t("commentsTitle")} className="p-4">
              <p className="font-body text-lg text-white/40">
                {t("commentsSoon")}
              </p>
            </PixelPanel>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <TradePanel token={token} themeColor={themeColor} />

          <PixelPanel title={t("securityTitle")} className="p-4">
            <div className="flex flex-wrap gap-2">
              <PixelBadge tone="mint">✓ {t("secMint")}</PixelBadge>
              <PixelBadge tone="mint">✓ {t("secLp")}</PixelBadge>
              <PixelBadge tone="neutral">✓ {t("secCurve")}</PixelBadge>
            </div>
          </PixelPanel>

          <PixelPanel title={t("tradesTitle")} className="px-4 py-2">
            <div className="max-h-96 overflow-y-auto">
              <TradesList trades={trades ?? []} />
            </div>
          </PixelPanel>
        </div>
      </div>
    </div>
  );
}
