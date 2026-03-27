import { CONFLICT_ACTORS, EVENT_TYPES, DOMAINS, CONFLICT_KEYWORDS } from '../../utils/constants.js';

/**
 * Extract entities from text using keyword matching
 * No external NLP API needed - uses pattern matching against known conflict entities
 */
export function extractEntities(text) {
  if (!text) return {};

  const lowerText = text.toLowerCase();

  // Extract actors
  const actors = extractActors(lowerText, text);

  // Extract event type
  const eventInfo = extractEventType(lowerText);

  // Extract location/country
  const locationInfo = extractLocation(lowerText, text);

  // Extract tags
  const tags = extractTags(lowerText);

  return {
    actor_1: actors.primary || null,
    actor_2: actors.secondary || null,
    event_type: eventInfo.type || null,
    domain: eventInfo.domain || null,
    location: locationInfo.location || null,
    country: locationInfo.country || null,
    tags,
  };
}

function extractActors(lowerText, originalText) {
  const found = [];

  // Check state actors
  for (const actor of CONFLICT_ACTORS.state) {
    if (lowerText.includes(actor.toLowerCase())) {
      found.push({ name: actor, type: 'state', priority: 1 });
    }
  }

  // Check military actors
  for (const actor of CONFLICT_ACTORS.military) {
    if (lowerText.includes(actor.toLowerCase())) {
      found.push({ name: actor, type: 'military', priority: 2 });
    }
  }

  // Check non-state actors
  for (const actor of CONFLICT_ACTORS.nonState) {
    if (lowerText.includes(actor.toLowerCase())) {
      found.push({ name: actor, type: 'non_state', priority: 2 });
    }
  }

  // Check organizations
  for (const actor of CONFLICT_ACTORS.organizations) {
    if (lowerText.includes(actor.toLowerCase())) {
      found.push({ name: actor, type: 'organization', priority: 3 });
    }
  }

  // Sort by priority (military/non-state first, then state, then orgs)
  found.sort((a, b) => a.priority - b.priority);

  // Remove duplicates (e.g., "Israel" and "IDF" - keep "IDF" as primary)
  const unique = [];
  const seen = new Set();
  for (const actor of found) {
    if (!seen.has(actor.name)) {
      unique.push(actor);
      seen.add(actor.name);
    }
  }

  return {
    primary: unique[0]?.name || null,
    secondary: unique[1]?.name || null,
    all: unique.map(a => a.name),
  };
}

function extractEventType(lowerText) {
  // Check each domain's event types
  for (const [domain, types] of Object.entries(EVENT_TYPES)) {
    for (const eventType of types) {
      const searchTerms = eventType.replace(/_/g, ' ').split(' ');
      // Check if all words of the event type appear in text
      if (searchTerms.every(term => lowerText.includes(term))) {
        return { type: eventType, domain };
      }
    }
  }

  // Fallback: keyword-based detection
  const keywordMap = [
    { keywords: ['airstrike', 'air strike', 'bombing', 'bombed'], type: 'airstrike', domain: 'military' },
    { keywords: ['missile', 'ballistic', 'cruise missile'], type: 'missile_attack', domain: 'military' },
    { keywords: ['rocket', 'rockets fired', 'rocket attack'], type: 'rocket_attack', domain: 'military' },
    { keywords: ['drone', 'uav', 'drone strike'], type: 'drone_strike', domain: 'military' },
    { keywords: ['troops', 'deploy', 'deployment', 'carrier', 'warship'], type: 'military_deployment', domain: 'military' },
    { keywords: ['cyber', 'hack', 'malware', 'cyber attack'], type: 'cyber_attack', domain: 'cyber' },
    { keywords: ['sanction', 'sanctions'], type: 'sanctions', domain: 'economic' },
    { keywords: ['nuclear', 'enrichment', 'centrifuge', 'uranium'], type: 'nuclear_issue', domain: 'nuclear' },
    { keywords: ['protest', 'demonstration', 'protesters'], type: 'civil_unrest', domain: 'political' },
    { keywords: ['ceasefire', 'truce', 'peace talk', 'negotiation'], type: 'negotiation', domain: 'diplomatic' },
    { keywords: ['statement', 'condemned', 'urged', 'warned', 'called for'], type: 'diplomatic_statement', domain: 'diplomatic' },
    { keywords: ['killed', 'casualties', 'dead', 'wounded', 'fatalities'], type: 'casualty_report', domain: 'humanitarian' },
    { keywords: ['intercept', 'iron dome', 'shot down', 'intercepted'], type: 'interception', domain: 'military' },
    { keywords: ['explosion', 'blast', 'detonation'], type: 'explosion', domain: 'military' },
    { keywords: ['oil price', 'crude', 'barrel', 'market'], type: 'economic_impact', domain: 'economic' },
    { keywords: ['disinformation', 'fake news', 'propaganda', 'misinformation'], type: 'disinformation', domain: 'information_warfare' },
  ];

  for (const mapping of keywordMap) {
    if (mapping.keywords.some(kw => lowerText.includes(kw))) {
      return { type: mapping.type, domain: mapping.domain };
    }
  }

  return { type: null, domain: null };
}

function extractLocation(lowerText, originalText) {
  // Check specific locations first
  const specificLocations = [
    'strait of hormuz', 'red sea', 'persian gulf', 'golan heights',
    'gaza strip', 'west bank', 'eastern mediterranean',
  ];

  for (const loc of specificLocations) {
    if (lowerText.includes(loc)) {
      return { location: loc, country: getCountryForLocation(loc) };
    }
  }

  // City-level detection
  const cities = {
    'tehran': 'Iran', 'isfahan': 'Iran', 'shiraz': 'Iran', 'tabriz': 'Iran',
    'tel aviv': 'Israel', 'jerusalem': 'Israel', 'haifa': 'Israel',
    'beirut': 'Lebanon', 'damascus': 'Syria', 'aleppo': 'Syria',
    'baghdad': 'Iraq', 'erbil': 'Iraq', 'sanaa': 'Yemen',
    'riyadh': 'Saudi Arabia', 'washington': 'United States',
    'gaza': 'Palestine', 'ramallah': 'Palestine',
  };

  for (const [city, country] of Object.entries(cities)) {
    if (lowerText.includes(city)) {
      return { location: city, country };
    }
  }

  // Country-level
  const countries = [
    'Iran', 'Israel', 'Lebanon', 'Syria', 'Iraq', 'Yemen',
    'Saudi Arabia', 'Jordan', 'Turkey', 'Egypt', 'United States',
    'United Arab Emirates', 'Qatar', 'Palestine', 'Russia',
  ];

  for (const country of countries) {
    if (lowerText.includes(country.toLowerCase())) {
      return { location: country, country };
    }
  }

  return { location: null, country: null };
}

function getCountryForLocation(location) {
  const map = {
    'strait of hormuz': 'Iran',
    'red sea': 'International',
    'persian gulf': 'International',
    'golan heights': 'Israel',
    'gaza strip': 'Palestine',
    'west bank': 'Palestine',
    'eastern mediterranean': 'International',
  };
  return map[location] || 'Unknown';
}

function extractTags(lowerText) {
  const tags = [];
  const tagKeywords = {
    'escalation': ['escalat', 'intensif', 'heighten'],
    'de-escalation': ['de-escalat', 'ceasefire', 'truce', 'peace'],
    'civilian-impact': ['civilian', 'population', 'humanitarian', 'refugee'],
    'nuclear': ['nuclear', 'enrichment', 'centrifuge', 'iaea'],
    'proxy-warfare': ['proxy', 'militia', 'backed by'],
    'cross-border': ['cross-border', 'border', 'territory'],
    'maritime': ['naval', 'ship', 'maritime', 'sea', 'strait'],
    'aerial': ['air', 'aircraft', 'drone', 'uav', 'jet'],
    'cyber': ['cyber', 'hack', 'digital', 'malware'],
    'economic': ['sanction', 'oil', 'trade', 'economic'],
    'diplomatic': ['diplomat', 'ambassador', 'summit', 'UN'],
    'intelligence': ['intelligence', 'mossad', 'spy', 'covert'],
    'weapons-test': ['test', 'missile test', 'launch test'],
    'breaking': ['breaking', 'just in', 'developing'],
    'casualty': ['killed', 'dead', 'wounded', 'casualt', 'fatalit'],
  };

  for (const [tag, keywords] of Object.entries(tagKeywords)) {
    if (keywords.some(kw => lowerText.includes(kw))) {
      tags.push(tag);
    }
  }

  return tags;
}