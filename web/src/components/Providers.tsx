"use client";

import { useState, type ReactNode } from "react";
import { useLocale } from "next-intl";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RainbowKitProvider,
  darkTheme,
  type Locale,
} from "@rainbow-me/rainbowkit";
import { wagmiConfig } from "@/lib/wagmi";

export function Providers({ children }: { children: ReactNode }) {
  const appLocale = useLocale();
  // Match RainbowKit's wallet UI language to the app language instead of
  // letting it auto-detect from the browser.
  const rkLocale: Locale = appLocale === "tr" ? "tr-TR" : "en-US";

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 15_000, refetchOnWindowFocus: false },
        },
      })
  );

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          locale={rkLocale}
          theme={darkTheme({
            accentColor: "#CCFF00",
            accentColorForeground: "#000000",
            borderRadius: "none",
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
