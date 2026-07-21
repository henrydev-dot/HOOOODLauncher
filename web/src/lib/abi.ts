import type { Abi } from "viem";

export const launcherRegistryAbi = [
  {
    type: "function",
    name: "createLauncher",
    stateMutability: "nonpayable",
    inputs: [
      { name: "slug", type: "string" },
      { name: "feeRecipient", type: "address" },
      { name: "launcherFeeBps", type: "uint16" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "launcherCreationFee",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "launcherIdBySlugHash",
    stateMutability: "view",
    inputs: [{ name: "", type: "bytes32" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "getLauncher",
    stateMutability: "view",
    inputs: [{ name: "launcherId", type: "uint256" }],
    outputs: [
      { name: "owner", type: "address" },
      { name: "feeRecipient", type: "address" },
      { name: "launcherFeeBps", type: "uint16" },
      { name: "slug", type: "string" },
      { name: "antiSniperEnabled", type: "bool" },
    ],
  },
  {
    type: "function",
    name: "setAntiSniper",
    stateMutability: "nonpayable",
    inputs: [
      { name: "launcherId", type: "uint256" },
      { name: "enabled", type: "bool" },
    ],
    outputs: [],
  },
  {
    type: "event",
    name: "LauncherCreated",
    inputs: [
      { name: "launcherId", type: "uint256", indexed: true },
      { name: "slug", type: "string", indexed: false },
      { name: "owner", type: "address", indexed: true },
      { name: "feeRecipient", type: "address", indexed: false },
      { name: "launcherFeeBps", type: "uint16", indexed: false },
    ],
  },
] as const satisfies Abi;

export const tokenFactoryAbi = [
  {
    type: "function",
    name: "createToken",
    stateMutability: "nonpayable",
    inputs: [
      { name: "launcherId", type: "uint256" },
      { name: "name", type: "string" },
      { name: "symbol", type: "string" },
      { name: "metadataURI", type: "string" },
      { name: "devBuyHoodie", type: "uint256" },
      { name: "minTokensOut", type: "uint256" },
    ],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "tokenCreationFee",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "event",
    name: "TokenCreated",
    inputs: [
      { name: "launcherId", type: "uint256", indexed: true },
      { name: "token", type: "address", indexed: true },
      { name: "creator", type: "address", indexed: true },
      { name: "name", type: "string", indexed: false },
      { name: "symbol", type: "string", indexed: false },
      { name: "metadataURI", type: "string", indexed: false },
    ],
  },
] as const satisfies Abi;

export const bondingCurveAbi = [
  {
    type: "function",
    name: "buy",
    stateMutability: "nonpayable",
    inputs: [
      { name: "token", type: "address" },
      { name: "hoodieIn", type: "uint256" },
      { name: "minTokensOut", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "sell",
    stateMutability: "nonpayable",
    inputs: [
      { name: "token", type: "address" },
      { name: "tokensIn", type: "uint256" },
      { name: "minHoodieOut", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "quoteBuy",
    stateMutability: "view",
    inputs: [
      { name: "token", type: "address" },
      { name: "hoodieIn", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "quoteSell",
    stateMutability: "view",
    inputs: [
      { name: "token", type: "address" },
      { name: "tokensIn", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "getState",
    stateMutability: "view",
    inputs: [{ name: "token", type: "address" }],
    outputs: [
      { name: "realHoodieReserve", type: "uint256" },
      { name: "realTokenReserve", type: "uint256" },
      { name: "virtualHoodieReserve", type: "uint256" },
      { name: "virtualTokenReserve", type: "uint256" },
      { name: "graduated", type: "bool" },
      { name: "graduationThreshold", type: "uint256" },
      { name: "progressBps", type: "uint256" },
    ],
  },
  {
    type: "event",
    name: "Trade",
    inputs: [
      { name: "token", type: "address", indexed: true },
      { name: "trader", type: "address", indexed: true },
      { name: "isBuy", type: "bool", indexed: false },
      { name: "hoodieAmount", type: "uint256", indexed: false },
      { name: "tokenAmount", type: "uint256", indexed: false },
      { name: "fee", type: "uint256", indexed: false },
      { name: "virtualHoodieAfter", type: "uint256", indexed: false },
      { name: "virtualTokenAfter", type: "uint256", indexed: false },
    ],
  },
] as const satisfies Abi;

export const graduationManagerAbi = [
  {
    type: "function",
    name: "graduate",
    stateMutability: "nonpayable",
    inputs: [{ name: "token", type: "address" }],
    outputs: [{ name: "pair", type: "address" }],
  },
  {
    type: "event",
    name: "TokenGraduated",
    inputs: [
      { name: "token", type: "address", indexed: true },
      { name: "pair", type: "address", indexed: true },
      { name: "hoodieLiquidity", type: "uint256", indexed: false },
      { name: "tokenLiquidity", type: "uint256", indexed: false },
    ],
  },
] as const satisfies Abi;

export const feeSplitterAbi = [
  {
    type: "function",
    name: "claim",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "pendingFees",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const satisfies Abi;

export const erc20Abi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "totalSupply",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const satisfies Abi;
