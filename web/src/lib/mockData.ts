import type {
  Candle,
  Holder,
  Launcher,
  PlatformStats,
  TokenInfo,
  Trade,
  Timeframe,
} from "./types";
import { GRADUATION_THRESHOLD, VIRTUAL_HOODIE_0, VIRTUAL_TOKEN_0 } from "./curve";

/* ------------------------------------------------------------------ */
/* Deterministic PRNG so every render shows the same demo universe.    */
/* ------------------------------------------------------------------ */

function seedFrom(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function mockAddress(seed: string): string {
  const rnd = mulberry32(seedFrom(seed));
  let s = "0x";
  for (let i = 0; i < 40; i++) s += Math.floor(rnd() * 16).toString(16);
  return s;
}

/** Anchor "now" to the start of the current hour so data is stable-ish. */
const NOW = Math.floor(Date.now() / 3_600_000) * 3_600_000;

/* ------------------------------------------------------------------ */
/* Demo launchers                                                      */
/* ------------------------------------------------------------------ */

export const MOCK_LAUNCHERS: Launcher[] = [
  {
    id: 1,
    slug: "hoodie-arcade",
    name: "Hoodie Arcade",
    description: "The original 8-bit meme token arcade. Insert HOODIE to play.",
    owner: mockAddress("owner-hoodie-arcade"),
    feeRecipient: mockAddress("owner-hoodie-arcade"),
    launcherFeeBps: 50,
    themeColor: "#CCFF00",
    scheme: "arcade",
    mascotId: "hoodie-cat",
    features: {
      chat: true,
      kingOfTheHill: true,
      antiSniper: true,
      liveTicker: true,
      socialLinks: true,
    },
    social: { x: "https://x.com/hoodiepad", telegram: "https://t.me/hoodiepad" },
    createdAt: NOW - 86_400_000 * 21,
    tokenCount: 6,
    volume24h: 4_215_000,
    volumeTotal: 96_400_000,
  },
  {
    id: 2,
    slug: "neon-terminal",
    name: "NEON TERMINAL",
    description: "> degen trading terminal. green text, green candles.",
    owner: mockAddress("owner-neon-terminal"),
    feeRecipient: mockAddress("owner-neon-terminal"),
    launcherFeeBps: 30,
    themeColor: "#00FFB2",
    scheme: "terminal",
    mascotId: "robot-chef",
    features: {
      chat: false,
      kingOfTheHill: false,
      antiSniper: true,
      liveTicker: true,
      socialLinks: true,
    },
    social: { x: "https://x.com/hoodiepad", website: "https://hoodiepad.xyz" },
    createdAt: NOW - 86_400_000 * 12,
    tokenCount: 4,
    volume24h: 2_730_000,
    volumeTotal: 41_800_000,
  },
  {
    id: 3,
    slug: "meme-vitrin",
    name: "Meme Vitrin",
    description: "En taze memeler vitrinde. Sadece elit memeler kabul edilir.",
    owner: mockAddress("owner-meme-vitrin"),
    feeRecipient: mockAddress("owner-meme-vitrin"),
    launcherFeeBps: 100,
    themeColor: "#C77DFF",
    scheme: "vitrine",
    mascotId: "neon-ghost",
    features: {
      chat: true,
      kingOfTheHill: false,
      antiSniper: false,
      liveTicker: false,
      socialLinks: true,
    },
    social: { telegram: "https://t.me/hoodiepad" },
    createdAt: NOW - 86_400_000 * 5,
    tokenCount: 3,
    volume24h: 890_000,
    volumeTotal: 6_120_000,
  },
];

/* ------------------------------------------------------------------ */
/* Demo tokens                                                         */
/* ------------------------------------------------------------------ */

interface TokenSeed {
  name: string;
  symbol: string;
  slug: string;
  mascotId: string;
  desc: string;
  progress: number; // 0..1 of graduation threshold (>=1 => graduated)
  ageDays: number;
}

const TOKEN_SEEDS: TokenSeed[] = [
  { name: "Hoodie Cat", symbol: "HCAT", slug: "hoodie-arcade", mascotId: "hoodie-cat", desc: "The cat that started it all. Meow in a hoodie.", progress: 1.0, ageDays: 18 },
  { name: "Pixel Frog", symbol: "PFROG", slug: "hoodie-arcade", mascotId: "pixel-frog", desc: "Ribbit. 16x16 amphibian energy.", progress: 0.87, ageDays: 9 },
  { name: "Astro Dog", symbol: "ADOG", slug: "hoodie-arcade", mascotId: "astro-dog", desc: "First dog on the blockchain moon.", progress: 0.62, ageDays: 6 },
  { name: "Pixel Bull", symbol: "PBULL", slug: "hoodie-arcade", mascotId: "pixel-bull", desc: "Only knows one direction.", progress: 0.34, ageDays: 4 },
  { name: "Ninja Hamster", symbol: "NHAM", slug: "hoodie-arcade", mascotId: "ninja-hamster", desc: "Silent. Deadly. Fluffy.", progress: 0.12, ageDays: 2 },
  { name: "Hoodie Skeleton", symbol: "BONES", slug: "hoodie-arcade", mascotId: "hoodie-skeleton", desc: "Dead coin walking. Literally.", progress: 0.05, ageDays: 1 },
  { name: "Robot Chef", symbol: "RCHEF", slug: "neon-terminal", mascotId: "robot-chef", desc: "Cooking green candles 24/7.", progress: 0.93, ageDays: 10 },
  { name: "Neon Owl", symbol: "NOWL", slug: "neon-terminal", mascotId: "neon-owl", desc: "Watches the charts so you can sleep.", progress: 0.55, ageDays: 7 },
  { name: "Arcade Alien", symbol: "ALIEN", slug: "neon-terminal", mascotId: "arcade-alien", desc: "Invaded from cabinet #7.", progress: 0.28, ageDays: 3 },
  { name: "Pixel Dragon", symbol: "PDRGN", slug: "neon-terminal", mascotId: "pixel-dragon", desc: "Breathes 8-bit fire.", progress: 0.09, ageDays: 1 },
  { name: "Neon Ghost", symbol: "GHOST", slug: "meme-vitrin", mascotId: "neon-ghost", desc: "Boo. Haunting the orderbook.", progress: 0.71, ageDays: 4 },
  { name: "Hoodie Penguin", symbol: "PENG", slug: "meme-vitrin", mascotId: "hoodie-penguin", desc: "Ice cold hands. Never sells.", progress: 0.41, ageDays: 3 },
  { name: "Astro Doge Jr", symbol: "ADJR", slug: "meme-vitrin", mascotId: "astro-dog", desc: "The son of the moon dog.", progress: 0.03, ageDays: 0.5 },
];

function buildToken(seed: TokenSeed, i: number): TokenInfo {
  const launcher = MOCK_LAUNCHERS.find((l) => l.slug === seed.slug)!;
  const graduated = seed.progress >= 1;
  const real = BigInt(Math.floor(Math.min(seed.progress, 1) * 85_000_000)) * 10n ** 18n;
  const vH = VIRTUAL_HOODIE_0 + real;
  const vT = (VIRTUAL_HOODIE_0 * VIRTUAL_TOKEN_0) / vH;
  const price = Number(vH / 10n ** 12n) / Number(vT / 10n ** 12n);
  const rnd = mulberry32(seedFrom(seed.symbol));
  return {
    address: mockAddress("token-" + seed.symbol),
    launcherSlug: seed.slug,
    launcherId: launcher.id,
    name: seed.name,
    symbol: seed.symbol,
    description: seed.desc,
    mascotId: seed.mascotId,
    creator: mockAddress("creator-" + seed.symbol),
    createdAt: NOW - seed.ageDays * 86_400_000,
    social: { x: "https://x.com/hoodiepad" },
    realHoodieReserve: real.toString(),
    virtualHoodieReserve: vH.toString(),
    virtualTokenReserve: vT.toString(),
    graduated,
    pairAddress: graduated ? mockAddress("pair-" + seed.symbol) : undefined,
    progressBps: Math.min(10_000, Math.round(seed.progress * 10_000)),
    priceHoodie: price,
    marketCapHoodie: price * 1_000_000_000,
    volume24h: Math.round(50_000 + rnd() * 2_000_000),
    holders: Math.round(20 + rnd() * 900),
  };
}

export const MOCK_TOKENS: TokenInfo[] = TOKEN_SEEDS.map(buildToken);

/* ------------------------------------------------------------------ */
/* Trades, candles, holders                                            */
/* ------------------------------------------------------------------ */

export function mockTrades(tokenAddress: string, count = 30): Trade[] {
  const token =
    MOCK_TOKENS.find((t) => t.address.toLowerCase() === tokenAddress.toLowerCase()) ??
    MOCK_TOKENS[0];
  const rnd = mulberry32(seedFrom("trades-" + token.symbol));
  const trades: Trade[] = [];
  let ts = NOW;
  for (let i = 0; i < count; i++) {
    ts -= Math.floor(20_000 + rnd() * 600_000);
    const isBuy = rnd() > 0.42;
    const hoodie = Math.round(100 + rnd() * 250_000);
    trades.push({
      id: `${token.symbol}-${i}`,
      token: token.address,
      tokenSymbol: token.symbol,
      trader: mockAddress(`trader-${token.symbol}-${i % 11}`),
      isBuy,
      hoodieAmount: hoodie,
      tokenAmount: Math.round(hoodie / Math.max(token.priceHoodie, 1e-9)),
      timestamp: ts,
    });
  }
  return trades;
}

/** Recent trades across all tokens of a launcher (for the live ticker). */
export function mockLauncherTrades(slug: string, count = 20): Trade[] {
  const tokens = MOCK_TOKENS.filter((t) => t.launcherSlug === slug);
  if (tokens.length === 0) return [];
  const all = tokens.flatMap((t) => mockTrades(t.address, 10));
  return all.sort((a, b) => b.timestamp - a.timestamp).slice(0, count);
}

const TF_SECONDS: Record<Timeframe, number> = {
  "1m": 60,
  "5m": 300,
  "1h": 3600,
  "1d": 86400,
};

export function mockCandles(
  tokenAddress: string,
  timeframe: Timeframe,
  count = 120
): Candle[] {
  const token =
    MOCK_TOKENS.find((t) => t.address.toLowerCase() === tokenAddress.toLowerCase()) ??
    MOCK_TOKENS[0];
  const step = TF_SECONDS[timeframe];
  const rnd = mulberry32(seedFrom(`candles-${token.symbol}-${timeframe}`));
  const endPrice = Math.max(token.priceHoodie, 1e-6);
  // walk backwards from current price
  const closes: number[] = [endPrice];
  for (let i = 1; i < count; i++) {
    const prev = closes[i - 1];
    const drift = 1 - 0.0015; // slight uptrend forward in time
    const shock = 1 + (rnd() - 0.5) * 0.06;
    closes.push(Math.max(1e-7, (prev / drift) * shock));
  }
  closes.reverse();
  const endTime = Math.floor(NOW / 1000 / step) * step;
  const candles: Candle[] = [];
  for (let i = 0; i < count; i++) {
    const open = i === 0 ? closes[0] * (1 + (rnd() - 0.5) * 0.02) : closes[i - 1];
    const close = closes[i];
    const hi = Math.max(open, close) * (1 + rnd() * 0.025);
    const lo = Math.min(open, close) * (1 - rnd() * 0.025);
    candles.push({
      time: endTime - (count - 1 - i) * step,
      open,
      high: hi,
      low: lo,
      close,
      volume: Math.round(1000 + rnd() * 90_000),
    });
  }
  return candles;
}

export function mockHolders(tokenAddress: string): Holder[] {
  const token =
    MOCK_TOKENS.find((t) => t.address.toLowerCase() === tokenAddress.toLowerCase()) ??
    MOCK_TOKENS[0];
  const rnd = mulberry32(seedFrom("holders-" + token.symbol));
  const weights = Array.from({ length: 10 }, (_, i) => rnd() / (i + 1));
  const sum = weights.reduce((a, b) => a + b, 0);
  const circulating = 793_100_000 * (token.progressBps / 10_000) * 0.9 + 1_000_000;
  return weights
    .map((w, i) => {
      const pct = (w / sum) * 42; // top-10 hold ~42%
      return {
        address:
          i === 0 ? "curve" : mockAddress(`holder-${token.symbol}-${i}`),
        balance: Math.round((pct / 100) * circulating),
        pct: Number(pct.toFixed(2)),
      };
    })
    .sort((a, b) => b.pct - a.pct);
}

export const MOCK_STATS: PlatformStats = {
  totalLaunchers: MOCK_LAUNCHERS.length + 24,
  totalTokens: MOCK_TOKENS.length + 129,
  totalVolumeHoodie: 144_320_000,
  graduatedTokens: 11,
};

export function findMockLauncher(slug: string): Launcher | undefined {
  return MOCK_LAUNCHERS.find((l) => l.slug === slug);
}

export function findMockToken(address: string): TokenInfo | undefined {
  return MOCK_TOKENS.find(
    (t) => t.address.toLowerCase() === address.toLowerCase()
  );
}
