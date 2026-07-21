"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { parseUnits } from "viem";
import { useAccount, useWriteContract } from "wagmi";
import { api } from "@/lib/api";
import { tokenFactoryAbi } from "@/lib/abi";
import { FACTORY_ADDRESS } from "@/lib/config";
import { initialCurveState, quoteBuy, applySlippage } from "@/lib/curve";
import { fmtWei, parseAmount } from "@/lib/format";
import { DEMO_MODE, useApproveAndCall, useHoodieAllowance, useHoodieBalance } from "@/hooks/useHoodie";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelPanel } from "@/components/ui/PixelPanel";
import { PixelInput, PixelTextarea } from "@/components/ui/PixelInput";
import { Confetti } from "@/components/ui/Confetti";
import { PixelateUpload } from "@/components/PixelateUpload";
import { getMascot } from "@/components/mascots";

const TOKEN_FEE = parseUnits("500", 18);
const SYMBOL_RE = /^[A-Z0-9]{1,8}$/;

export default function CreateTokenPage({
  params,
}: {
  params: { slug: string };
}) {
  const t = useTranslations("createToken");
  const tc = useTranslations("common");
  const tt = useTranslations("token");
  const { slug } = params;

  const { data: launcher } = useQuery({
    queryKey: ["launcher", slug],
    queryFn: () => api.launcher(slug),
  });

  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [desc, setDesc] = useState("");
  const [logo, setLogo] = useState<string | null>(null);
  const [x, setX] = useState("");
  const [tg, setTg] = useState("");
  const [web, setWeb] = useState("");
  const [devBuy, setDevBuy] = useState("");
  const [done, setDone] = useState(false);

  const { isConnected } = useAccount();
  const balance = useHoodieBalance();
  const { allowance } = useHoodieAllowance(FACTORY_ADDRESS);
  const { step, error, run } = useApproveAndCall();
  const { writeContractAsync } = useWriteContract();

  const devBuyWei = parseAmount(devBuy);
  const estTokens = useMemo(
    () => (devBuyWei > 0n ? quoteBuy(initialCurveState(), devBuyWei) : 0n),
    [devBuyWei]
  );
  const total = TOKEN_FEE + devBuyWei;
  const symbolOk = SYMBOL_RE.test(symbol);
  const formOk = name.trim().length > 0 && symbolOk;

  const themeColor = launcher?.themeColor ?? "#CCFF00";

  const create = () =>
    run({
      spender: FACTORY_ADDRESS,
      amount: total,
      allowance,
      call: async () => {
        const pinned = await api.pin({
          name: symbol,
          dataUrl: logo ?? undefined,
          metadata: { name, description: desc, social: { x, telegram: tg, website: web } },
        });
        return writeContractAsync({
          address: FACTORY_ADDRESS,
          abi: tokenFactoryAbi,
          functionName: "createToken",
          args: [
            BigInt(launcher?.id ?? 0),
            name,
            symbol,
            pinned?.uri ?? "",
            devBuyWei,
            applySlippage(estTokens, 300),
          ],
        });
      },
      onDone: () => setDone(true),
    });

  if (done) {
    const { Component: Mascot } = getMascot(launcher?.mascotId ?? "pixel-frog");
    return (
      <div className="flex flex-col items-center gap-6 py-16 text-center">
        <Confetti />
        <div className="animate-idle-bounce">
          <Mascot size={112} color={themeColor} still />
        </div>
        <h1
          className="font-pixel text-2xl"
          style={{ color: themeColor, textShadow: "4px 4px 0 #000" }}
        >
          {t("successTitle")}
        </h1>
        <p className="max-w-md font-body text-2xl text-white/70">
          {t("successBody")}
        </p>
        <Link href={`/${slug}`}>
          <PixelButton size="lg">{t("goToToken")} →</PixelButton>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-pixel text-xl" style={{ color: themeColor }}>
        {t("title")}
      </h1>
      <p className="mt-1 font-body text-xl text-white/50">
        {launcher ? `${launcher.name} · /${slug}` : `/${slug}`}
      </p>

      <PixelPanel className="mt-6 flex flex-col gap-5 p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1 block font-pixel text-[10px] uppercase text-white/60">
              {t("nameLabel")}
            </label>
            <PixelInput
              value={name}
              placeholder={t("namePlaceholder")}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block font-pixel text-[10px] uppercase text-white/60">
              {t("symbolLabel")}
            </label>
            <PixelInput
              value={symbol}
              placeholder={t("symbolPlaceholder")}
              error={symbol.length > 0 && !symbolOk}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            />
            {symbol.length > 0 && !symbolOk && (
              <p className="mt-1 font-body text-base text-danger">
                {t("invalidSymbol")}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1 block font-pixel text-[10px] uppercase text-white/60">
            {t("descLabel")}
          </label>
          <PixelTextarea
            rows={3}
            value={desc}
            placeholder={t("descPlaceholder")}
            onChange={(e) => setDesc(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-2 block font-pixel text-[10px] uppercase text-white/60">
            {t("logoLabel")}
          </label>
          <PixelateUpload value={logo} onChange={setLogo} />
        </div>

        <div>
          <label className="mb-2 block font-pixel text-[10px] uppercase text-white/60">
            {t("socialLabel")}
          </label>
          <div className="flex flex-col gap-2">
            <PixelInput value={x} placeholder={t("xPlaceholder")} onChange={(e) => setX(e.target.value)} />
            <PixelInput value={tg} placeholder={t("tgPlaceholder")} onChange={(e) => setTg(e.target.value)} />
            <PixelInput value={web} placeholder={t("webPlaceholder")} onChange={(e) => setWeb(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="mb-1 block font-pixel text-[10px] uppercase text-white/60">
            {t("devBuyLabel")}
          </label>
          <PixelInput
            value={devBuy}
            placeholder="0 HOODIE"
            inputMode="decimal"
            onChange={(e) => setDevBuy(e.target.value)}
          />
          <p className="mt-1 font-body text-base text-white/40">{t("devBuyHint")}</p>
          {estTokens > 0n && (
            <p className="mt-1 font-body text-lg text-mint tabular">
              {t("estTokens", { amount: fmtWei(estTokens) })} ${symbol || "TOKEN"}
            </p>
          )}
        </div>

        <div className="border-t-2 border-black pt-4">
          <p className="font-body text-lg text-white/60 tabular">
            {t("creationFee")} · {tt("balance")}: {fmtWei(balance)} HOODIE
          </p>
          {error && (
            <p className="mt-2 break-all font-body text-base text-danger">{error}</p>
          )}
          <div className="mt-3">
            <PixelButton
              onClick={create}
              disabled={
                !formOk ||
                step === "approving" ||
                step === "confirming" ||
                (!isConnected && !DEMO_MODE)
              }
            >
              {step === "approving"
                ? t("approveBtn") + "…"
                : step === "confirming"
                  ? tc("txPending")
                  : t("createBtn")}
            </PixelButton>
          </div>
        </div>
      </PixelPanel>
    </div>
  );
}
