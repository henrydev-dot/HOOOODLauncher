import { createConfig } from "ponder";

import { LauncherRegistryAbi } from "./abis/LauncherRegistry";
import { TokenFactoryAbi } from "./abis/TokenFactory";
import { BondingCurveAbi } from "./abis/BondingCurve";
import { GraduationManagerAbi } from "./abis/GraduationManager";

/**
 * Chain selection is driven by the CHAIN_ID env var:
 *   CHAIN_ID=1        -> mainnet   (PONDER_RPC_URL_1)
 *   CHAIN_ID=11155111 -> sepolia   (PONDER_RPC_URL_11155111)  [default]
 */
const CHAIN_ID = Number(process.env.CHAIN_ID ?? 11155111);

const chain =
  CHAIN_ID === 1
    ? { name: "mainnet" as const, id: 1, rpc: process.env.PONDER_RPC_URL_1 }
    : {
        name: "sepolia" as const,
        id: 11155111,
        rpc: process.env.PONDER_RPC_URL_11155111,
      };

const address = (value: string | undefined): `0x${string}` =>
  (value ?? "0x0000000000000000000000000000000000000000") as `0x${string}`;

const startBlock = (value: string | undefined): number => Number(value ?? 0);

export default createConfig({
  chains: {
    [chain.name]: {
      id: chain.id,
      rpc: chain.rpc,
    },
  },
  contracts: {
    LauncherRegistry: {
      chain: chain.name,
      abi: LauncherRegistryAbi,
      address: address(process.env.LAUNCHER_REGISTRY_ADDRESS),
      startBlock: startBlock(process.env.LAUNCHER_REGISTRY_START_BLOCK),
    },
    TokenFactory: {
      chain: chain.name,
      abi: TokenFactoryAbi,
      address: address(process.env.TOKEN_FACTORY_ADDRESS),
      startBlock: startBlock(process.env.TOKEN_FACTORY_START_BLOCK),
    },
    BondingCurve: {
      chain: chain.name,
      abi: BondingCurveAbi,
      address: address(process.env.BONDING_CURVE_ADDRESS),
      startBlock: startBlock(process.env.BONDING_CURVE_START_BLOCK),
    },
    GraduationManager: {
      chain: chain.name,
      abi: GraduationManagerAbi,
      address: address(process.env.GRADUATION_MANAGER_ADDRESS),
      startBlock: startBlock(process.env.GRADUATION_MANAGER_START_BLOCK),
    },
  },
});
