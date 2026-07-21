import { formatUnits, parseUnits } from "viem";

/** Compact number: 1234567 -> "1.23M" */
export function compact(n: number, digits = 2): string {
  if (!isFinite(n)) return "-";
  const abs = Math.abs(n);
  if (abs >= 1e9) return (n / 1e9).toFixed(digits) + "B";
  if (abs >= 1e6) return (n / 1e6).toFixed(digits) + "M";
  if (abs >= 1e3) return (n / 1e3).toFixed(digits) + "K";
  if (abs >= 1) return n.toFixed(digits);
  if (abs === 0) return "0";
  return n.toPrecision(3);
}

/** Format a bigint amount of 18-dec tokens compactly. */
export function fmtWei(v: bigint, digits = 2): string {
  return compact(Number(formatUnits(v, 18)), digits);
}

/** Format a bigint amount with full-ish precision for inputs. */
export function fmtWeiExact(v: bigint, maxFrac = 4): string {
  const n = Number(formatUnits(v, 18));
  return n.toLocaleString("en-US", { maximumFractionDigits: maxFrac });
}

/** Parse a user-typed decimal string to wei; returns 0n on garbage. */
export function parseAmount(s: string): bigint {
  const clean = s.replace(",", ".").trim();
  if (!clean || !/^\d*\.?\d*$/.test(clean)) return 0n;
  try {
    return parseUnits(clean === "." ? "0" : clean, 18);
  } catch {
    return 0n;
  }
}

/** Shorten an address: 0x1234...abcd */
export function shortAddr(a: string): string {
  return a.length > 12 ? `${a.slice(0, 6)}...${a.slice(-4)}` : a;
}

/** Price with adaptive precision. */
export function fmtPrice(p: number): string {
  if (!isFinite(p) || p === 0) return "0";
  if (p >= 1) return p.toFixed(4);
  if (p >= 0.001) return p.toFixed(6);
  return p.toExponential(2);
}

/** Relative "time ago" label parts; localized by caller. */
export function timeAgo(ts: number, now = Date.now()): { v: number; unit: "s" | "m" | "h" | "d" } {
  const diff = Math.max(1, Math.floor((now - ts) / 1000));
  if (diff < 60) return { v: diff, unit: "s" };
  if (diff < 3600) return { v: Math.floor(diff / 60), unit: "m" };
  if (diff < 86400) return { v: Math.floor(diff / 3600), unit: "h" };
  return { v: Math.floor(diff / 86400), unit: "d" };
}
