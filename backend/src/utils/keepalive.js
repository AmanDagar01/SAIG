import https from 'https';
import { logger } from './logger.js';

export function startKeepAlive(url) {
  if (!url) return;

  // Ping every 14 minutes to prevent Render free tier sleep
  setInterval(() => {
    https.get(url, (res) => {
      logger.debug(`Keep-alive ping: ${res.statusCode}`);
    }).on('error', (err) => {
      logger.debug(`Keep-alive ping failed: ${err.message}`);
    });
  }, 14 * 60 * 1000); // 14 minutes

  logger.info(`Keep-alive enabled for ${url}`);
}