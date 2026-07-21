import launcher from "@/launcher.config.json";

export interface LauncherConfig {
  slug: string;
  launcherId: number;
  name: string;
  themeColor: string;
  mascot: string;
  scheme: "arcade" | "terminal" | "vitrine";
  chainId: number;
  contracts: {
    registry: `0x${string}`;
    factory: `0x${string}`;
    curve: `0x${string}`;
    graduation: `0x${string}`;
    feeSplitter: `0x${string}`;
    hoodie: `0x${string}`;
  };
  apiUrl: string;
}

export const config = launcher as LauncherConfig;

/** API base URL — overridable via env for local dev against a local indexer. */
export const apiUrl =
  process.env.NEXT_PUBLIC_API_URL ?? config.apiUrl.replace(/\/$/, "");
