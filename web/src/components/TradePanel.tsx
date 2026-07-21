"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import type { Address } from "viem";
import { bondingCurveAbi, erc20Abi } from "@/lib/abi";
import { CURVE_ADDRESS, HOODIE_ADDRESS } from "@/lib/config";
import {
  applySlippage,
  buyPriceImpactBps,
  quoteBuy,
  quoteSell,
  sellPriceImpactBps,
  type CurveState,
} from "@/lib/curve";
import { fmtWei, parseAmount } from "@/lib/format";
import { useTradeSettings, useToastStore } from "@/lib/store";
import type { TokenInfo } from "@/lib/types";
import { DEMO_MODE, useHoodieAllowance, useHoodieBalance } from "@/hooks/useHoodie";
import { PixelButton } from "./ui/PixelButton";
import { PixelPanel } from "./ui/PixelPanel";
import { PixelInput } from "./ui/PixelInput";

const QUICK_BUYS = ["100", "1000", "10000", "100000"];
const QUICK_SELL_PCTS = [25, 50, 75, 100];
const SLIPPAGE_PRESETS = [50, 100, 200];

export function TradePanel({
  token,
  themeColor = "#CCFF00",
}: {
  token: TokenInfo;
  themeColor?: string;
}) {
  const t = useTranslations("token");
  const tc = useTranslations("common");
  const pushToast = useToastStore((s) => s.push);
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const { slippageBps, setSlippageBps } = useTradeSettings();

  const { isConnected } = useAccount();
  const hoodieBalance = useHoodieBalance();
  const { allowance: hoodieAllowance } = useHoodieAllowance(CURVE_ADDRESS);
  const { writeContractAsync } = useWriteContract();

  const { address: account } = useAccount();
  const { data: tokenBalanceData } = useReadContract({
    address: token.address as Address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: account ? [account] : undefined,
    query: { enabled: !!account && !DEMO_MODE },
  });
  const tokenBalance = (tokenBalanceData as bigint | undefined) ?? 0n;

  const curveState: CurveState = useMemo(
    () => ({
      realHoodieReserve: BigInt(token.realHoodieReserve),
      realTokenReserve: 0n,
      virtualHoodieReserve: BigInt(token.virtualHoodieReserve),
      virtualTokenReserve: BigInt(token.virtualTokenReserve),
      graduated: token.graduated,
      graduationThreshold: 85_000_000n * 10n ** 18n,
      progressBps: BigInt(token.progressBps),
    }),
    [token]
  );

  const amountWei = parseAmount(amount);
  const quoted = useMemo(() => {
    if (amountWei <= 0n) return 0n;
    return side === "buy"
      ? quoteBuy(curveState, amountWei)
      : quoteSell(curveState, amountWei);
  }, [amountWei, side, curveState]);

  const impactBps =
    amountWei > 0n
      ? side === "buy"
        ? buyPriceImpactBps(curveState, amountWei)
        : sellPriceImpactBps(curveState, amountWei)
      : 0;

  const minOut = applySlippage(quoted, slippageBps);

  const doTrade = async () => {
    if (amountWei <= 0n) return;
    setBusy(true);
    try {
      if (DEMO_MODE) {
        await new Promise((r) => setTimeout(r, 1200));
        pushToast(tc("txConfirmed"), "success");
        setAmount("");
        return;
      }
      if (side === "buy") {
        if (hoodieAllowance < amountWei) {
          await writeContractAsync({
            address: HOODIE_ADDRESS,
            abi: erc20Abi,
            functionName: "approve",
            args: [CURVE_ADDRESS, amountWei],
          });
        }
        await writeContractAsync({
          address: CURVE_ADDRESS,
          abi: bondingCurveAbi,
          functionName: "buy",
          args: [token.address as Address, amountWei, minOut],
        });
      } else {
        await writeContractAsync({
          address: token.address as Address,
          abi: erc20Abi,
          functionName: "approve",
          args: [CURVE_ADDRESS, amountWei],
        });
        await writeContractAsync({
          address: CURVE_ADDRESS,
          abi: bondingCurveAbi,
          functionName: "sell",
          args: [token.address as Address, amountWei, minOut],
        });
      }
      pushToast(tc("txConfirmed"), "success");
      setAmount("");
    } catch (e) {
      pushToast(tc("txFailed"), "error");
    } finally {
      setBusy(false);
    }
  };

  const balance = side === "buy" ? hoodieBalance : tokenBalance;
  const insufficient =
    !DEMO_MODE && isConnected && amountWei > balance && balance >= 0n;

  return (
    <PixelPanel className="p-4">
      {/* Buy / Sell tabs */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setSide("buy")}
          className={`border-2 border-black py-2 font-pixel text-xs uppercase ${
            side === "buy" ? "bg-mint text-black shadow-pixel-sm" : "bg-ink text-white/50"
          }`}
        >
          {t("buyTab")}
        </button>
        <button
          onClick={() => setSide("sell")}
          className={`border-2 border-black py-2 font-pixel text-xs uppercase ${
            side === "sell" ? "bg-danger text-black shadow-pixel-sm" : "bg-ink text-white/50"
          }`}
        >
          {t("sellTab")}
        </button>
      </div>

      {/* Amount */}
      <div className="mt-4">
        <div className="mb-1 flex justify-between font-body text-base text-white/50 tabular">
          <span>{t("youPay")}</span>
          <span>
            {t("balance")}: {fmtWei(balance)}{" "}
            {side === "buy" ? "HOODIE" : `$${token.symbol}`}
          </span>
        </div>
        <PixelInput
          value={amount}
          inputMode="decimal"
          placeholder={side === "buy" ? "0 HOODIE" : `0 ${token.symbol}`}
          onChange={(e) => setAmount(e.target.value)}
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {side === "buy"
            ? QUICK_BUYS.map((q) => (
                <button
                  key={q}
                  onClick={() => setAmount(q)}
                  className="border-2 border-black bg-ink px-2 py-1 font-body text-base text-white/60 hover:border-robin hover:text-robin tabular"
                >
                  {Number(q) >= 1000 ? `${Number(q) / 1000}K` : q}
                </button>
              ))
            : QUICK_SELL_PCTS.map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    const v = (tokenBalance * BigInt(p)) / 100n;
                    setAmount((Number(v / 10n ** 14n) / 10_000).toString());
                  }}
                  className="border-2 border-black bg-ink px-2 py-1 font-body text-base text-white/60 hover:border-robin hover:text-robin tabular"
                >
                  {p}%
                </button>
              ))}
        </div>
      </div>

      {/* Quote */}
      <div className="mt-4 border-2 border-black bg-ink p-3 font-body text-lg tabular">
        <div className="flex justify-between">
          <span className="text-white/50">{t("youReceive")}</span>
          <span className="text-white">
            {fmtWei(quoted)} {side === "buy" ? `$${token.symbol}` : "HOODIE"}
          </span>
        </div>
        <div className="mt-1 flex justify-between">
          <span className="text-white/50">{t("priceImpact")}</span>
          <span className={impactBps > 500 ? "text-danger" : "text-white/80"}>
            {(impactBps / 100).toFixed(2)}%
          </span>
        </div>
      </div>
      {impactBps > 500 && (
        <p className="mt-2 border-2 border-danger bg-danger/10 p-2 font-body text-base text-danger">
          ⚠ {t("impactWarning")}
        </p>
      )}
      {insufficient && (
        <p className="mt-2 font-body text-base text-danger">
          {tc("insufficientBalance")}
        </p>
      )}

      {/* Slippage */}
      <div className="mt-4 flex items-center gap-2 font-body text-base">
        <span className="text-white/50">{t("slippage")}</span>
        {SLIPPAGE_PRESETS.map((s) => (
          <button
            key={s}
            onClick={() => setSlippageBps(s)}
            className={`border-2 border-black px-2 py-0.5 tabular ${
              slippageBps === s ? "bg-robin text-black" : "bg-ink text-white/60"
            }`}
          >
            {(s / 100).toFixed(1)}%
          </button>
        ))}
      </div>

      {/* Action */}
      <div className="mt-4">
        <PixelButton
          className="w-full"
          variant={side === "buy" ? "mint" : "danger"}
          disabled={
            busy ||
            amountWei <= 0n ||
            token.graduated ||
            insufficient ||
            (!isConnected && !DEMO_MODE)
          }
          onClick={doTrade}
        >
          {busy
            ? tc("txPending")
            : side === "buy"
              ? t("buyBtn")
              : `${t("sellBtn")} $${token.symbol}`}
        </PixelButton>
      </div>
    </PixelPanel>
  );
}
