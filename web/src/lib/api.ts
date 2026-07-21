import { API_URL } from "./config";
import {
  MOCK_LAUNCHERS,
  MOCK_STATS,
  MOCK_TOKENS,
  findMockLauncher,
  findMockToken,
  mockCandles,
  mockHolders,
  mockLauncherTrades,
  mockTrades,
} from "./mockData";
import type {
  Candle,
  Holder,
  Launcher,
  PlatformStats,
  Timeframe,
  TokenInfo,
  Trade,
} from "./types";

/**
 * Thin API client: tries the indexer at NEXT_PUBLIC_API_URL, falls back to
 * deterministic mock data so every page renders without a backend.
 */
async function tryFetch<T>(path: string, fallback: () => T): Promise<T> {
  if (!API_URL) return fallback();
  try {
    const res = await fetch(`${API_URL}${path}`, {
      headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    return (await res.json()) as T;
  } catch {
    return fallback();
  }
}

export const api = {
  stats: (): Promise<PlatformStats> => tryFetch("/api/stats", () => MOCK_STATS),

  launchers: (): Promise<Launcher[]> =>
    tryFetch("/api/launchers", () => MOCK_LAUNCHERS),

  launcher: (slug: string): Promise<Launcher | undefined> =>
    tryFetch(`/api/launchers/${slug}`, () => findMockLauncher(slug)),

  slugTaken: (slug: string): Promise<boolean> =>
    tryFetch(`/api/launchers/${slug}/exists`, () => !!findMockLauncher(slug)),

  tokens: (): Promise<TokenInfo[]> => tryFetch("/api/tokens", () => MOCK_TOKENS),

  launcherTokens: (slug: string): Promise<TokenInfo[]> =>
    tryFetch(`/api/launchers/${slug}/tokens`, () =>
      MOCK_TOKENS.filter((t) => t.launcherSlug === slug)
    ),

  token: (address: string): Promise<TokenInfo | undefined> =>
    tryFetch(`/api/tokens/${address}`, () => findMockToken(address)),

  candles: (address: string, timeframe: Timeframe): Promise<Candle[]> =>
    tryFetch(`/api/tokens/${address}/candles?tf=${timeframe}`, () =>
      mockCandles(address, timeframe)
    ),

  trades: (address: string): Promise<Trade[]> =>
    tryFetch(`/api/tokens/${address}/trades`, () => mockTrades(address)),

  launcherTrades: (slug: string): Promise<Trade[]> =>
    tryFetch(`/api/launchers/${slug}/trades`, () => mockLauncherTrades(slug)),

  holders: (address: string): Promise<Holder[]> =>
    tryFetch(`/api/tokens/${address}/holders`, () => mockHolders(address)),

  /** Pin content (logo/metadata) to IPFS via the indexer. Null if unavailable. */
  pin: async (payload: {
    name: string;
    dataUrl?: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ uri: string } | null> => {
    if (!API_URL) return null;
    try {
      const res = await fetch(`${API_URL}/api/pin`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) return null;
      return (await res.json()) as { uri: string };
    } catch {
      return null;
    }
  },

  /** Owner config update through the indexer (theme, features...). */
  updateLauncherConfig: async (
    slug: string,
    config: Partial<Launcher>
  ): Promise<boolean> => {
    if (!API_URL) return false;
    try {
      const res = await fetch(`${API_URL}/api/launchers/${slug}/config`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(config),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  exportGithub: async (slug: string): Promise<boolean> => {
    if (!API_URL) return false;
    try {
      const res = await fetch(`${API_URL}/api/export/github`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  exportZipUrl: (slug: string): string | null =>
    API_URL ? `${API_URL}/api/export/zip?slug=${slug}` : null,
};
