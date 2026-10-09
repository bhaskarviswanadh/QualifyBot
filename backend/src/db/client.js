import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { settings } from '../config/settings.js';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

let pool = null;
let mode = 'memory'; // 'neon' | 'memory'

export function getDbMode() {
  return mode;
}

export function isDbEnabled() {
  return Boolean(pool);
}

export async function initDb() {
  const url = settings.databaseUrl;
  if (!url) {
    mode = 'memory';
    console.log('[db] DATABASE_URL not set — using local in-memory + file history');
    return null;
  }

  pool = new Pool({
    connectionString: url,
    ssl: url.includes('sslmode=require') || url.includes('neon.tech')
      ? { rejectUnauthorized: false }
      : undefined,
  });

  try {
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
    await pool.query(schema);
    mode = 'neon';
    console.log('[db] Connected to Neon Postgres — chat history enabled');
    return pool;
  } catch (err) {
    console.error('[db] Failed to connect — falling back to memory:', err.message);
    try {
      await pool.end();
    } catch {
      /* ignore */
    }
    pool = null;
    mode = 'memory';
    return null;
  }
}

export function getPool() {
  return pool;
}

export async function query(text, params) {
  if (!pool) throw new Error('Database not connected');
  return pool.query(text, params);
}
