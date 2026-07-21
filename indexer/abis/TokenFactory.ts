export const TokenFactoryAbi = [
  {
    type: "event",
    name: "TokenCreated",
    inputs: [
      { name: "launcherId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "token", type: "address", indexed: true, internalType: "address" },
      { name: "creator", type: "address", indexed: true, internalType: "address" },
      { name: "name", type: "string", indexed: false, internalType: "string" },
      { name: "symbol", type: "string", indexed: false, internalType: "string" },
      { name: "metadataURI", type: "string", indexed: false, internalType: "string" },
    ],
    anonymous: false,
  },
] as const;
