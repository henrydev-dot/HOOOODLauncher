export const GraduationManagerAbi = [
  {
    type: "event",
    name: "TokenGraduated",
    inputs: [
      { name: "token", type: "address", indexed: true, internalType: "address" },
      { name: "pair", type: "address", indexed: true, internalType: "address" },
      { name: "hoodieLiquidity", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "tokenLiquidity", type: "uint256", indexed: false, internalType: "uint256" },
    ],
    anonymous: false,
  },
] as const;
