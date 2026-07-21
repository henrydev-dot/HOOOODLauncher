import { ponder } from "ponder:registry";
import { candles, holders, launchers, tokens, trades } from "ponder:schema";

const WAD = 10n ** 18n;

/** Timeframes for OHLCV aggregation (label -> bucket size in seconds). */
const TIMEFRAMES = [
  ["1m", 60n],
  ["5m", 300n],
  ["1h", 3600n],
  ["1d", 86400n],
] as const;

ponder.on("LauncherRegistry:LauncherCreated", async ({ event, context }) => {
  const { launcherId, slug, owner, feeRecipient, launcherFeeBps } = event.args;

  await context.db
    .insert(launchers)
    .values({
      id: launcherId,
      slug,
      owner,
      feeRecipient,
      feeBps: Number(launcherFeeBps),
      createdAt: event.block.timestamp,
      tokenCount: 0,
      volumeHoodie: 0n,
    })
    .onConflictDoNothing();
});

ponder.on("TokenFactory:TokenCreated", async ({ event, context }) => {
  const { launcherId, token, creator, name, symbol, metadataURI } = event.args;

  await context.db
    .insert(tokens)
    .values({
      address: token,
      launcherId,
      creator,
      name,
      symbol,
      metadataURI,
      createdAt: event.block.timestamp,
      graduated: false,
      pair: null,
      lastPriceHoodie: 0n,
      realHoodieReserve: 0n,
      volumeHoodie: 0n,
      tradeCount: 0,
      holderCount: 0,
    })
    .onConflictDoNothing();

  const launcherRow = await context.db.find(launchers, { id: launcherId });
  if (launcherRow !== null) {
    await context.db
      .update(launchers, { id: launcherId })
      .set((row) => ({ tokenCount: row.tokenCount + 1 }));
  }
});

ponder.on("BondingCurve:Trade", async ({ event, context }) => {
  const { token, trader, isBuy, hoodieAmount, tokenAmount, fee } = event.args;
  const timestamp = event.block.timestamp;

  // Price in $HOODIE per token, 1e18-scaled fixed point.
  const price = tokenAmount > 0n ? (hoodieAmount * WAD) / tokenAmount : 0n;

  // 1. Record the trade itself.
  await context.db.insert(trades).values({
    id: `${event.transaction.hash}-${event.log.logIndex}`,
    token,
    trader,
    isBuy,
    hoodieAmount,
    tokenAmount,
    fee,
    price,
    timestamp,
  });

  // 2. Update per-holder balance (the curve is the counterparty, so the
  //    trader's balance moves by tokenAmount on every trade).
  const holderId = `${token}-${trader}`;
  const existingHolder = await context.db.find(holders, { id: holderId });
  const prevBalance = existingHolder?.balance ?? 0n;
  const rawNext = isBuy ? prevBalance + tokenAmount : prevBalance - tokenAmount;
  // Clamp defensively: transfers outside the curve are not tracked here.
  const nextBalance = rawNext < 0n ? 0n : rawNext;

  if (existingHolder === null) {
    await context.db.insert(holders).values({
      id: holderId,
      token,
      address: trader,
      balance: nextBalance,
    });
  } else {
    await context.db
      .update(holders, { id: holderId })
      .set({ balance: nextBalance });
  }

  const holderDelta =
    prevBalance === 0n && nextBalance > 0n
      ? 1
      : prevBalance > 0n && nextBalance === 0n
        ? -1
        : 0;

  // 3. Update token aggregates (skip gracefully if the token predates our
  //    start block and was never inserted).
  const tokenRow = await context.db.find(tokens, { address: token });
  if (tokenRow !== null) {
    await context.db.update(tokens, { address: token }).set((row) => {
      const reserveDelta = isBuy ? hoodieAmount - fee : -hoodieAmount;
      const nextReserve = row.realHoodieReserve + reserveDelta;
      return {
        lastPriceHoodie: price,
        realHoodieReserve: nextReserve < 0n ? 0n : nextReserve,
        volumeHoodie: row.volumeHoodie + hoodieAmount,
        tradeCount: row.tradeCount + 1,
        holderCount: row.holderCount + holderDelta,
      };
    });

    // 4. Roll volume up to the launcher.
    const launcherRow = await context.db.find(launchers, {
      id: tokenRow.launcherId,
    });
    if (launcherRow !== null) {
      await context.db
        .update(launchers, { id: tokenRow.launcherId })
        .set((row) => ({ volumeHoodie: row.volumeHoodie + hoodieAmount }));
    }
  }

  // 5. Upsert OHLCV candles for every timeframe.
  for (const [tf, seconds] of TIMEFRAMES) {
    const bucketStart = timestamp - (timestamp % seconds);
    await context.db
      .insert(candles)
      .values({
        id: `${token}-${tf}-${bucketStart}`,
        token,
        tf,
        bucketStart,
        open: price,
        high: price,
        low: price,
        close: price,
        volumeHoodie: hoodieAmount,
      })
      .onConflictDoUpdate((row) => ({
        high: price > row.high ? price : row.high,
        low: price < row.low ? price : row.low,
        close: price,
        volumeHoodie: row.volumeHoodie + hoodieAmount,
      }));
  }
});

ponder.on("GraduationManager:TokenGraduated", async ({ event, context }) => {
  const { token, pair } = event.args;

  const tokenRow = await context.db.find(tokens, { address: token });
  if (tokenRow !== null) {
    await context.db
      .update(tokens, { address: token })
      .set({ graduated: true, pair });
  }
});
