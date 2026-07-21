"use client";

import { useState } from "react";
import { parseUnits } from "viem";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { bondingCurveAbi, erc20Abi } from "@/lib/abis";
import { formatWad } from "@/lib/api";
import { config } from "@/lib/config";

const SLIPPAGE_BPS = 100n; // 1%

function parseAmount(value: string): bigint {
  try {
    return value.trim() === "" ? 0n : parseUnits(value.trim(), 18);
  } catch {
    return 0n;
  }
}

export function TradePanel({
  token,
  symbol,
}: {
  token: `0x${string}`;
  symbol: string;
}) {
  const { address: account } = useAccount();
  const [mode, setMode] = useState<"buy" | "sell">("buy");
  const [input, setInput] = useState("");

  const amountIn = parseAmount(input);
  const isBuy = mode === "buy";
  const curve = config.contracts.curve;
  // Buys spend $HOODIE, sells spend the launched token.
  const spendToken = isBuy ? config.contracts.hoodie : token;

  const { data: quote } = useReadContract({
    address: curve,
    abi: bondingCurveAbi,
    functionName: isBuy ? "quoteBuy" : "quoteSell",
    args: [token, amountIn],
    query: { enabled: amountIn > 0n },
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: spendToken,
    abi: erc20Abi,
    functionName: "allowance",
    args: account ? [account, curve] : undefined,
    query: { enabled: !!account },
  });

  const { data: balance } = useReadContract({
    address: spendToken,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: account ? [account] : undefined,
    query: { enabled: !!account },
  });

  const { writeContract, data: txHash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: !!txHash },
  });

  const needsApproval =
    amountIn > 0n && allowance !== undefined && allowance < amountIn;
  const minOut =
    quote !== undefined ? (quote * (10_000n - SLIPPAGE_BPS)) / 10_000n : 0n;

  const approve = () =>
    writeContract(
      {
        address: spendToken,
        abi: erc20Abi,
        functionName: "approve",
        args: [curve, amountIn],
      },
      { onSuccess: () => setTimeout(() => refetchAllowance(), 4_000) },
    );

  const trade = () =>
    writeContract({
      address: curve,
      abi: bondingCurveAbi,
      functionName: isBuy ? "buy" : "sell",
      args: [token, amountIn, minOut],
    });

  const busy = isPending || isConfirming;
  const spendSymbol = isBuy ? "$HOODIE" : symbol;
  const receiveSymbol = isBuy ? symbol : "$HOODIE";

  return (
    <div className="pixel-panel p-4">
      <div className="mb-4 grid grid-cols-2 gap-2">
        <button
          className={mode === "buy" ? "pixel-btn" : "pixel-btn-ghost"}
          onClick={() => setMode("buy")}
        >
          BUY
        </button>
        <button
          className={mode === "sell" ? "pixel-btn" : "pixel-btn-ghost"}
          onClick={() => setMode("sell")}
        >
          SELL
        </button>
      </div>

      <label className="font-vt text-lg text-white/60">
        SPEND ({spendSymbol})
        <input
          className="pixel-input mt-1"
          placeholder="0.0"
          inputMode="decimal"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </label>

      <div className="mt-3 space-y-1 font-vt text-lg text-white/60">
        {balance !== undefined && (
          <div>
            BALANCE: <span className="text-white">{formatWad(balance)}</span>{" "}
            {spendSymbol}
          </div>
        )}
        <div>
          RECEIVE (est):{" "}
          <span className="text-white">
            {quote !== undefined ? formatWad(quote) : "—"}
          </span>{" "}
          {receiveSymbol}
        </div>
        <div className="text-white/40">MIN AFTER 1% SLIPPAGE: {formatWad(minOut)}</div>
      </div>

      <div className="mt-4">
        {!account ? (
          <div className="font-vt text-xl text-white/50">
            CONNECT A WALLET TO TRADE
          </div>
        ) : needsApproval ? (
          <button className="pixel-btn w-full" disabled={busy} onClick={approve}>
            {busy ? "CONFIRMING…" : `APPROVE ${spendSymbol}`}
          </button>
        ) : (
          <button
            className="pixel-btn w-full"
            disabled={busy || amountIn === 0n}
            onClick={trade}
          >
            {busy ? "CONFIRMING…" : isBuy ? `BUY ${symbol}` : `SELL ${symbol}`}
          </button>
        )}
      </div>

      {isSuccess && (
        <div className="mt-3 font-vt text-lg" style={{ color: config.themeColor }}>
          TX CONFIRMED ✔
        </div>
      )}
      {error && (
        <div className="mt-3 break-all font-vt text-lg text-red-400">
          {error.message.split("\n")[0]}
        </div>
      )}
    </div>
  );
}
