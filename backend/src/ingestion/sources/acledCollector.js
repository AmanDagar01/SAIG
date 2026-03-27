import axios from 'axios';
import { logger } from '../../utils/logger.js';
import { config } from '../../config/index.js';

/**
 * ACLED - Armed Conflict Location & Event Data
 * Provides structured conflict event data
 * Free API with registration: https://acleddata.com/
 */

// Countries relevant to Iran-Israel conflict
const TARGET_COUNTRIES = ['Iran', 'Israel', 'Syria', 'Lebanon', 'Iraq', 'Yemen', 'Palestine'];

export async function fetchAcledData() {
  const allEvents = [];

  // Skip if no API key configured
  if (!config.acled.apiKey) {
    logger.warn('ACLED API key not configured - skipping ACLED collection');
    logger.info('To enable: Register at https://acleddata.com/ and add ACLED_API_KEY and ACLED_EMAIL to .env');
    return allEvents;
  }

  try {
    logger.info('Fetching ACLED conflict data...');

    // Get events from last 30 days for target countries
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];

    const params = {
      key: config.acled.apiKey,
      email: config.acled.email,
      country: TARGET_COUNTRIES.join('|'),
      event_date: `${thirtyDaysAgo}|${new Date().toISOString().split('T')[0]}`,
      event_date_where: 'BETWEEN',
      limit: 500,
      fields: 'event_id_cnty|event_date|year|event_type|sub_event_type|actor1|actor2|country|admin1|admin2|location|latitude|longitude|source|source_scale|notes|fatalities|tags|timestamp',
    };

    const response = await axios.get(config.acled.apiUrl, {
      params,
      timeout: 30000,
    });

    const data = response.data;
    const events = data.data || [];

    for (const event of events) {
      allEvents.push({
        source_feed: 'ACLED',
        source_type: 'conflict_database',
        source_reliability: { score: 8, tier: 2 },
        title: `${event.event_type}: ${event.actor1} - ${event.location}, ${event.country}`,
        description: event.notes || `${event.event_type} involving ${event.actor1}${event.actor2 ? ` and ${event.actor2}` : ''} in ${event.location}, ${event.country}`,
        url: `https://acleddata.com/data-export-tool/`,
        published: new Date(event.event_date).toISOString(),
        raw: {
          acled_id: event.event_id_cnty,
          event_type: event.event_type,
          sub_event_type: event.sub_event_type,
          actor1: event.actor1,
          actor2: event.actor2,
          location: event.location,
          admin1: event.admin1,
          admin2: event.admin2,
          latitude: parseFloat(event.latitude),
          longitude: parseFloat(event.longitude),
          fatalities: parseInt(event.fatalities) || 0,
          source: event.source,
          source_scale: event.source_scale,
          tags: event.tags,
        },
        // ACLED provides structured data - use it
        pre_extracted: {
          actor_1: event.actor1 || null,
          actor_2: event.actor2 || null,
          country: event.country,
          location_text: `${event.location}, ${event.admin1 || ''}, ${event.country}`.replace(/, ,/g, ','),
          lat: parseFloat(event.latitude) || null,
          lng: parseFloat(event.longitude) || null,
          event_type: mapAcledEventType(event.event_type, event.sub_event_type),
          domain: mapAcledDomain(event.event_type),
          fatalities: parseInt(event.fatalities) || 0,
        },
      });
    }

    logger.info(`ACLED: ${events.length} conflict events collected`);
  } catch (error) {
    logger.error(`ACLED fetch failed: ${error.message}`);
  }

  return allEvents;
}

function mapAcledEventType(eventType, subEventType) {
  const mapping = {
    'Battles': 'ground_operation',
    'Violence against civilians': 'civilian_attack',
    'Explosions/Remote violence': subEventType?.includes('Air') ? 'airstrike'
      : subEventType?.includes('Shelling') ? 'shelling'
      : subEventType?.includes('Suicide') ? 'suicide_attack'
      : 'explosion',
    'Protests': 'civil_unrest',
    'Riots': 'civil_unrest',
    'Strategic developments': 'military_movement',
  };
  return mapping[eventType] || 'other';
}

function mapAcledDomain(eventType) {
  const mapping = {
    'Battles': 'military',
    'Violence against civilians': 'military',
    'Explosions/Remote violence': 'military',
    'Protests': 'political',
    'Riots': 'political',
    'Strategic developments': 'military',
  };
  return mapping[eventType] || 'military';
}