"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { keccak256, parseUnits, stringToBytes } from "viem";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { api } from "@/lib/api";
import { launcherRegistryAbi } from "@/lib/abi";
import { REGISTRY_ADDRESS, THEME_PRESETS, ZERO_ADDRESS } from "@/lib/config";
import { useWizardStore } from "@/lib/store";
import { MOCK_TOKENS } from "@/lib/mockData";
import type { Launcher } from "@/lib/types";
import { DEMO_MODE, useApproveAndCall, useHoodieAllowance } from "@/hooks/useHoodie";
import { MASCOTS, getMascot } from "@/components/mascots";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelPanel } from "@/components/ui/PixelPanel";
import { PixelInput } from "@/components/ui/PixelInput";
import { PixelBadge } from "@/components/ui/PixelBadge";
import { Confetti } from "@/components/ui/Confetti";
import { PixelateUpload } from "@/components/PixelateUpload";
import { ThemedScheme } from "@/components/schemes";

const SLUG_RE = /^[a-z0-9-]{3,32}$/;
const CREATION_FEE = parseUnits("50000", 18);

function StepDots({ step }: { step: number }) {
  const t = useTranslations("create");
  const labels = [t("step1"), t("step2"), t("step3"), t("step4"), t("step5")];
  return (
    <div className="flex flex-wrap items-center gap-2">
      {labels.map((label, i) => {
        const n = i + 1;
        const active = n === step;
        const done = n < step;
        return (
          <div key={label} className="flex items-center gap-2">
            <span
              className={`flex h-8 w-8 items-center justify-center border-2 border-black font-pixel text-[10px] ${
                active
                  ? "bg-robin text-black shadow-pixel-sm"
                  : done
                    ? "bg-mint text-black"
                    : "bg-panel text-white/40"
              }`}
            >
              {done ? "✓" : n}
            </span>
            <span
              className={`hidden font-pixel text-[9px] uppercase sm:inline ${
                active ? "text-robin" : "text-white/40"
              }`}
            >
              {label}
            </span>
            {n < 5 && <span className="text-white/20">—</span>}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------ Step 1 ------------------------------ */

function useSlugAvailability(slug: string) {
  const publicClient = usePublicClient();
  const valid = SLUG_RE.test(slug);
  return useQuery({
    queryKey: ["slug-check", slug],
    enabled: valid,
    queryFn: async () => {
      // API / mock check
      const apiTaken = await api.slugTaken(slug);
      if (apiTaken) return { taken: true };
      // On-chain registry check when configured
      if (REGISTRY_ADDRESS !== ZERO_ADDRESS && publicClient) {
        try {
          const id = await publicClient.readContract({
            address: REGISTRY_ADDRESS,
            abi: launcherRegistryAbi,
            functionName: "launcherIdBySlugHash",
            args: [keccak256(stringToBytes(slug))],
          });
          return { taken: (id as bigint) > 0n };
        } catch {
          /* registry unreachable — fall through */
        }
      }
      return { taken: false };
    },
  });
}

function Step1() {
  const t = useTranslations("create");
  const { name, slug, set } = useWizardStore();
  const valid = SLUG_RE.test(slug);
  const { data, isFetching } = useSlugAvailability(slug);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <label className="mb-1 block font-pixel text-[10px] uppercase text-white/60">
          {t("nameLabel")}
        </label>
        <PixelInput
          value={name}
          placeholder={t("namePlaceholder")}
          onChange={(e) => {
            const v = e.target.value;
            set({
              name: v,
              slug: v
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "")
                .slice(0, 32),
            });
          }}
        />
      </div>
      <div>
        <label className="mb-1 block font-pixel text-[10px] uppercase text-white/60">
          {t("slugLabel")}
        </label>
        <div className="flex items-center gap-2">
          <span className="font-body text-xl text-white/40">hoodiepad.xyz/</span>
          <PixelInput
            value={slug}
            error={slug.length > 0 && !valid}
            onChange={(e) => set({ slug: e.target.value.toLowerCase() })}
          />
        </div>
        <p className="mt-1 font-body text-base text-white/40">{t("slugHint")}</p>
        {slug.length > 0 && (
          <p className="mt-1 font-body text-lg">
            {!valid ? (
              <span className="text-danger">{t("slugInvalid")}</span>
            ) : isFetching ? (
              <span className="text-white/50">{t("slugChecking")}</span>
            ) : data?.taken ? (
              <span className="text-danger">✗ {t("slugTaken")}</span>
            ) : data ? (
              <span className="text-mint">✓ {t("slugFree")}</span>
            ) : null}
          </p>
        )}
      </div>
    </div>
  );
}

/* ------------------------------ Step 2 ------------------------------ */

function Step2() {
  const t = useTranslations("create");
  const { logoDataUrl, mascotId, themeColor, set } = useWizardStore();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <label className="mb-2 block font-pixel text-[10px] uppercase text-white/60">
          {t("logoLabel")}
        </label>
        <PixelateUpload
          value={logoDataUrl}
          onChange={(v) => set({ logoDataUrl: v })}
        />
        <p className="mt-2 font-body text-base text-white/40">{t("logoHint")}</p>
      </div>
      <div>
        <label className="mb-2 block font-pixel text-[10px] uppercase text-white/60">
          {t("mascotLabel")}
        </label>
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
          {MASCOTS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => set({ mascotId: m.id })}
              title={m.name}
              className={`flex items-center justify-center border-2 p-2 ${
                mascotId === m.id
                  ? "border-robin bg-robin/10 shadow-pixel-sm"
                  : "border-black bg-ink hover:border-white/40"
              }`}
            >
              <m.Component size={48} color={themeColor} still />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Step 3 ------------------------------ */

function buildPreviewLauncher(): Launcher {
  const s = useWizardStore.getState();
  return {
    id: 0,
    slug: s.slug || "preview",
    name: s.name || "PREVIEW",
    description: "…",
    owner: ZERO_ADDRESS,
    feeRecipient: ZERO_ADDRESS,
    launcherFeeBps: s.feeBps,
    themeColor: s.themeColor,
    scheme: s.scheme,
    mascotId: s.mascotId,
    logoDataUrl: s.logoDataUrl ?? undefined,
    features: s.features,
    social: s.social,
    createdAt: Date.now(),
    tokenCount: 2,
    volume24h: 123_456,
    volumeTotal: 1_234_567,
  };
}

function Step3() {
  const t = useTranslations("create");
  const ts = useTranslations("schemes");
  const wizard = useWizardStore();
  const { themeColor, scheme, set } = wizard;
  const [hex, setHex] = useState(themeColor);

  const previewLauncher = useMemo(
    () => ({ ...buildPreviewLauncher(), themeColor, scheme }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [themeColor, scheme, wizard.name, wizard.mascotId, wizard.logoDataUrl]
  );
  const previewTokens = MOCK_TOKENS.slice(1, 4).map((tok) => ({
    ...tok,
    launcherSlug: previewLauncher.slug,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <label className="mb-2 block font-pixel text-[10px] uppercase text-white/60">
          {t("themeLabel")}
        </label>
        <div className="flex flex-wrap items-center gap-3">
          {THEME_PRESETS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                set({ themeColor: c });
                setHex(c);
              }}
              className={`h-10 w-10 border-2 shadow-pixel-sm ${
                themeColor === c ? "border-white" : "border-black"
              }`}
              style={{ backgroundColor: c }}
              aria-label={c}
            />
          ))}
          <div className="flex items-center gap-2">
            <span className="font-body text-lg text-white/50">{t("customHex")}</span>
            <PixelInput
              className="w-28"
              value={hex}
              onChange={(e) => {
                const v = e.target.value;
                setHex(v);
                if (/^#[0-9a-fA-F]{6}$/.test(v)) set({ themeColor: v });
              }}
            />
          </div>
        </div>
      </div>

      <div>
        <label className="mb-2 block font-pixel text-[10px] uppercase text-white/60">
          {t("schemeLabel")}
        </label>
        <div className="flex flex-wrap gap-2">
          {(["arcade", "terminal", "vitrine"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => set({ scheme: s })}
              className={`border-2 px-4 py-2 font-pixel text-[10px] uppercase ${
                scheme === s
                  ? "border-black bg-robin text-black shadow-pixel-sm"
                  : "border-black bg-panel text-white/60 hover:text-robin"
              }`}
            >
              {ts(s)}
            </button>
          ))}
        </div>
      </div>

      {/* Live mini preview rendered from the actual scheme components */}
      <div>
        <label className="mb-2 block font-pixel text-[10px] uppercase text-white/60">
          {t("previewLabel")}
        </label>
        <div className="h-72 overflow-hidden border-2 border-black bg-ink shadow-pixel">
          <div
            className="pointer-events-none origin-top-left"
            style={{ transform: "scale(0.28)", width: "357%" }}
          >
            <ThemedScheme
              launcher={previewLauncher}
              tokens={previewTokens}
              trades={[]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Step 4 ------------------------------ */

function Step4() {
  const t = useTranslations("create");
  const { features, feeBps, set } = useWizardStore();

  const items = [
    { key: "chat", label: t("featChat"), desc: t("featChatDesc") },
    { key: "kingOfTheHill", label: t("featKing"), desc: t("featKingDesc") },
    { key: "antiSniper", label: t("featAntiSniper"), desc: t("featAntiSniperDesc") },
    { key: "liveTicker", label: t("featTicker"), desc: t("featTickerDesc") },
    { key: "socialLinks", label: t("featSocial"), desc: t("featSocialDesc") },
  ] as const;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <label className="font-pixel text-[10px] uppercase text-white/60">
          {t("featuresLabel")}
        </label>
        {items.map((item) => {
          const on = features[item.key];
          return (
            <button
              key={item.key}
              type="button"
              onClick={() =>
                set({ features: { ...features, [item.key]: !on } })
              }
              className={`flex items-center gap-4 border-2 p-3 text-left ${
                on ? "border-robin bg-robin/5" : "border-black bg-ink"
              }`}
            >
              <span
                className={`flex h-6 w-11 shrink-0 items-center border-2 border-black p-0.5 ${
                  on ? "justify-end bg-robin" : "justify-start bg-panel"
                }`}
              >
                <span className="h-4 w-4 bg-black" />
              </span>
              <span>
                <span className={`font-pixel text-[10px] uppercase ${on ? "text-robin" : "text-white/70"}`}>
                  {item.label}
                </span>
                <span className="block font-body text-base text-white/40">
                  {item.desc}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div>
        <label className="mb-2 block font-pixel text-[10px] uppercase text-white/60">
          {t("feeLabel")}
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={feeBps}
          onChange={(e) => set({ feeBps: Number(e.target.value) })}
          className="w-full"
        />
        <p className="mt-2 font-body text-lg text-robin tabular">
          {t("feeHint", { bps: feeBps, pct: (feeBps / 100).toFixed(2) })}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------ Step 5 ------------------------------ */

function Step5({ onSuccess }: { onSuccess: () => void }) {
  const t = useTranslations("create");
  const tc = useTranslations("common");
  const ts = useTranslations("schemes");
  const wizard = useWizardStore();
  const { isConnected, address } = useAccount();
  const { allowance } = useHoodieAllowance(REGISTRY_ADDRESS);
  const { step, error, run } = useApproveAndCall();
  const { writeContractAsync } = useWriteContract();

  const featureLabels: Record<string, string> = {
    chat: t("featChat"),
    kingOfTheHill: t("featKing"),
    antiSniper: t("featAntiSniper"),
    liveTicker: t("featTicker"),
    socialLinks: t("featSocial"),
  };
  const enabled = Object.entries(wizard.features)
    .filter(([, v]) => v)
    .map(([k]) => featureLabels[k]);

  const create = () =>
    run({
      spender: REGISTRY_ADDRESS,
      amount: CREATION_FEE,
      allowance,
      call: async () => {
        // Pin logo + config through the API when available (best effort)
        void api.pin({
          name: wizard.slug,
          dataUrl: wizard.logoDataUrl ?? undefined,
          metadata: {
            name: wizard.name,
            themeColor: wizard.themeColor,
            scheme: wizard.scheme,
            mascotId: wizard.mascotId,
            features: wizard.features,
          },
        });
        return writeContractAsync({
          address: REGISTRY_ADDRESS,
          abi: launcherRegistryAbi,
          functionName: "createLauncher",
          args: [wizard.slug, address ?? ZERO_ADDRESS, wizard.feeBps],
        });
      },
      onDone: onSuccess,
    });

  const rows: [string, ReactNode][] = [
    [t("summaryName"), wizard.name],
    [t("summarySlug"), `hoodiepad.xyz/${wizard.slug}`],
    [t("summaryScheme"), ts(wizard.scheme)],
    [
      t("summaryTheme"),
      <span key="c" className="inline-flex items-center gap-2">
        <span
          className="inline-block h-4 w-4 border border-black"
          style={{ backgroundColor: wizard.themeColor }}
        />
        <span className="tabular">{wizard.themeColor}</span>
      </span>,
    ],
    [t("summaryFee"), `${wizard.feeBps} bps`],
    [t("summaryFeatures"), enabled.join(", ") || "—"],
    [t("creationFee"), t("creationFeeValue")],
  ];

  return (
    <div className="flex flex-col gap-6">
      <PixelPanel title={t("summaryTitle")}>
        <div className="divide-y divide-white/5 px-4 py-1 font-body text-xl">
          {rows.map(([k, v]) => (
            <div key={k as string} className="flex justify-between gap-4 py-2">
              <span className="text-white/50">{k}</span>
              <span className="text-right text-white">{v}</span>
            </div>
          ))}
        </div>
      </PixelPanel>

      <PixelPanel title={t("walletFlowTitle")} className="p-4">
        <ol className="flex flex-col gap-1 font-body text-lg text-white/60">
          <li className={step !== "idle" ? "text-mint" : ""}>{t("approveStep")}</li>
          <li className={step === "confirming" || step === "done" ? "text-mint" : ""}>
            {t("createStep")}
          </li>
        </ol>
        {DEMO_MODE && (
          <p className="mt-2 font-body text-base text-[#FF9E00]">{t("demoNote")}</p>
        )}
        {error && (
          <p className="mt-2 break-all font-body text-base text-danger">{error}</p>
        )}
        <div className="mt-4">
          {!isConnected && !DEMO_MODE ? (
            <p className="font-body text-lg text-danger">{t("connectFirst")}</p>
          ) : (
            <PixelButton
              onClick={create}
              disabled={step === "approving" || step === "confirming"}
            >
              {step === "approving"
                ? t("approveBtn") + "…"
                : step === "confirming"
                  ? tc("txPending")
                  : t("createBtn")}
            </PixelButton>
          )}
        </div>
      </PixelPanel>
    </div>
  );
}

/* ------------------------------ Success ------------------------------ */

function SuccessScreen() {
  const t = useTranslations("create");
  const wizard = useWizardStore();
  const { Component: Mascot } = getMascot(wizard.mascotId);
  return (
    <div className="flex flex-col items-center gap-6 py-16 text-center">
      <Confetti />
      <div className="animate-idle-bounce">
        <Mascot size={128} color={wizard.themeColor} still />
      </div>
      <h1
        className="font-pixel text-2xl"
        style={{ color: wizard.themeColor, textShadow: "4px 4px 0 #000" }}
      >
        {t("successTitle")}
      </h1>
      <p className="max-w-md font-body text-2xl text-white/70">{t("successBody")}</p>
      <PixelBadge tone="custom" color={wizard.themeColor}>
        hoodiepad.xyz/{wizard.slug}
      </PixelBadge>
      <Link href={`/${wizard.slug}`}>
        <PixelButton size="lg">{t("goToLauncher")} →</PixelButton>
      </Link>
    </div>
  );
}

/* ------------------------------- Page ------------------------------- */

export default function CreatePage() {
  const t = useTranslations("create");
  const tc = useTranslations("common");
  const { step, slug, name, set, reset } = useWizardStore();
  const [done, setDone] = useState(false);
  const { data: slugCheck } = useSlugAvailability(slug);

  useEffect(() => () => reset(), [reset]);

  if (done) return <SuccessScreen />;

  const canNext =
    step === 1
      ? name.trim().length > 0 && SLUG_RE.test(slug) && slugCheck?.taken === false
      : true;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 font-pixel text-xl text-white">{t("title")}</h1>
      <StepDots step={step} />
      <PixelPanel className="mt-6 p-6">
        {step === 1 && <Step1 />}
        {step === 2 && <Step2 />}
        {step === 3 && <Step3 />}
        {step === 4 && <Step4 />}
        {step === 5 && <Step5 onSuccess={() => setDone(true)} />}
      </PixelPanel>
      <div className="mt-6 flex justify-between">
        <PixelButton
          variant="secondary"
          onClick={() => set({ step: Math.max(1, step - 1) })}
          disabled={step === 1}
        >
          ← {tc("back")}
        </PixelButton>
        {step < 5 && (
          <PixelButton
            onClick={() => set({ step: Math.min(5, step + 1) })}
            disabled={!canNext}
          >
            {tc("next")} →
          </PixelButton>
        )}
      </div>
    </div>
  );
}
