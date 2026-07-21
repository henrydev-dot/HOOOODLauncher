// NOTE: `injected` is imported from the main entry (re-exported from
// @wagmi/core) rather than "wagmi/connectors" — the connectors barrel drags in
// every third-party connector SDK and breaks webpack builds on optional deps.
import { createConfig, http, injected } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { config } from "./config";

const chain = config.chainId === 1 ? mainnet : sepolia;

export const wagmiConfig = createConfig({
  chains: [chain],
  connectors: [injected()],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
  ssr: true,
});

export const activeChain = chain;
