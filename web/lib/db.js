import pg from "pg";

const g = globalThis;
export function db() {
  if (!g.__pgPool) {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set in .env");
    g.__pgPool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  }
  return g.__pgPool;
}

// Off-chain layer: readable details live here. The chain only ever sees the hash.
export function ensureSchema() {
  g.__schemaReady ??= db().query(`
    CREATE TABLE IF NOT EXISTS firs (
      id          BIGSERIAL PRIMARY KEY,
      status      TEXT NOT NULL DEFAULT 'PENDING',
      record      JSONB NOT NULL,
      evidence    JSONB NOT NULL DEFAULT '[]',
      salt        TEXT NOT NULL,
      doc_hash    TEXT NOT NULL DEFAULT '',
      tx_hash     TEXT,
      officer     TEXT,
      anchored_at TIMESTAMPTZ,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);
  return g.__schemaReady;
}
