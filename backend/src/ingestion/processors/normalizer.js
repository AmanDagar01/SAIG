import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger.js';
import { SOURCE_RELIABILITY } from '../../utils/constants.js';
import { geolocateFromText } from '../../utils/geolocator.js';
import { extractEntities } from './entityExtractor.js';
import { calculateScores } from './scorer.js';
import { generateContentHash } from './deduplicator.js';

/**
 * Normalize raw articles from any source into standard event format
 */
export function normalizeArticle(article) {
  try {
    const id = uuidv4();
    const now = new Date().toISOString();

    // Combine text for analysis
    const fullText = `${article.title || ''} ${article.description || ''}`;

    // Extract entities (actors, event types, locations)
    const entities = extractEntities(fullText);

    // Use pre-extracted data from structured sources (like ACLED) if available
    const preExtracted = article.pre_extracted || {};

    // Determine source reliability
    const sourceName = article.original_source || article.source_feed;
    const reliability = article.source_reliability ||
      SOURCE_RELIABILITY[sourceName] ||
      SOURCE_RELIABILITY['unknown'];

    // Geolocate
    const locationText = preExtracted.location_text || entities.location || '';
    const geo = (preExtracted.lat && preExtracted.lng)
      ? {
          lat: preExtracted.lat,
          lng: preExtracted.lng,
          country: preExtracted.country,
          method: 'source_provided',
        }
      : geolocateFromText(`${locationText} ${fullText}`);

    // Determine country
    const country = preExtracted.country || geo?.country || entities.country || null;

    // Calculate scores
    const scores = calculateScores({
      text: fullText,
      source_reliability: reliability.score,
      has_geo: !!geo,
      entities,
      fatalities: preExtracted.fatalities || 0,
    });

    // Determine verification status based on source tier
    let verificationStatus = 'unverified';
    if (reliability.tier <= 2 && reliability.score >= 7) {
      verificationStatus = 'verified';
    } else if (reliability.tier >= 4 || reliability.score <= 3) {
      verificationStatus = 'rumor';
    }

    // Generate content hash for deduplication
    const contentHash = generateContentHash(
      article.title || '',
      article.description || '',
      article.url || ''
    );

    // Parse and validate datetime
    let eventDatetime;
    try {
      const parsed = new Date(article.published);
      eventDatetime = isNaN(parsed.getTime()) ? now : parsed.toISOString();
    } catch {
      eventDatetime = now;
    }

    // Build normalized event
    const normalizedEvent = {
      id,
      event_datetime_utc: eventDatetime,
      source_name: sourceName,
      source_url: article.url || null,
      source_type: article.source_type || 'unknown',
      source_reliability_score: reliability.score,
      claim_text: (article.description || article.title || '').substring(0, 3000),
      title: (article.title || '').substring(0, 500),
      country,
      location_text: locationText || null,
      lat: geo?.lat || null,
      lng: geo?.lng || null,
      geo_method: geo?.method || null,
      actor_1: preExtracted.actor_1 || entities.actor_1 || null,
      actor_2: preExtracted.actor_2 || entities.actor_2 || null,
      event_type: preExtracted.event_type || entities.event_type || null,
      domain: preExtracted.domain || entities.domain || null,
      severity_score: scores.severity,
      confidence_score: scores.confidence,
      verification_status: verificationStatus,
      tags: [...new Set([
        ...(entities.tags || []),
        ...(scores.tags || []),
        article.source_type,
      ])].filter(Boolean).slice(0, 15),
      raw_data: article.raw || null,
      content_hash: contentHash,
      last_updated_at: now,
    };

    return normalizedEvent;

  } catch (error) {
    logger.error(`Normalization failed: ${error.message}`, { title: article.title });
    return null;
  }
}

/**
 * Normalize a batch of articles
 */
export function normalizeArticles(articles) {
  const normalized = [];
  let errors = 0;

  for (const article of articles) {
    const event = normalizeArticle(article);
    if (event) {
      normalized.push(event);
    } else {
      errors++;
    }
  }

  logger.info(`Normalized ${normalized.length}/${articles.length} articles (${errors} errors)`);
  return normalized;
}