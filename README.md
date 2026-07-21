# HOODIEPAD 🧥⚡

**Sıfır kodla kendi pump.fun'ını kur.** / *Launch your own pump.fun-style launchpad with zero code.*

HOODIEPAD is a **launchpad factory** on EVM: anyone can fill in a short wizard and publish their own pump.fun-style token launcher at `site.com/<launcher-slug>` in minutes. Every token created on any launcher is **mandatorily paired with $HOODIE** (`0xC72c01AAB5f5678dc1d6f5C6d2B417d91D402Ba3`): all bonding-curve trading is HOODIE-denominated, and on graduation liquidity moves to a Uniswap V2 **TOKEN/HOODIE** pool with 100% of the LP burned. The whole platform speaks **pixel art** with a **Robin Neon (`#CCFF00`)** theme.

```
┌───────────────────────── FRONTEND (web/, Next.js 14) ─────────────────────────┐
│  main site · /create wizard · /[slug] themed launchers · /[slug]/token/[addr] │
└──────────────┬──────────────────────────────────┬─────────────────────────────┘
               │ wagmi/viem                       │ REST
┌──────────────▼──────────────┐      ┌────────────▼──────────────────────────────┐
│  CONTRACTS (contracts/)     │      │  INDEXER + API (indexer/, Ponder)         │
│  LauncherRegistry           │      │  events → Postgres → OHLCV candles        │
│  TokenFactory (EIP-1167)    │      │  /api/launchers /api/tokens/:a/candles …  │
│  BondingCurve (HOODIE x·y=k)│      └───────────────────────────────────────────┘
│  GraduationManager          │      ┌───────────────────────────────────────────┐
│  FeeSplitter + Timelock48   │      │  EXPORT (export-template/)                │
└─────────────────────────────┘      │  standalone Next.js launcher for GitHub/  │
                                     │  ZIP export, same contracts + public API  │
                                     └───────────────────────────────────────────┘
```

**Key architectural decision:** launchers do **not** get their own contract deployments. One shared, immutable contract set serves everyone; a launcher is an on-chain registry record (fee recipient + parameters) plus an off-chain theme config. Cheaper gas, one audited surface.

## Monorepo

| Package | What | Status |
|---|---|---|
| [`contracts/`](contracts/) | Foundry project: registry, factory, curve, graduation, fee splitter, 48h timelock, mocks, unit + fuzz tests | ✅ compiles clean, E2E lifecycle verified on a local EVM |
| [`web/`](web/) | Next.js 14 main app: Pixel Arcade design system, 12 mascots, 5-step wizard, 3 layout schemes, trade page with candles | ✅ builds |
| [`indexer/`](indexer/) | Ponder indexer: trades → OHLCV (1m/5m/1h/1d), REST API, holder tracking | ✅ typechecks |
| [`export-template/`](export-template/) | Standalone launcher UI a creator exports to GitHub/ZIP and hosts anywhere | ✅ builds |

## Quickstart

```bash
pnpm i && pnpm dev        # frontend (mock data mode works with no backend)
cd contracts && forge build && forge test   # contracts (CI runs this too)
cd indexer && pnpm dev    # indexer (needs RPC + contract addresses in .env)
```

## Fee economy (defaults — admin-tunable behind a 48h timelock, hard-capped)

| Fee | Value | To |
|---|---|---|
| Launcher creation | 50,000 HOODIE | Platform treasury |
| Token creation | 500 HOODIE | 50% platform / 50% launcher owner |
| Trade fee | 1% | launcher owner's share = its `launcherFeeBps` (0–1%), remainder platform |
| Graduation fee | 2% of collected HOODIE | Platform treasury |
| Graduate call incentive | 0.05% | Whoever calls `graduate()` |

All fees are HOODIE-denominated → structural HOODIE demand as the platform grows.

## Token lifecycle

1. **Create** — 1B fixed supply minted straight to the shared bonding curve. No owner, no mint function, no tax. Optional atomic "dev buy".
2. **Trade** — constant-product curve with virtual reserves (300M HOODIE / 1,073M tokens). Slippage protection mandatory; price comes only from curve state.
3. **Graduate** — at 85M HOODIE real reserve the curve freezes; anyone calls `graduate()`: Uniswap V2 TOKEN/HOODIE pool is created, **100% of LP burned to `0xdead`** (or 12-month lock via config), leftover inventory burned.

## Deviations from the spec (documented per instruction §11.1)

- **Vendored micro-libraries instead of OpenZeppelin imports** (`contracts/src/vendor/`): same semantics (SafeERC20 / ReentrancyGuard / Ownable2Step / Clones), zero submodules → `forge build` works with no network. Swapping to upstream OZ is a mechanical change if the auditor prefers.
- **`Timelock48` instead of OZ `TimelockController`**: a deliberately tiny 48h queue/execute/cancel contract — smaller audit surface, same guarantee.
- **Trade-fee split**: the spec's "0.5% + 0.5%" table and the "0–1% launcher slider" are reconciled as: total fee fixed at 1%, launcher's share = its `launcherFeeBps` (default UI value 50 bps = 0.5%), platform takes the remainder. A launcher setting below 0.5% donates the difference to the platform, exactly as §4.5 describes.
- **Curve close vs. sale-out**: with the spec's default virtual reserves, the 85M HOODIE threshold is reached after ~237M tokens sold, so the curve closes on threshold (both buys *and* sells freeze pending graduation, preventing the reserve dipping back under the threshold). Unsold inventory is burned at graduation; the LP allocation stays exactly 206.9M. Threshold + reserves must be **calibrated to HOODIE's USD price before mainnet** (Faz 7).
- **Foundry tests use a minimal in-repo cheatcode interface** instead of forge-std (same reason as vendoring). CI runs `forge test`; additionally the full lifecycle was executed against a real EVM (ganache) during development — 20/20 checks green.
- **WebSocket live push and IPFS pinning are stubbed** in the indexer (REST polling works today); GitHub OAuth export is an API surface in the web app wired for a backend implementation.

## Development plan status (spec §9)

- **Faz 0–2 (contracts, graduation)**: implemented + tested (mainnet-fork test against real HOODIE/Uniswap still required before deploy — see `contracts/README.md`, "Faz 0 research note": verifying which network HOODIE actually lives on, its decimals/tax/pausability is a hard mainnet prerequisite that requires Etherscan access).
- **Faz 3 (indexer)**: schema, handlers, OHLCV, REST done; WebSocket + IPFS pinning stubbed.
- **Faz 4–5 (frontend, wizard, themes)**: design system, mascots, wizard, schemes, trade page done (mock-data fallback until an indexer deployment is configured).
- **Faz 6 (export)**: standalone template done; GitHub OAuth repo-creation service is the remaining backend piece.
- **Faz 7 (audit + mainnet)**: not started — independent audit + parameter calibration + HOODIE due diligence are mandatory before any mainnet deployment.

## Risk notes

Everything on-chain is immutable and permissionless: HOODIEPAD cannot censor on-chain data, only hide a launcher from its own frontend. Tokens are rug-proof at the token level (no mint, no owner, LP burned) but remain highly speculative. See `/docs` in the app for the full risk disclosure. **Do not deploy to mainnet without the Faz 7 audit.**

## License

MIT — see [LICENSE](LICENSE).
