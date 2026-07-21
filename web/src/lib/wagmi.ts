import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mainnet, sepolia } from "wagmi/chains";
import { CHAIN_ID, WC_PROJECT_ID } from "./config";

export const activeChain = CHAIN_ID === 11155111 ? sepolia : mainnet;

export const wagmiConfig = getDefaultConfig({
  appName: "HOODIEPAD",
  projectId: WC_PROJECT_ID,
  chains: [activeChain],
  ssr: true,
});
