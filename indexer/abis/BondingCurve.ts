export const BondingCurveAbi = [
  {
    type: "event",
    name: "Trade",
    inputs: [
      { name: "token", type: "address", indexed: true, internalType: "address" },
      { name: "trader", type: "address", indexed: true, internalType: "address" },
      { name: "isBuy", type: "bool", indexed: false, internalType: "bool" },
      { name: "hoodieAmount", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "tokenAmount", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "fee", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "virtualHoodieAfter", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "virtualTokenAfter", type: "uint256", indexed: false, internalType: "uint256" },
    ],
    anonymous: false,
  },
] as const;
