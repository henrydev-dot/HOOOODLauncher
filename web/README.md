# HOODIEPAD — web

Next.js 14 (App Router) frontend for HOODIEPAD, the launchpad factory where anyone
spins up a pump.fun-style token launcher paired with $HOODIE.

## Stack

- Next.js 14 + TypeScript + TailwindCSS ("Pixel Arcade" design system)
- wagmi v2 + viem + RainbowKit, @tanstack/react-query
- lightweight-charts for candlesticks, zustand for UI state
- next-intl — Turkish (default) + English, switched via cookie

## Develop

```bash
cd web
pnpm install --ignore-workspace
cp .env.example .env.local   # fill in contract addresses when deployed
pnpm dev
```

With `NEXT_PUBLIC_API_URL` empty the app runs fully on deterministic mock data
(3 demo launchers: `/hoodie-arcade`, `/neon-terminal`, `/meme-vitrin`). With no
registry address configured, wallet flows run in demo mode (no tx sent).

## Build

```bash
pnpm build && pnpm start
```

## Structure

- `src/lib` — config (env), ABIs, curve math, API client + mock data
- `src/components/ui` — Pixel* primitives (button, panel, input, progress, badge, tabs)
- `src/components/mascots` — 12 pixel-art SVG mascots + registry
- `src/components/schemes` — the three launcher layouts (Arcade / Terminal / Vitrine)
- `src/app` — routes: `/`, `/explore`, `/create`, `/docs`, `/[slug]`, `/[slug]/create-token`, `/[slug]/token/[address]`, `/[slug]/admin`
