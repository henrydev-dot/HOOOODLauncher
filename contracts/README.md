# HOODIEPAD Contracts

Solidity 0.8.24+ / Foundry. One **shared** contract set serves every launcher — a launcher is an on-chain registry record, not a deployment. All economic flows are denominated in **$HOODIE** (`0xC72c01AAB5f5678dc1d6f5C6d2B417d91D402Ba3`).

## Contracts

| Contract | Role |
|---|---|
| `LauncherRegistry` | Launcher records (slug, owner, fee recipient, fee bps, anti-sniper flag) + all protocol parameters, bounded and admin-tunable behind `Ownable2Step` + `Timelock48` (48h). |
| `TokenFactory` | Deploys `LaunchToken` EIP-1167 clones. Full 1B supply minted to the curve; optional atomic dev buy. |
| `LaunchToken` | Pure ERC-20: no owner, no mint, no tax, fixed 1,000,000,000e18 supply. |
| `BondingCurve` | HOODIE-based x·y=k virtual-reserve curve (pump.fun model). Price derives only from curve state — no oracles. All rounding favors the curve (k never decreases). |
| `GraduationManager` | Permissionless `graduate()` once the curve closes: takes graduation fee + caller incentive, creates the Uniswap V2 TOKEN/HOODIE pool, burns 100% of LP to `0xdead` (or 12-month lock via `lpMode`), burns leftover inventory. Router/factory are constructor params → L2-portable. |
| `FeeSplitter` | Pull-payment fee escrow (`claim()`); no push payments during trades. |
| `Timelock48` | Minimal 48h queue/execute/cancel timelock that owns the registry in production. |

## Default parameters (per spec, admin-tunable within hard caps)

| Parameter | Default | Hard cap |
|---|---|---|
| Launcher creation fee | 50,000 HOODIE → treasury | 10M |
| Token creation fee | 500 HOODIE → 50% platform / 50% launcher | 100k |
| Trade fee | 1% (launcher share `launcherFeeBps`, rest platform) | 3% total, launcher ≤ 1% |
| Graduation fee | 2% of collected HOODIE | 5% |
| Graduate caller incentive | 0.05% | 1% |
| Graduation threshold | 85,000,000 HOODIE real reserve | — |
| Virtual reserves | 300M HOODIE / 1,073M tokens | — |
| Curve sale supply | 793.1M (79.31%); 206.9M reserved for LP | — |

Curve parameters are **snapshotted per token at creation** — an admin change never moves the goalposts of a live token. With the default virtual reserves the 85M threshold closes the curve after ~237M tokens sold; the unsold remainder is burned at graduation, so the LP allocation stays exactly 206.9M. **Calibrate `graduationThreshold` and `virtualHoodieReserve0` against the live HOODIE price before mainnet deploy** (Faz 7).

## Security properties

- `ReentrancyGuard` on all state-changing externals; strict CEI ordering.
- `SafeERC20` everywhere; HOODIE amounts are measured `balanceBefore/After` on receipt (defensive vs fee-on-transfer), and `FeeSplitter.claim` is balance-capped so a taxed HOODIE degrades gracefully instead of bricking.
- Rounding always favors the curve: invariant `virtualHoodie * virtualToken` is non-decreasing ⇒ the curve can always cover sells (fuzz-tested).
- Tokens are rug-proof by construction: no mint, no owner, LP burned.
- Anti-sniper (per-launcher toggle): first 2 blocks after token creation, max 1% of supply per wallet.
- Contracts are **not upgradeable**; parameters only move within hard-capped ranges through the 48h timelock.
- Known accepted edge: a griefer pre-seeding the Uniswap pair before graduation only donates value to the burned LP (`amountMin = 0` rationale documented in `GraduationManager`).

## Dependency policy

`src/vendor/` contains small, self-contained OpenZeppelin-style primitives (IERC20, SafeERC20, ReentrancyGuard, Ownable2Step, Clones) so the repo builds with a bare `forge build` — no submodules, no remappings. The test suite likewise uses a minimal cheatcode interface instead of forge-std.

## Build & test

```bash
forge build
forge test -vv          # unit + fuzz (512 runs)
FOUNDRY_PROFILE=ci forge test   # 10k fuzz runs
```

Deploy (testnet example — omit `HOODIE` to auto-deploy a `MockHoodie`):

```bash
TREASURY=0x... UNIV2_FACTORY=0x... UNIV2_ROUTER=0x... \
forge script script/Deploy.s.sol --rpc-url $RPC --broadcast
```

## Faz 0 research note (HOODIE token due diligence)

The spec requires verifying on Etherscan, before mainnet deploy: which network `0xC72c01AAB5f5678dc1d6f5C6d2B417d91D402Ba3` actually lives on, its `decimals`, whether it is fee-on-transfer, pausable, or upgradeable. This could not be performed from the development sandbox (no Etherscan access) — **it is a hard prerequisite for Faz 7 / mainnet**. The contracts assume 18 decimals and are defensive against fee-on-transfer; a pausable/blocklisting HOODIE would freeze trading but cannot steal curve funds.

## Fork tests (Faz 2 acceptance)

Mainnet-fork graduation tests against the real HOODIE + Uniswap V2 need an archive RPC:

```bash
forge test --fork-url $MAINNET_RPC --match-contract Fork
```

The unit suite covers the same path against `MockUniswapV2`; add `test/fork/` once an RPC endpoint is available in CI secrets.
