"use client";

import { create } from "zustand";
import type { LauncherFeatures, LayoutScheme, SocialLinks } from "./types";

/* ---------------------------- Wizard store ---------------------------- */

export interface WizardState {
  step: number;
  name: string;
  slug: string;
  logoDataUrl: string | null;
  mascotId: string;
  themeColor: string;
  scheme: LayoutScheme;
  features: LauncherFeatures;
  social: SocialLinks;
  feeBps: number;
  set: (p: Partial<Omit<WizardState, "set" | "reset">>) => void;
  reset: () => void;
}

const wizardDefaults = {
  step: 1,
  name: "",
  slug: "",
  logoDataUrl: null as string | null,
  mascotId: "hoodie-cat",
  themeColor: "#CCFF00",
  scheme: "arcade" as LayoutScheme,
  features: {
    chat: true,
    kingOfTheHill: true,
    antiSniper: false,
    liveTicker: true,
    socialLinks: true,
  },
  social: {} as SocialLinks,
  feeBps: 50,
};

export const useWizardStore = create<WizardState>((set) => ({
  ...wizardDefaults,
  set: (p) => set(p),
  reset: () => set({ ...wizardDefaults }),
}));

/* ---------------------------- Trade settings --------------------------- */

interface TradeSettings {
  slippageBps: number;
  setSlippageBps: (bps: number) => void;
}

export const useTradeSettings = create<TradeSettings>((set) => ({
  slippageBps: 100, // 1%
  setSlippageBps: (slippageBps) => set({ slippageBps }),
}));

/* ------------------------------- Toasts -------------------------------- */

export interface Toast {
  id: number;
  message: string;
  kind: "success" | "error" | "info";
}

interface ToastState {
  toasts: Toast[];
  push: (message: string, kind?: Toast["kind"]) => void;
  dismiss: (id: number) => void;
}

let toastId = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (message, kind = "info") => {
    const id = ++toastId;
    set((s) => ({ toasts: [...s.toasts, { id, message, kind }] }));
    setTimeout(
      () => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
      4000
    );
  },
  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
