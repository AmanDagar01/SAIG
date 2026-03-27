import cron from 'node-cron';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { getDb } from '../database/setup.js';
import { insertEventsBatch, upsertSource, updateSourceFetchTime, logIngestion } from '../database/queries.js';
import { fetchRssFeeds, RSS_FEEDS } from './sources/rssFeeds.js';
import { fetchGdeltData } from './sources/gdeltCollector.js';
import { fetchAcledData } from './sources/acledCollector.js';
import { normalizeArticles } from './processors/normalizer.js';
import { deduplicateBatch } from './processors/deduplicator.js';

let isRunning = false;

/**
 * Register all data sources in the database
 */
function registerSources() {
  // RSS feeds
  for (const feed of RSS_FEEDS) {
    upsertSource({
      id: uuidv4(),
      name: feed.name,
      url: feed.url,
      type: feed.type,
      reliability_score: feed.reliability.score,
      reliability_tier: feed.reliability.tier,
      config: { url: feed.url, backupUrl: feed.backupUrl },
    });
  }

  // GDELT
  upsertSource({
    id: uuidv4(),
    name: 'GDELT Project',
    url: config.gdelt.apiUrl,
    type: 'gdelt',
    reliability_score: 6,
    reliability_tier: 3,
    config: {},
  });

  // ACLED
  upsertSource({
    id: uuidv4(),
    name: 'ACLED',
    url: config.acled.apiUrl,
    type: 'conflict_database',
    reliability_score: 8,
    reliability_tier: 2,
    config: {},
  });

  logger.info('All data sources registered');
}

/**
 * Run a complete ingestion cycle
 */
export async function runIngestionCycle() {
  if (isRunning) {
    logger.warn('Ingestion cycle already in progress - skipping');
    return;
  }

  isRunning = true;
  const startTime = new Date().toISOString();
  const cycleId = uuidv4().substring(0, 8);

  logger.info(`=== Ingestion Cycle ${cycleId} START ===`);

  const results = {
    totalFetched: 0,
    totalNew: 0,
    totalDuplicate: 0,
    totalErrors: 0,
    sources: [],
  };

  try {
    // ---- 1. Collect from all sources ----
    const allArticles = [];

    // RSS Feeds
    try {
      const rssArticles = await fetchRssFeeds();
      allArticles.push(...rssArticles);
      results.sources.push({ name: 'RSS Feeds', count: rssArticles.length, status: 'ok' });
    } catch (err) {
      logger.error(`RSS collection failed: ${err.message}`);
      results.sources.push({ name: 'RSS Feeds', count: 0, status: 'error', error: err.message });
      results.totalErrors++;
    }

    // GDELT
    try {
      const gdeltArticles = await fetchGdeltData();
      allArticles.push(...gdeltArticles);
      results.sources.push({ name: 'GDELT', count: gdeltArticles.length, status: 'ok' });
    } catch (err) {
      logger.error(`GDELT collection failed: ${err.message}`);
      results.sources.push({ name: 'GDELT', count: 0, status: 'error', error: err.message });
      results.totalErrors++;
    }

    // ACLED
    try {
      const acledEvents = await fetchAcledData();
      allArticles.push(...acledEvents);
      results.sources.push({ name: 'ACLED', count: acledEvents.length, status: 'ok' });
    } catch (err) {
      logger.error(`ACLED collection failed: ${err.message}`);
      results.sources.push({ name: 'ACLED', count: 0, status: 'error', error: err.message });
      results.totalErrors++;
    }

    results.totalFetched = allArticles.length;
    logger.info(`Total articles collected: ${allArticles.length}`);

    if (allArticles.length === 0) {
      logger.warn('No articles collected in this cycle');
      isRunning = false;
      return results;
    }

    // ---- 2. Normalize ----
    logger.info('Normalizing articles...');
    const normalizedEvents = normalizeArticles(allArticles);
    logger.info(`Normalized: ${normalizedEvents.length} events`);

    // ---- 3. Deduplicate ----
    logger.info('Deduplicating...');
    const { unique, duplicateCount } = deduplicateBatch(normalizedEvents);
    results.totalDuplicate = duplicateCount;
    logger.info(`After dedup: ${unique.length} unique events`);

    // ---- 4. Insert into database ----
    if (unique.length > 0) {
      logger.info('Inserting into database...');
      const insertResult = insertEventsBatch(unique);
      results.totalNew = insertResult.inserted;
      results.totalDuplicate += insertResult.duplicates;
      logger.info(`Inserted: ${insertResult.inserted} new, ${insertResult.duplicates} db-duplicates`);
    }

    // ---- 5. Update source fetch times ----
    const sourceNames = [...new Set(allArticles.map(a => a.source_feed))];
    for (const name of sourceNames) {
      try {
        updateSourceFetchTime(name);
      } catch {}
    }

    // ---- 6. Log ingestion ----
    logIngestion({
      source_id: 'all',
      started_at: startTime,
      completed_at: new Date().toISOString(),
      status: 'completed',
      events_fetched: results.totalFetched,
      events_new: results.totalNew,
      events_duplicate: results.totalDuplicate,
      events_error: results.totalErrors,
    });

  } catch (error) {
    logger.error(`Ingestion cycle failed: ${error.message}`, { stack: error.stack });

    logIngestion({
      source_id: 'all',
      started_at: startTime,
      completed_at: new Date().toISOString(),
      status: 'failed',
      events_fetched: results.totalFetched,
      events_new: results.totalNew,
      events_duplicate: results.totalDuplicate,
      events_error: results.totalErrors + 1,
      error_message: error.message,
    });
  } finally {
    isRunning = false;
  }

  logger.info(`=== Ingestion Cycle ${cycleId} END ===`);
  logger.info(`Results: ${results.totalFetched} fetched, ${results.totalNew} new, ${results.totalDuplicate} duplicates, ${results.totalErrors} errors`);

  return results;
}

/**
 * Start scheduled ingestion
 */
export function startScheduledIngestion() {
  // Initialize database and register sources
  getDb();
  registerSources();

  // Run immediately on start
  logger.info('Running initial ingestion cycle...');
  runIngestionCycle().catch(err => logger.error(`Initial ingestion failed: ${err.message}`));

  // Schedule RSS feeds every 15 minutes
  cron.schedule(`*/${config.rss.fetchInterval} * * * *`, () => {
    logger.info('Scheduled ingestion cycle triggered');
    runIngestionCycle().catch(err => logger.error(`Scheduled ingestion failed: ${err.message}`));
  });

  logger.info(`Ingestion scheduled: every ${config.rss.fetchInterval} minutes`);
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