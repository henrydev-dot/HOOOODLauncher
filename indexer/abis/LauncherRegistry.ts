export const LauncherRegistryAbi = [
  {
    type: "event",
    name: "LauncherCreated",
    inputs: [
      { name: "launcherId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "slug", type: "string", indexed: false, internalType: "string" },
      { name: "owner", type: "address", indexed: true, internalType: "address" },
      { name: "feeRecipient", type: "address", indexed: false, internalType: "address" },
      { name: "launcherFeeBps", type: "uint16", indexed: false, internalType: "uint16" },
    ],
    anonymous: false,
  },
] as const;
