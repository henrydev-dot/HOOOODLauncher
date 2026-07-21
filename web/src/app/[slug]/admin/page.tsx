"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { api } from "@/lib/api";
import { feeSplitterAbi } from "@/lib/abi";
import { FEESPLITTER_ADDRESS, THEME_PRESETS } from "@/lib/config";
import { fmtWei } from "@/lib/format";
import { useToastStore } from "@/lib/store";
import { DEMO_MODE } from "@/hooks/useHoodie";
import type { LauncherFeatures } from "@/lib/types";
import { PixelPanel } from "@/components/ui/PixelPanel";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelateUpload } from "@/components/PixelateUpload";

export default function AdminPage({ params }: { params: { slug: string } }) {
  const t = useTranslations("admin");
  const tCreate = useTranslations("create");
  const tc = useTranslations("common");
  const pushToast = useToastStore((s) => s.push);
  const { slug } = params;

  const { data: launcher } = useQuery({
    queryKey: ["launcher", slug],
    queryFn: () => api.launcher(slug),
  });

  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const [color, setColor] = useState("#CCFF00");
  const [logo, setLogo] = useState<string | null>(null);
  const [features, setFeatures] = useState<LauncherFeatures | null>(null);

  useEffect(() => {
    if (launcher) {
      setColor(launcher.themeColor);
      setLogo(launcher.logoDataUrl ?? null);
      setFeatures(launcher.features);
    }
  }, [launcher]);

  const { data: pending } = useReadContract({
    address: FEESPLITTER_ADDRESS,
    abi: feeSplitterAbi,
    functionName: "pendingFees",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !DEMO_MODE },
  });
  const pendingFees = DEMO_MODE
    ? 12_345n * 10n ** 18n
    : ((pending as bigint | undefined) ?? 0n);

  const isOwner =
    DEMO_MODE ||
    (launcher &&
      address &&
      launcher.owner.toLowerCase() === address.toLowerCase());

  if (!launcher) {
    return (
      <p className="py-24 text-center font-body text-2xl text-white/50">
        {tc("loading")}
      </p>
    );
  }

  if (!isOwner) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-pixel text-lg text-danger">{t("title")}</h1>
        <p className="mt-4 font-body text-xl text-white/60">
          {isConnected ? t("notOwner") : t("connectPrompt")}
        </p>
      </div>
    );
  }

  const featureItems = features
    ? ([
        ["chat", tCreate("featChat")],
        ["kingOfTheHill", tCreate("featKing")],
        ["antiSniper", tCreate("featAntiSniper")],
        ["liveTicker", tCreate("featTicker")],
        ["socialLinks", tCreate("featSocial")],
      ] as [keyof LauncherFeatures, string][])
    : [];

  const saveTheme = async () => {
    const ok = await api.updateLauncherConfig(slug, {
      themeColor: color,
      logoDataUrl: logo ?? undefined,
      features: features ?? undefined,
    });
    pushToast(ok ? t("savedOk") : t("saveFailed"), ok ? "success" : "error");
  };

  const claim = async () => {
    if (DEMO_MODE) {
      pushToast(tc("comingSoon"), "info");
      return;
    }
    try {
      await writeContractAsync({
        address: FEESPLITTER_ADDRESS,
        abi: feeSplitterAbi,
        functionName: "claim",
      });
      pushToast(tc("txConfirmed"), "success");
    } catch {
      pushToast(tc("txFailed"), "error");
    }
  };

  const exportGithub = async () => {
    const ok = await api.exportGithub(slug);
    if (!ok) pushToast(tc("comingSoon"), "info");
  };

  const exportZip = () => {
    const url = api.exportZipUrl(slug);
    if (url) window.open(url, "_blank");
    else pushToast(tc("comingSoon"), "info");
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-pixel text-xl" style={{ color: launcher.themeColor }}>
        ⚙ {t("title")}
      </h1>
      <p className="mt-1 font-body text-xl text-white/50">
        {launcher.name} · /{slug}
      </p>
      {DEMO_MODE && (
        <p className="mt-2 border-2 border-[#FF9E00] bg-[#FF9E00]/10 p-2 font-body text-base text-[#FF9E00]">
          {t("demoBypass")}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-6">
        {/* Theme & logo */}
        <PixelPanel title={t("themeTitle")} className="p-5">
          <label className="mb-2 block font-body text-lg text-white/60">
            {t("themeColor")}
          </label>
          <div className="flex flex-wrap gap-3">
            {THEME_PRESETS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`h-9 w-9 border-2 shadow-pixel-sm ${
                  color === c ? "border-white" : "border-black"
                }`}
                style={{ backgroundColor: c }}
                aria-label={c}
              />
            ))}
          </div>
          <div className="mt-4">
            <PixelateUpload value={logo} onChange={setLogo} />
          </div>
          <div className="mt-4">
            <PixelButton size="sm" onClick={saveTheme}>
              {t("saveTheme")}
            </PixelButton>
          </div>
        </PixelPanel>

        {/* Features */}
        {features && (
          <PixelPanel title={t("featuresTitle")} className="p-5">
            <div className="flex flex-col gap-2">
              {featureItems.map(([key, label]) => {
                const on = features[key];
                return (
                  <button
                    key={key}
                    onClick={() => setFeatures({ ...features, [key]: !on })}
                    className={`flex items-center justify-between border-2 px-3 py-2 ${
                      on ? "border-robin bg-robin/5" : "border-black bg-ink"
                    }`}
                  >
                    <span
                      className={`font-pixel text-[10px] uppercase ${
                        on ? "text-robin" : "text-white/50"
                      }`}
                    >
                      {label}
                    </span>
                    <span className="font-body text-lg">
                      {on ? "ON" : "OFF"}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-3 font-body text-base text-white/40">
              {t("antiSniperNote")}
            </p>
          </PixelPanel>
        )}

        {/* Earnings */}
        <PixelPanel title={t("earningsTitle")} className="p-5">
          <div className="flex items-center justify-between">
            <div className="font-body text-xl text-white/60">
              {t("pendingFees")}
            </div>
            <div className="font-pixel text-sm text-robin tabular">
              {fmtWei(pendingFees)} HOODIE
            </div>
          </div>
          <div className="mt-4">
            <PixelButton size="sm" variant="mint" onClick={claim}>
              {t("claimBtn")}
            </PixelButton>
          </div>
        </PixelPanel>

        {/* Export */}
        <PixelPanel title={t("exportTitle")} className="p-5">
          <p className="font-body text-lg text-white/60">{t("exportDesc")}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <PixelButton size="sm" variant="secondary" onClick={exportGithub}>
              ⬆ {t("exportGithub")}
            </PixelButton>
            <PixelButton size="sm" variant="secondary" onClick={exportZip}>
              ⬇ {t("exportZip")}
            </PixelButton>
          </div>
        </PixelPanel>
      </div>
    </div>
  );
}
