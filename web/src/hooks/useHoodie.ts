"use client";

import { useCallback, useState } from "react";
import type { Address } from "viem";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { erc20Abi } from "@/lib/abi";
import { HOODIE_ADDRESS, REGISTRY_ADDRESS, ZERO_ADDRESS } from "@/lib/config";

/** True when no registry address is configured — wallet flows simulate success. */
export const DEMO_MODE = REGISTRY_ADDRESS === ZERO_ADDRESS;

export function useHoodieBalance() {
  const { address } = useAccount();
  const { data } = useReadContract({
    address: HOODIE_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 15_000 },
  });
  return (data as bigint | undefined) ?? 0n;
}

export function useHoodieAllowance(spender: Address) {
  const { address } = useAccount();
  const { data, refetch } = useReadContract({
    address: HOODIE_ADDRESS,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, spender] : undefined,
    query: { enabled: !!address && spender !== ZERO_ADDRESS },
  });
  return { allowance: (data as bigint | undefined) ?? 0n, refetch };
}

export type FlowStep = "idle" | "approving" | "confirming" | "done" | "error";

/**
 * Two-step approve + action flow with demo-mode simulation.
 * In demo mode (no contracts configured) each step resolves after a short delay.
 */
export function useApproveAndCall() {
  const [step, setStep] = useState<FlowStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const { writeContractAsync } = useWriteContract();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  useWaitForTransactionReceipt({ hash: txHash, query: { enabled: !!txHash } });

  const run = useCallback(
    async (opts: {
      spender: Address;
      amount: bigint;
      allowance: bigint;
      call: () => Promise<`0x${string}`>;
      onDone?: () => void;
    }) => {
      setError(null);
      try {
        if (DEMO_MODE) {
          setStep("approving");
          await new Promise((r) => setTimeout(r, 900));
          setStep("confirming");
          await new Promise((r) => setTimeout(r, 1200));
          setStep("done");
          opts.onDone?.();
          return;
        }
        if (opts.allowance < opts.amount) {
          setStep("approving");
          const hash = await writeContractAsync({
            address: HOODIE_ADDRESS,
            abi: erc20Abi,
            functionName: "approve",
            args: [opts.spender, opts.amount],
          });
          setTxHash(hash);
        }
        setStep("confirming");
        const actionHash = await opts.call();
        setTxHash(actionHash);
        setStep("done");
        opts.onDone?.();
      } catch (e) {
        setStep("error");
        setError(e instanceof Error ? e.message : String(e));
      }
    },
    [writeContractAsync]
  );

  const reset = useCallback(() => {
    setStep("idle");
    setError(null);
  }, []);

  return { step, error, run, reset };
}
