import { index, onchainTable } from "ponder";

/** A launcher (a white-label pump.fun-style storefront) registered on-chain. */
export const launchers = onchainTable(
  "launchers",
  (t) => ({
    /** launcherId from LauncherRegistry. */
    id: t.bigint().primaryKey(),
    slug: t.text().notNull(),
    owner: t.hex().notNull(),
    feeRecipient: t.hex().notNull(),
    /** Launcher-level fee in basis points. */
    feeBps: t.integer().notNull(),
    /** Block timestamp of creation. */
    createdAt: t.bigint().notNull(),
    tokenCount: t.integer().notNull().default(0),
    /** Lifetime $HOODIE volume across all of this launcher's tokens. */
    volumeHoodie: t.bigint().notNull().default(0n),
  }),
  (table) => ({
    slugIdx: index().on(table.slug),
    ownerIdx: index().on(table.owner),
  }),
);

/** A token launched through the factory, trading on the shared bonding curve. */
export const tokens = onchainTable(
  "tokens",
  (t) => ({
    address: t.hex().primaryKey(),
    launcherId: t.bigint().notNull(),
    creator: t.hex().notNull(),
    name: t.text().notNull(),
    symbol: t.text().notNull(),
    metadataURI: t.text().notNull(),
    createdAt: t.bigint().notNull(),
    graduated: t.boolean().notNull().default(false),
    /** DEX pair address once graduated, else null. */
    pair: t.hex(),
    /** Last trade price in $HOODIE per token, 1e18-scaled. */
    lastPriceHoodie: t.bigint().notNull().default(0n),
    /** Real (non-virtual) $HOODIE held by the curve for this token. */
    realHoodieReserve: t.bigint().notNull().default(0n),
    /** Lifetime $HOODIE volume. */
    volumeHoodie: t.bigint().notNull().default(0n),
    tradeCount: t.integer().notNull().default(0),
    holderCount: t.integer().notNull().default(0),
  }),
  (table) => ({
    launcherIdx: index().on(table.launcherId),
    creatorIdx: index().on(table.creator),
  }),
);

/** One row per Trade event. id = `${txHash}-${logIndex}`. */
export const trades = onchainTable(
  "trades",
  (t) => ({
    id: t.text().primaryKey(),
    token: t.hex().notNull(),
    trader: t.hex().notNull(),
    isBuy: t.boolean().notNull(),
    hoodieAmount: t.bigint().notNull(),
    tokenAmount: t.bigint().notNull(),
    fee: t.bigint().notNull(),
    /** $HOODIE per token, 1e18-scaled fixed point. */
    price: t.bigint().notNull(),
    timestamp: t.bigint().notNull(),
  }),
  (table) => ({
    tokenIdx: index().on(table.token),
    traderIdx: index().on(table.trader),
    timestampIdx: index().on(table.timestamp),
  }),
);

/** OHLCV buckets. id = `${token}-${tf}-${bucketStart}`, tf in 1m|5m|1h|1d. */
export const candles = onchainTable(
  "candles",
  (t) => ({
    id: t.text().primaryKey(),
    token: t.hex().notNull(),
    tf: t.text().notNull(),
    /** Unix seconds, aligned to the timeframe. */
    bucketStart: t.bigint().notNull(),
    open: t.bigint().notNull(),
    high: t.bigint().notNull(),
    low: t.bigint().notNull(),
    close: t.bigint().notNull(),
    volumeHoodie: t.bigint().notNull(),
  }),
  (table) => ({
    tokenTfIdx: index().on(table.token, table.tf),
    bucketIdx: index().on(table.bucketStart),
  }),
);

/**
 * Per-token balances derived purely from bonding-curve Trade events
 * (the curve is always the counterparty). id = `${token}-${address}`.
 */
export const holders = onchainTable(
  "holders",
  (t) => ({
    id: t.text().primaryKey(),
    token: t.hex().notNull(),
    address: t.hex().notNull(),
    balance: t.bigint().notNull(),
  }),
  (table) => ({
    tokenIdx: index().on(table.token),
    balanceIdx: index().on(table.balance),
  }),
);
