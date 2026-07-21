import { apiUrl, config } from "./config";

/** Shapes returned by the shared HOODIEPAD indexer API (bigints as strings). */

export interface ApiToken {
  address: `0x${string}`;
  launcherId: string;
  creator: `0x${string}`;
  name: string;
  symbol: string;
  metadataURI: string;
  createdAt: string;
  graduated: boolean;
  pair: `0x${string}` | null;
  lastPriceHoodie: string;
  realHoodieReserve: string;
  volumeHoodie: string;
  tradeCount: number;
  holderCount: number;
}

export interface ApiLauncher {
  id: string;
  slug: string;
  owner: `0x${string}`;
  feeRecipient: `0x${string}`;
  feeBps: number;
  createdAt: string;
  tokenCount: number;
  volumeHoodie: string;
  tokens: ApiToken[];
}

export interface ApiTrade {
  id: string;
  token: `0x${string}`;
  trader: `0x${string}`;
  isBuy: boolean;
  hoodieAmount: string;
  tokenAmount: string;
  fee: string;
  price: string;
  timestamp: string;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${apiUrl}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API ${path} -> ${res.status}`);
  return (await res.json()) as T;
}

export const fetchLauncher = () =>
  get<ApiLauncher>(`/api/launchers/${config.slug}`);

export const fetchToken = (address: string) =>
  get<ApiToken>(`/api/tokens/${address}`);

export const fetchTrades = (address: string, limit = 25) =>
  get<ApiTrade[]>(`/api/tokens/${address}/trades?limit=${limit}`);

/** Format a 1e18-scaled bigint string for display. */
export function formatWad(value: string | bigint, decimals = 4): string {
  const wad = typeof value === "bigint" ? value : BigInt(value || "0");
  const negative = wad < 0n;
  const abs = negative ? -wad : wad;
  const whole = abs / 10n ** 18n;
  const frac = abs % 10n ** 18n;
  const fracStr = frac.toString().padStart(18, "0").slice(0, decimals);
  const trimmed = fracStr.replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole.toLocaleString()}${trimmed ? `.${trimmed}` : ""}`;
}

export function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
