import crypto from 'crypto';
import { getEventByHash } from '../../database/queries.js';
import { logger } from '../../utils/logger.js';

/**
 * Generate a content hash for deduplication
 * Uses title + URL as primary, falls back to description similarity
 */
export function generateContentHash(title, description, url) {
  // Primary: URL-based hash (same URL = same article)
  if (url && url.length > 10) {
    // Normalize URL
    const normalizedUrl = url
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '')
      .replace(/[?#].*$/, '')
      .toLowerCase();
    return crypto.createHash('sha256').update(normalizedUrl).digest('hex').substring(0, 32);
  }

  // Fallback: title + first 100 chars of description
  const normalizedTitle = (title || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  const normalizedDesc = (description || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').substring(0, 100).trim();
  const content = `${normalizedTitle}|${normalizedDesc}`;

  return crypto.createHash('sha256').update(content).digest('hex').substring(0, 32);
}

/**
 * Check if an event already exists (is duplicate)
 */
export function isDuplicate(contentHash) {
  const existing = getEventByHash(contentHash);
  return existing ? existing.id : null;
}

/**
 * Deduplicate a batch of events
 * Returns only non-duplicate events
 */
export function deduplicateBatch(events) {
  const seen = new Set();
  const unique = [];
  let duplicateCount = 0;

  for (const event of events) {
    // Check against batch duplicates
    if (seen.has(event.content_hash)) {
      duplicateCount++;
      continue;
    }

    // Check against database
    const existingId = isDuplicate(event.content_hash);
    if (existingId) {
      event.duplicate_of = existingId;
      duplicateCount++;
      continue;
    }

    seen.add(event.content_hash);
    unique.push(event);
  }

  logger.info(`Deduplication: ${events.length} input → ${unique.length} unique, ${duplicateCount} duplicates`);
  return { unique, duplicateCount };
}