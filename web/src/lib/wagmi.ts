import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { CHAIN_ID, WC_PROJECT_ID } from "./config";
import { SUPPORTED_CHAINS } from "./chains";

export const activeChain = SUPPORTED_CHAINS[CHAIN_ID];

export const wagmiConfig = getDefaultConfig({
  appName: "HOODIEPAD",
  projectId: WC_PROJECT_ID,
  chains: [activeChain],
  ssr: true,
});
