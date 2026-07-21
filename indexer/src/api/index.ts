import { db } from "ponder:api";
import schema from "ponder:schema";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { and, desc, eq } from "ponder";

const app = new Hono();

app.use("/*", cors({ origin: "*" }));

/** JSON.stringify cannot handle bigints — serialize them as decimal strings. */
const json = (value: unknown) =>
  JSON.parse(
    JSON.stringify(value, (_key, v) => (typeof v === "bigint" ? v.toString() : v)),
  ) as object;

const parseLimit = (raw: string | undefined, fallback: number, max: number) => {
  const n = Number(raw ?? fallback);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(Math.floor(n), max);
};

const isAddress = (value: string): value is `0x${string}` =>
  /^0x[0-9a-fA-F]{40}$/.test(value);

const TIMEFRAMES = new Set(["1m", "5m", "1h", "1d"]);

/** GET /api/launchers?sort=volume|new — list launchers. */
app.get("/api/launchers", async (c) => {
  const sort = c.req.query("sort") ?? "volume";
  const limit = parseLimit(c.req.query("limit"), 100, 500);

  const rows = await db
    .select()
    .from(schema.launchers)
    .orderBy(
      sort === "new"
        ? desc(schema.launchers.createdAt)
        : desc(schema.launchers.volumeHoodie),
    )
    .limit(limit);

  return c.json(json(rows));
});

/** GET /api/launchers/:slug — a single launcher by slug. */
app.get("/api/launchers/:slug", async (c) => {
  const slug = c.req.param("slug");

  const [row] = await db
    .select()
    .from(schema.launchers)
    .where(eq(schema.launchers.slug, slug))
    .limit(1);

  if (row === undefined) return c.json({ error: "launcher not found" }, 404);

  // Include this launcher's tokens for convenience.
  const launcherTokens = await db
    .select()
    .from(schema.tokens)
    .where(eq(schema.tokens.launcherId, row.id))
    .orderBy(desc(schema.tokens.volumeHoodie))
    .limit(200);

  return c.json(json({ ...row, tokens: launcherTokens }));
});

/** GET /api/tokens/:address — a single token. */
app.get("/api/tokens/:address", async (c) => {
  const address = c.req.param("address").toLowerCase();
  if (!isAddress(address)) return c.json({ error: "invalid address" }, 400);

  const [row] = await db
    .select()
    .from(schema.tokens)
    .where(eq(schema.tokens.address, address))
    .limit(1);

  if (row === undefined) return c.json({ error: "token not found" }, 404);
  return c.json(json(row));
});

/** GET /api/tokens/:address/candles?tf=1m|5m|1h|1d&limit= — OHLCV, ascending. */
app.get("/api/tokens/:address/candles", async (c) => {
  const address = c.req.param("address").toLowerCase();
  if (!isAddress(address)) return c.json({ error: "invalid address" }, 400);

  const tf = c.req.query("tf") ?? "1h";
  if (!TIMEFRAMES.has(tf)) {
    return c.json({ error: "tf must be one of 1m|5m|1h|1d" }, 400);
  }
  const limit = parseLimit(c.req.query("limit"), 300, 1000);

  // Fetch the most recent buckets, then return them oldest-first.
  const rows = await db
    .select()
    .from(schema.candles)
    .where(and(eq(schema.candles.token, address), eq(schema.candles.tf, tf)))
    .orderBy(desc(schema.candles.bucketStart))
    .limit(limit);

  return c.json(json(rows.reverse()));
});

/** GET /api/tokens/:address/trades?limit= — most recent trades first. */
app.get("/api/tokens/:address/trades", async (c) => {
  const address = c.req.param("address").toLowerCase();
  if (!isAddress(address)) return c.json({ error: "invalid address" }, 400);

  const limit = parseLimit(c.req.query("limit"), 50, 500);

  const rows = await db
    .select()
    .from(schema.trades)
    .where(eq(schema.trades.token, address))
    .orderBy(desc(schema.trades.timestamp))
    .limit(limit);

  return c.json(json(rows));
});

/** GET /api/tokens/:address/holders — top 10 holders by balance. */
app.get("/api/tokens/:address/holders", async (c) => {
  const address = c.req.param("address").toLowerCase();
  if (!isAddress(address)) return c.json({ error: "invalid address" }, 400);

  const rows = await db
    .select()
    .from(schema.holders)
    .where(eq(schema.holders.token, address))
    .orderBy(desc(schema.holders.balance))
    .limit(10);

  return c.json(json(rows));
});

export default app;
