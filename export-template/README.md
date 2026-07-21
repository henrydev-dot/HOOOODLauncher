# HOODIEPAD Launcher Template

Your own launchpad storefront, exported from **HOODIEPAD**. This is a minimal
Next.js 14 app you can host on any domain. It still points at the **shared
HOODIEPAD contracts** and the **public indexer API** — you only own the
frontend (and your launcher's fee stream).

- `/` — the token list for *your* launcher (fetched from the public API)
- `/token/[address]` — trade page: buy/sell against the shared BondingCurve
  with $HOODIE (`0xC72c01AAB5f5678dc1d6f5C6d2B417d91D402Ba3`), graduation
  progress bar, recent trades

## Quick start

```bash
pnpm i
pnpm dev
```

Then edit **`launcher.config.json`** — it is the single source of truth:

| Field        | Meaning                                                        |
| ------------ | -------------------------------------------------------------- |
| `slug`       | Your launcher's slug in the LauncherRegistry                   |
| `launcherId` | Your launcher's on-chain id                                    |
| `name`       | Display name                                                   |
| `themeColor` | Primary color (default `#CCFF00`)                              |
| `mascot`     | Emoji / short string shown in the header                       |
| `scheme`     | `arcade` \| `terminal` \| `vitrine` (visual scheme; template ships arcade) |
| `chainId`    | `1` (mainnet) or `11155111` (sepolia)                          |
| `contracts`  | Shared HOODIEPAD contract addresses                            |
| `apiUrl`     | Public HOODIEPAD indexer API base URL                          |

## Env vars

All optional — everything has a config-file default:

| Var                   | Purpose                                              |
| --------------------- | ---------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | Override `apiUrl` (e.g. a local indexer on `:42069`) |

## Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FYOUR_ORG%2FYOUR_EXPORTED_REPO&project-name=my-hoodiepad-launcher&repository-name=my-hoodiepad-launcher)

(Replace the `repository-url` with your exported repo. Any static-friendly
Node host works — the app is client-rendered and needs no server secrets.)

## Notes

- Wallet: injected connectors only (MetaMask, Rabby, …) via wagmi v2 + viem.
- Buys spend $HOODIE (approve → buy), sells spend your token (approve → sell);
  1% slippage guard on both.
- Live trade push over WebSocket is not wired yet — the UI polls the API every
  10s.
