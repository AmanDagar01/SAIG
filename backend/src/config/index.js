import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..', '..');

export const config = {
  port: parseInt(process.env.PORT || '3001'),
  env: process.env.NODE_ENV || 'development',
  db: {
    path: path.resolve(ROOT_DIR, process.env.DB_PATH || './data/osint.db'),
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },
  gdelt: {
    apiUrl: process.env.GDELT_API_URL,
    fetchInterval: parseInt(process.env.GDELT_FETCH_INTERVAL_MINUTES || '30'),
  },
  acled: {
    apiUrl: process.env.ACLED_API_URL,
    apiKey: process.env.ACLED_API_KEY || '',
    email: process.env.ACLED_EMAIL || '',
  },
  rss: {
    fetchInterval: parseInt(process.env.RSS_FETCH_INTERVAL_MINUTES || '15'),
  },
  logLevel: process.env.LOG_LEVEL || 'info',
};