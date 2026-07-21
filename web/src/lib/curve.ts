/**
 * Client-side bonding-curve math for estimates.
 * Constant-product with virtual reserves; 1% fee taken from the HOODIE side.
 * The on-chain contract is the source of truth — these mirrors are for UX only.
 */

export const VIRTUAL_HOODIE_0 = 300_000_000n * 10n ** 18n;
export const VIRTUAL_TOKEN_0 = 1_073_000_000n * 10n ** 18n;
export const GRADUATION_THRESHOLD = 85_000_000n * 10n ** 18n;
export const SALE_SUPPLY = 793_100_000n * 10n ** 18n;
export const TOTAL_SUPPLY = 1_000_000_000n * 10n ** 18n;
export const FEE_BPS = 100n; // 1%
export const BPS = 10_000n;

export interface CurveState {
  realHoodieReserve: bigint;
  realTokenReserve: bigint;
  virtualHoodieReserve: bigint;
  virtualTokenReserve: bigint;
  graduated: boolean;
  graduationThreshold: bigint;
  progressBps: bigint;
}

export function initialCurveState(): CurveState {
  return {
    realHoodieReserve: 0n,
    realTokenReserve: SALE_SUPPLY,
    virtualHoodieReserve: VIRTUAL_HOODIE_0,
    virtualTokenReserve: VIRTUAL_TOKEN_0,
    graduated: false,
    graduationThreshold: GRADUATION_THRESHOLD,
    progressBps: 0n,
  };
}

/** Tokens received for `hoodieIn` HOODIE (fee deducted from HOODIE side). */
export function quoteBuy(state: CurveState, hoodieIn: bigint): bigint {
  if (hoodieIn <= 0n) return 0n;
  const fee = (hoodieIn * FEE_BPS) / BPS;
  const inAfterFee = hoodieIn - fee;
  const k = state.virtualHoodieReserve * state.virtualTokenReserve;
  const newH = state.virtualHoodieReserve + inAfterFee;
  const newT = k / newH;
  return state.virtualTokenReserve - newT;
}

/** HOODIE received for `tokensIn` tokens (fee deducted from HOODIE out). */
export function quoteSell(state: CurveState, tokensIn: bigint): bigint {
  if (tokensIn <= 0n) return 0n;
  const k = state.virtualHoodieReserve * state.virtualTokenReserve;
  const newT = state.virtualTokenReserve + tokensIn;
  const newH = k / newT;
  const grossOut = state.virtualHoodieReserve - newH;
  const fee = (grossOut * FEE_BPS) / BPS;
  return grossOut - fee;
}

/** Spot price: HOODIE per token, as a float (18-dec inputs). */
export function spotPrice(state: CurveState): number {
  return (
    Number(state.virtualHoodieReserve / 10n ** 9n) /
    Number(state.virtualTokenReserve / 10n ** 9n)
  );
}

/** Price impact of a buy, in basis points (positive = you pay above spot). */
export function buyPriceImpactBps(state: CurveState, hoodieIn: bigint): number {
  if (hoodieIn <= 0n) return 0;
  const out = quoteBuy(state, hoodieIn);
  if (out <= 0n) return 0;
  const execPrice =
    Number(hoodieIn / 10n ** 9n) / Number(out / 10n ** 9n);
  const spot = spotPrice(state);
  if (spot === 0) return 0;
  return Math.max(0, Math.round(((execPrice - spot) / spot) * 10_000));
}

/** Price impact of a sell, in basis points. */
export function sellPriceImpactBps(
  state: CurveState,
  tokensIn: bigint
): number {
  if (tokensIn <= 0n) return 0;
  const out = quoteSell(state, tokensIn);
  if (out <= 0n) return 0;
  const execPrice =
    Number(out / 10n ** 9n) / Number(tokensIn / 10n ** 9n);
  const spot = spotPrice(state);
  if (spot === 0) return 0;
  return Math.max(0, Math.round(((spot - execPrice) / spot) * 10_000));
}

/** Apply slippage tolerance (bps) to a quoted output for min-out params. */
export function applySlippage(quoted: bigint, slippageBps: number): bigint {
  return (quoted * (BPS - BigInt(Math.round(slippageBps)))) / BPS;
}

/** Graduation progress in bps from a real HOODIE reserve. */
export function progressBpsOf(realHoodieReserve: bigint): number {
  const bps = (realHoodieReserve * BPS) / GRADUATION_THRESHOLD;
  return Number(bps > BPS ? BPS : bps);
}

/** HOODIE remaining until graduation. */
export function hoodieToGraduation(realHoodieReserve: bigint): bigint {
  return realHoodieReserve >= GRADUATION_THRESHOLD
    ? 0n
    : GRADUATION_THRESHOLD - realHoodieReserve;
}
