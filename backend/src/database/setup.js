import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__dirname, __filename);

let db = null;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  event_datetime_utc TEXT NOT NULL,
  ingested_at TEXT NOT NULL DEFAULT (datetime('now')),
  source_name TEXT NOT NULL,
  source_url TEXT,
  source_type TEXT NOT NULL,
  source_reliability_score INTEGER DEFAULT 5,
  claim_text TEXT NOT NULL,
  title TEXT,
  country TEXT,
  location_text TEXT,
  lat REAL,
  lng REAL,
  geo_method TEXT,
  actor_1 TEXT,
  actor_2 TEXT,
  event_type TEXT,
  domain TEXT,
  severity_score INTEGER DEFAULT 5,
  confidence_score INTEGER DEFAULT 5,
  verification_status TEXT DEFAULT 'unverified',
  tags TEXT DEFAULT '[]',
  raw_data TEXT,
  content_hash TEXT UNIQUE,
  duplicate_of TEXT,
  last_updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  url TEXT,
  type TEXT NOT NULL,
  reliability_score INTEGER DEFAULT 5,
  reliability_tier INTEGER DEFAULT 5,
  last_fetched_at TEXT,
  total_events INTEGER DEFAULT 0,
  active INTEGER DEFAULT 1,
  config TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ingestion_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id TEXT,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  status TEXT NOT NULL DEFAULT 'running',
  events_fetched INTEGER DEFAULT 0,
  events_new INTEGER DEFAULT 0,
  events_duplicate INTEGER DEFAULT 0,
  events_error INTEGER DEFAULT 0,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_events_datetime ON events(event_datetime_utc DESC);
CREATE INDEX IF NOT EXISTS idx_events_country ON events(country);
CREATE INDEX IF NOT EXISTS idx_events_domain ON events(domain);
CREATE INDEX IF NOT EXISTS idx_events_severity ON events(severity_score DESC);
CREATE INDEX IF NOT EXISTS idx_events_verification ON events(verification_status);
CREATE INDEX IF NOT EXISTS idx_events_source ON events(source_name);
CREATE INDEX IF NOT EXISTS idx_events_content_hash ON events(content_hash);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_actor1 ON events(actor_1);
`;

export async function initDatabase() {
  const SQL = await initSqlJs();

  const dataDir = path.resolve(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const logsDir = path.resolve(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, 'osint.db');

  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
    logger.info(`Database loaded from ${dbPath}`);
  } else {
    db = new SQL.Database();
    logger.info('Created new in-memory database');
  }

  db.run("PRAGMA journal_mode=WAL");
  db.run("PRAGMA busy_timeout=5000");
  db.run("PRAGMA foreign_keys=ON");

  db.run(SCHEMA);

  saveDatabase();
  logger.info('Database initialized');
  return db;
}

export function saveDatabase() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  const dbPath = path.resolve(process.cwd(), 'data', 'osint.db');
  fs.writeFileSync(dbPath, buffer);
}

export function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

// Auto-save every 30 seconds
setInterval(() => {
  if (db) {
    try {
      saveDatabase();
    } catch (e) {
      logger.error('Auto-save failed:', e.message);
    }
  }
}, 30000);