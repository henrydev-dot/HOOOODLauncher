import type { Address } from "viem";

const addr = (v: string | undefined, fallback: Address): Address =>
  v && /^0x[a-fA-F0-9]{40}$/.test(v) ? (v as Address) : fallback;

export const ZERO_ADDRESS =
  "0x0000000000000000000000000000000000000000" as Address;

export const HOODIE_ADDRESS = addr(
  process.env.NEXT_PUBLIC_HOODIE_ADDRESS,
  "0xC72c01AAB5f5678dc1d6f5C6d2B417d91D402Ba3"
);

export const REGISTRY_ADDRESS = addr(
  process.env.NEXT_PUBLIC_REGISTRY_ADDRESS,
  ZERO_ADDRESS
);
export const FACTORY_ADDRESS = addr(
  process.env.NEXT_PUBLIC_FACTORY_ADDRESS,
  ZERO_ADDRESS
);
export const CURVE_ADDRESS = addr(
  process.env.NEXT_PUBLIC_CURVE_ADDRESS,
  ZERO_ADDRESS
);
export const GRADUATION_ADDRESS = addr(
  process.env.NEXT_PUBLIC_GRADUATION_ADDRESS,
  ZERO_ADDRESS
);
export const FEESPLITTER_ADDRESS = addr(
  process.env.NEXT_PUBLIC_FEESPLITTER_ADDRESS,
  ZERO_ADDRESS
);

export const CHAIN_ID: 1 | 11155111 =
  process.env.NEXT_PUBLIC_CHAIN_ID === "11155111" ? 11155111 : 1;

export const WC_PROJECT_ID =
  process.env.NEXT_PUBLIC_WC_PROJECT_ID || "demo";

/** Indexer REST API base. Empty string => use built-in mock data. */
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

/** Neon theme presets for launcher themes. */
export const THEME_PRESETS = [
  "#CCFF00",
  "#00FFB2",
  "#FF4D6D",
  "#00CFFF",
  "#FF9E00",
  "#C77DFF",
] as const;

/** Platform fee constants (display only — contracts are source of truth). */
export const FEES = {
  launcherCreationHoodie: 50_000,
  tokenCreationHoodie: 500,
  tradeFeeBpsTotal: 100, // 1%
  tradeFeeBpsPlatform: 50, // 0.5%
  tradeFeeBpsLauncherMax: 50, // up to 0.5%
  graduationFeeBps: 200, // 2%
  graduateCallerIncentiveBps: 5, // 0.05%
} as const;

export const EXPLORER_URL =
  CHAIN_ID === 11155111
    ? "https://sepolia.etherscan.io"
    : "https://etherscan.io";

export const UNISWAP_POOL_URL = (pair: string) =>
  `https://app.uniswap.org/explore/pools/ethereum/${pair}`;
