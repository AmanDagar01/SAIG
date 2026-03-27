import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function setupDatabase() {
  // Ensure data directory exists
  const dataDir = path.dirname(config.db.path);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    logger.info(`Created data directory: ${dataDir}`);
  }

  // Ensure logs directory exists
  const logsDir = path.resolve(path.dirname(__dirname), '..', 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  const db = new Database(config.db.path);

  // Enable WAL mode for better concurrent performance
  db.pragma('journal_mode = WAL');
  db.pragma('busy_timeout = 5000');
  db.pragma('foreign_keys = ON');

  // Read and execute schema
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schema);

  logger.info(`Database initialized at ${config.db.path}`);
  return db;
}

// Singleton
let dbInstance = null;

export function getDb() {
  if (!dbInstance) {
    dbInstance = setupDatabase();
  }
  return dbInstance;
}

// Run directly
if (process.argv[1] && process.argv[1].includes('setup.js')) {
  setupDatabase();
  logger.info('Database setup complete');
  process.exit(0);
}