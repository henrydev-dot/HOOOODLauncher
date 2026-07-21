# HOODIEPAD Indexer

[Ponder](https://ponder.sh) event indexer + HTTP API for HOODIEPAD — the
launchpad factory where every token trades against **$HOODIE**
(`0xC72c01AAB5f5678dc1d6f5C6d2B417d91D402Ba3`).

It indexes four contracts:

| Contract          | Event                                                            | What we derive                        |
| ----------------- | ---------------------------------------------------------------- | ------------------------------------- |
| LauncherRegistry  | `LauncherCreated(launcherId, slug, owner, feeRecipient, feeBps)` | `launchers` table                     |
| TokenFactory      | `TokenCreated(launcherId, token, creator, name, symbol, uri)`    | `tokens` table, launcher tokenCount   |
| BondingCurve      | `Trade(token, trader, isBuy, hoodie, tokens, fee, vH, vT)`       | `trades`, `candles`, `holders`, aggregates |
| GraduationManager | `TokenGraduated(token, pair, hoodieLiq, tokenLiq)`               | `tokens.graduated` / `tokens.pair`    |

Prices are stored as **1e18-scaled bigints** ($HOODIE per token,
`hoodieAmount * 1e18 / tokenAmount`). OHLCV candles are maintained on every
trade for `1m`, `5m`, `1h`, and `1d` buckets. Holder balances are derived
purely from curve trades (the curve is always the counterparty); post-graduation
DEX transfers are out of scope for this table.

## Setup

```bash
cd indexer
pnpm install --ignore-workspace
cp .env.example .env   # fill in RPC url, DATABASE_URL, contract addresses
pnpm codegen           # generates ponder-env.d.ts
pnpm dev               # dev mode (hot reload, drops+recreates tables)
pnpm start             # production mode
```

### Database (Neon / Supabase)

Ponder targets Postgres. Set `DATABASE_URL` to any Postgres connection string:

- **Neon**: create a project, copy the pooled connection string
  (`postgresql://...-pooler.../neondb?sslmode=require`).
- **Supabase**: Settings → Database → connection string (use the *session*
  pooler on port 5432 for migrations-heavy workloads).
- **Local dev**: leave `DATABASE_URL` unset and Ponder falls back to an
  embedded PGlite database under `.ponder/` — no Postgres needed.

### Chain switching

`CHAIN_ID=1` (mainnet, `PONDER_RPC_URL_1`) or `CHAIN_ID=11155111` (sepolia,
`PONDER_RPC_URL_11155111`, default). Contract addresses and start blocks come
from env — see `.env.example`.

## HTTP API

Served by Ponder's built-in [Hono](https://hono.dev) server (`src/api/index.ts`),
default port 42069. All bigints are serialized as decimal strings. CORS is
enabled (`*`).

| Route                                | Description                                    |
| ------------------------------------ | ---------------------------------------------- |
| `GET /api/launchers?sort=volume\|new&limit=` | List launchers (default sort: volume)  |
| `GET /api/launchers/:slug`           | Launcher by slug, incl. its tokens             |
| `GET /api/tokens/:address`           | Token detail                                   |
| `GET /api/tokens/:address/candles?tf=1m\|5m\|1h\|1d&limit=` | OHLCV, oldest-first |
| `GET /api/tokens/:address/trades?limit=` | Recent trades, newest-first                |
| `GET /api/tokens/:address/holders`   | Top 10 holders by balance                      |

Example:

```bash
curl 'http://localhost:42069/api/tokens/0xabc.../candles?tf=1h&limit=168'
```

## Stubbed features

Two pieces are intentionally stubbed for now:

1. **WebSocket live-trade push** — the exported launcher UIs currently poll the
   REST API. A `/ws` endpoint that fans out `Trade` events in realtime is
   planned; it will live alongside `src/api/index.ts` (Hono upgrade handler or
   a small sidecar over Postgres LISTEN/NOTIFY).
2. **IPFS pinning** — `src/pin.ts` is a typed Pinata wrapper (reads
   `PINATA_JWT`). `pinJson` has a working fetch implementation, `pinFile` is a
   stub, and no HTTP upload endpoint is exposed yet. Wire it into an
   authenticated `POST /api/pin` route (or move it to the web app's server
   actions) before launch.

## Notes for the parallel contract work

ABIs in `abis/` are hand-written from the final event signatures. If the
contract events change shape, update the ABI const arrays and
`ponder.schema.ts`/`src/index.ts` accordingly, then re-run `pnpm codegen`.
