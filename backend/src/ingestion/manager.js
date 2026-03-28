import cron from 'node-cron';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { insertEventsBatch, upsertSource, updateSourceFetchTime, logIngestion, getDb } from '../database/queries.js';
import { fetchRssFeeds, RSS_FEEDS } from './sources/rssFeeds.js';
import { fetchGdeltData } from './sources/gdeltCollector.js';
import { fetchAcledData } from './sources/acledCollector.js';
import { normalizeArticles } from './processors/normalizer.js';
import { deduplicateBatch } from './processors/deduplicator.js';

let isRunning = false;

function registerSources() {
  for (const feed of RSS_FEEDS) {
    upsertSource({
      id: uuidv4(), name: feed.name, url: feed.url,
      type: feed.type, reliability_score: feed.reliability.score,
      reliability_tier: feed.reliability.tier, config: { url: feed.url },
    });
  }
  upsertSource({ id: uuidv4(), name: 'GDELT Project', url: config.gdelt.apiUrl, type: 'gdelt', reliability_score: 6, reliability_tier: 3 });
  upsertSource({ id: uuidv4(), name: 'ACLED', url: config.acled.apiUrl, type: 'conflict_database', reliability_score: 8, reliability_tier: 2 });
  logger.info('All data sources registered');
}

export async function runIngestionCycle() {
  if (isRunning) { logger.warn('Ingestion already running'); return; }
  isRunning = true;
  const startTime = new Date().toISOString();
  const results = { totalFetched: 0, totalNew: 0, totalDuplicate: 0, totalErrors: 0 };

  try {
    const allArticles = [];

    try {
      const rss = await fetchRssFeeds();
      allArticles.push(...rss);
    } catch (e) { logger.error(`RSS failed: ${e.message}`); results.totalErrors++; }

    try {
      const gdelt = await fetchGdeltData();
      allArticles.push(...gdelt);
    } catch (e) { logger.error(`GDELT failed: ${e.message}`); results.totalErrors++; }

    try {
      const acled = await fetchAcledData();
      allArticles.push(...acled);
    } catch (e) { logger.error(`ACLED failed: ${e.message}`); }

    results.totalFetched = allArticles.length;
    if (allArticles.length === 0) { isRunning = false; return results; }

    const normalized = normalizeArticles(allArticles);
    const { unique, duplicateCount } = deduplicateBatch(normalized);
    results.totalDuplicate = duplicateCount;

    if (unique.length > 0) {
      const insertResult = insertEventsBatch(unique);
      results.totalNew = insertResult.inserted;
    }

    logIngestion({
      source_id: 'all', started_at: startTime, completed_at: new Date().toISOString(),
      status: 'completed', events_fetched: results.totalFetched,
      events_new: results.totalNew, events_duplicate: results.totalDuplicate,
      events_error: results.totalErrors,
    });

  } catch (error) {
    logger.error(`Ingestion failed: ${error.message}`);
    logIngestion({
      source_id: 'all', started_at: startTime, completed_at: new Date().toISOString(),
      status: 'failed', events_fetched: results.totalFetched, events_error: results.totalErrors + 1,
      error_message: error.message,
    });
  } finally {
    isRunning = false;
  }

  logger.info(`Ingestion done: ${results.totalFetched} fetched, ${results.totalNew} new, ${results.totalDuplicate} dupes`);
  return results;
}

export function startScheduledIngestion() {
  registerSources();
  runIngestionCycle().catch(e => logger.error(`Initial ingestion failed: ${e.message}`));
  cron.schedule(`*/${config.rss.fetchInterval} * * * *`, () => {
    runIngestionCycle().catch(e => logger.error(`Scheduled ingestion failed: ${e.message}`));
  });
  logger.info(`Ingestion scheduled every ${config.rss.fetchInterval} minutes`);
}

// Allow running as standalone script
if (process.argv.includes('--run-once')) {
  getDb();
  registerSources();
  runIngestionCycle()
    .then(results => {
      logger.info('One-time ingestion complete', results);
      process.exit(0);
    })
    .catch(err => {
      logger.error(`Ingestion failed: ${err.message}`);
      process.exit(1);
    });
}