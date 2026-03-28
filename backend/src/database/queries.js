import { getDb, saveDatabase } from './setup.js';
import { logger } from '../utils/logger.js';

// ---- Helper: Run SELECT and return rows ----
function selectAll(sql, params = []) {
  const db = getDb();
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

// ---- Helper: Run SELECT and return one row ----
function selectOne(sql, params = []) {
  const rows = selectAll(sql, params);
  return rows[0] || null;
}

// ---- Helper: Run INSERT/UPDATE/DELETE ----
function runSql(sql, params = []) {
  const db = getDb();
  db.run(sql, params);
  saveDatabase();
}

// ---- Helper: Escape single quotes ----
function esc(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/'/g, "''");
}

// ---- EVENTS ----

export function insertEvent(event) {
  try {
    const sql = `
      INSERT OR IGNORE INTO events (
        id, event_datetime_utc, source_name, source_url, source_type,
        source_reliability_score, claim_text, title, country, location_text,
        lat, lng, geo_method, actor_1, actor_2, event_type, domain,
        severity_score, confidence_score, verification_status, tags,
        raw_data, content_hash, last_updated_at
      ) VALUES (
        '${esc(event.id)}',
        '${esc(event.event_datetime_utc)}',
        '${esc(event.source_name)}',
        '${esc(event.source_url)}',
        '${esc(event.source_type)}',
        ${event.source_reliability_score || 5},
        '${esc(event.claim_text)}',
        '${esc(event.title || '')}',
        '${esc(event.country || '')}',
        '${esc(event.location_text || '')}',
        ${event.lat || 'NULL'},
        ${event.lng || 'NULL'},
        '${esc(event.geo_method || '')}',
        '${esc(event.actor_1 || '')}',
        '${esc(event.actor_2 || '')}',
        '${esc(event.event_type || '')}',
        '${esc(event.domain || '')}',
        ${event.severity_score || 5},
        ${event.confidence_score || 5},
        '${esc(event.verification_status || 'unverified')}',
        '${esc(JSON.stringify(event.tags || []))}',
        '${esc(event.raw_data ? JSON.stringify(event.raw_data) : '')}',
        '${esc(event.content_hash)}',
        '${esc(event.last_updated_at || new Date().toISOString())}'
      )
    `;
    runSql(sql);
    return true;
  } catch (e) {
    if (e.message && e.message.includes('UNIQUE constraint')) {
      return false;
    }
    logger.error(`insertEvent error: ${e.message}`);
    return false;
  }
}

export function insertEventsBatch(events) {
  let inserted = 0;
  let duplicates = 0;
  for (const event of events) {
    const result = insertEvent(event);
    if (result) inserted++;
    else duplicates++;
  }
  return { inserted, duplicates };
}

export function getEvents({
  limit = 50,
  offset = 0,
  sortBy = 'event_datetime_utc',
  sortOrder = 'DESC',
  country,
  domain,
  eventType,
  verification,
  minSeverity,
  sourceType,
  search,
  actor,
} = {}) {
  const conditions = [];
  const safeSort = ['event_datetime_utc', 'severity_score', 'confidence_score', 'ingested_at', 'source_name'].includes(sortBy)
    ? sortBy : 'event_datetime_utc';
  const safeOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  if (country && country !== 'all') conditions.push(`country = '${esc(country)}'`);
  if (domain && domain !== 'all') conditions.push(`domain = '${esc(domain)}'`);
  if (eventType && eventType !== 'all') conditions.push(`event_type = '${esc(eventType)}'`);
  if (verification && verification !== 'all') conditions.push(`verification_status = '${esc(verification)}'`);
  if (minSeverity && minSeverity > 0) conditions.push(`severity_score >= ${parseInt(minSeverity)}`);
  if (sourceType && sourceType !== 'all') conditions.push(`source_type = '${esc(sourceType)}'`);
  if (actor) conditions.push(`(actor_1 LIKE '%${esc(actor)}%' OR actor_2 LIKE '%${esc(actor)}%')`);
  if (search) {
    const s = esc(search);
    conditions.push(`(claim_text LIKE '%${s}%' OR title LIKE '%${s}%' OR location_text LIKE '%${s}%' OR actor_1 LIKE '%${s}%' OR actor_2 LIKE '%${s}%' OR tags LIKE '%${s}%')`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const totalRow = selectOne(`SELECT COUNT(*) as total FROM events ${whereClause}`);
  const total = totalRow ? totalRow.total : 0;

  const events = selectAll(
    `SELECT * FROM events ${whereClause} ORDER BY ${safeSort} ${safeOrder} LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`
  );

  const parsed = events.map(e => ({
    ...e,
    tags: JSON.parse(e.tags || '[]'),
    raw_data: e.raw_data ? JSON.parse(e.raw_data) : null,
  }));

  return {
    events: parsed,
    total,
    limit: parseInt(limit),
    offset: parseInt(offset),
    hasMore: parseInt(offset) + parseInt(limit) < total,
  };
}

export function getEventById(id) {
  const event = selectOne(`SELECT * FROM events WHERE id = '${esc(id)}'`);
  if (!event) return null;
  return {
    ...event,
    tags: JSON.parse(event.tags || '[]'),
    raw_data: event.raw_data ? JSON.parse(event.raw_data) : null,
  };
}

export function getEventByHash(hash) {
  return selectOne(`SELECT id FROM events WHERE content_hash = '${esc(hash)}'`);
}

export function getDistinctValues(field) {
  const allowed = ['country', 'domain', 'event_type', 'source_name', 'source_type', 'actor_1', 'verification_status'];
  if (!allowed.includes(field)) return [];
  return selectAll(
    `SELECT DISTINCT ${field} as value, COUNT(*) as count FROM events WHERE ${field} IS NOT NULL AND ${field} != '' GROUP BY ${field} ORDER BY count DESC`
  );
}

// ---- STATS ----

export function getDashboardStats() {
  const total = selectOne('SELECT COUNT(*) as count FROM events');
  const last24h = selectOne("SELECT COUNT(*) as count FROM events WHERE event_datetime_utc >= datetime('now', '-24 hours')");
  const last48h = selectOne("SELECT COUNT(*) as count FROM events WHERE event_datetime_utc >= datetime('now', '-48 hours')");

  const verificationBreakdown = selectAll(
    "SELECT verification_status, COUNT(*) as count FROM events GROUP BY verification_status"
  );
  const domainBreakdown = selectAll(
    "SELECT domain, COUNT(*) as count FROM events WHERE domain IS NOT NULL AND domain != '' GROUP BY domain ORDER BY count DESC"
  );
  const countryBreakdown = selectAll(
    "SELECT country, COUNT(*) as count FROM events WHERE country IS NOT NULL AND country != '' GROUP BY country ORDER BY count DESC"
  );
  const avgSeverity = selectOne('SELECT AVG(severity_score) as avg_severity FROM events');
  const highSeverity = selectOne('SELECT COUNT(*) as count FROM events WHERE severity_score >= 7');
  const topActors = selectAll(
    "SELECT actor_1 as actor, COUNT(*) as count FROM events WHERE actor_1 IS NOT NULL AND actor_1 != '' GROUP BY actor_1 ORDER BY count DESC LIMIT 10"
  );

  return {
    total: total?.count || 0,
    last24h: last24h?.count || 0,
    last48h: last48h?.count || 0,
    verificationBreakdown,
    domainBreakdown,
    countryBreakdown,
    avgSeverity: Math.round((avgSeverity?.avg_severity || 0) * 10) / 10,
    highSeverityCount: highSeverity?.count || 0,
    topActors,
  };
}

export function getTimelineData(days = 7) {
  return selectAll(`
    SELECT
      DATE(event_datetime_utc) as date,
      COUNT(*) as event_count,
      ROUND(AVG(severity_score), 1) as severity_avg,
      SUM(CASE WHEN severity_score >= 7 THEN 1 ELSE 0 END) as high_severity_count
    FROM events
    WHERE event_datetime_utc >= datetime('now', '-${parseInt(days)} days')
    GROUP BY DATE(event_datetime_utc)
    ORDER BY date ASC
  `);
}

export function getHotTopics(limit = 10) {
  const excludedTags = [
    'news_aggregator', 'news_agency', 'news_outlet', 'specialist',
    'gdelt', 'conflict_database', 'state_media', 'social_media',
    'telegram', 'government', 'cyber_intelligence', 'monitoring_org',
    'open_data', 'international_org', 'critical-event', 'high-severity',
    'unconfirmed-report', 'nuclear-related', 'casualty',
  ];

  const recentEvents = selectAll(
    "SELECT tags, severity_score FROM events WHERE event_datetime_utc >= datetime('now', '-72 hours')"
  );

  const tagCounts = {};
  recentEvents.forEach(row => {
    let tags;
    try { tags = JSON.parse(row.tags || '[]'); } catch { tags = []; }
    tags.forEach(tag => {
      if (excludedTags.includes(tag) || tag.length < 3) return;
      if (!tagCounts[tag]) tagCounts[tag] = { count: 0, totalSev: 0 };
      tagCounts[tag].count += 1;
      tagCounts[tag].totalSev += (row.severity_score || 5);
    });
  });

  const formatTopic = (tag) => {
    const names = {
      'escalation': 'Escalation Signals', 'de-escalation': 'De-escalation Efforts',
      'civilian-impact': 'Civilian Impact', 'cross-border': 'Cross-Border Ops',
      'proxy-warfare': 'Proxy Warfare', 'maritime': 'Maritime Operations',
      'aerial': 'Aerial Operations', 'cyber': 'Cyber Operations',
      'economic': 'Economic Impact', 'diplomatic': 'Diplomatic Activity',
      'intelligence': 'Intel Operations', 'breaking': 'Breaking News',
      'nuclear': 'Nuclear Concerns', 'strait-of-hormuz': 'Strait of Hormuz',
      'red-sea': 'Red Sea Activity', 'iron-dome': 'Iron Dome Activations',
      'airstrike': 'Airstrikes', 'missile': 'Missile Activity',
      'drone': 'Drone Operations', 'sanctions': 'Sanctions',
      'ceasefire': 'Ceasefire Talks', 'deployment': 'Military Deployments',
    };
    return names[tag] || tag.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  return Object.entries(tagCounts)
    .filter(([, d]) => d.count >= 2)
    .map(([tag, d]) => ({
      tag: formatTopic(tag),
      count: d.count,
      avg_severity: Math.round((d.totalSev / d.count) * 10) / 10,
      score: d.count * (d.totalSev / d.count),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// ---- SOURCES ----

export function upsertSource(source) {
  runSql(`
    INSERT OR REPLACE INTO sources (id, name, url, type, reliability_score, reliability_tier, config)
    VALUES ('${esc(source.id)}', '${esc(source.name)}', '${esc(source.url)}',
    '${esc(source.type)}', ${source.reliability_score || 5}, ${source.reliability_tier || 5},
    '${esc(JSON.stringify(source.config || {}))}')
  `);
}

export function updateSourceFetchTime(name) {
  runSql(`
    UPDATE sources SET last_fetched_at = datetime('now') WHERE name = '${esc(name)}'
  `);
}

export function getSources() {
  return selectAll(`
    SELECT s.*,
      (SELECT COUNT(*) FROM events WHERE source_name = s.name) as event_count
    FROM sources s WHERE s.active = 1 ORDER BY s.reliability_score DESC
  `);
}

// ---- INGESTION LOG ----

export function logIngestion(logEntry) {
  runSql(`
    INSERT INTO ingestion_log (source_id, started_at, completed_at, status, events_fetched, events_new, events_duplicate, events_error, error_message)
    VALUES ('${esc(logEntry.source_id)}', '${esc(logEntry.started_at)}', '${esc(logEntry.completed_at || '')}',
    '${esc(logEntry.status)}', ${logEntry.events_fetched || 0}, ${logEntry.events_new || 0},
    ${logEntry.events_duplicate || 0}, ${logEntry.events_error || 0}, '${esc(logEntry.error_message || '')}')
  `);
}

export function getIngestionLogs(limit = 50) {
  return selectAll(`
    SELECT il.*, s.name as source_name FROM ingestion_log il
    LEFT JOIN sources s ON il.source_id = s.id
    ORDER BY il.started_at DESC LIMIT ${parseInt(limit)}
  `);
}