import axios from 'axios';
import { logger } from '../../utils/logger.js';
import { config } from '../../config/index.js';

/**
 * GDELT Project - Global Database of Events, Language, and Tone
 * Free API, no key needed
 * Docs: https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/
 */

const GDELT_QUERIES = [
  {
    name: 'Iran Israel Military',
    query: '(iran OR iranian) (israel OR israeli) (attack OR strike OR military OR missile OR drone)',
    mode: 'ArtList',
    maxrecords: 50,
    timespan: '3d',
  },
  {
    name: 'Hezbollah IDF',
    query: '(hezbollah OR hamas) (IDF OR "israel defense" OR airstrike OR rocket)',
    mode: 'ArtList',
    maxrecords: 30,
    timespan: '3d',
  },
  {
    name: 'Iran Nuclear IAEA',
    query: '(iran OR iranian) (nuclear OR enrichment OR IAEA OR uranium OR fordow OR natanz)',
    mode: 'ArtList',
    maxrecords: 25,
    timespan: '5d',
  },
  {
    name: 'Houthi Red Sea',
    query: '(houthi OR "ansar allah") (ship OR shipping OR "red sea" OR attack OR missile)',
    mode: 'ArtList',
    maxrecords: 25,
    timespan: '3d',
  },
  {
    name: 'IRGC Quds Force',
    query: '(IRGC OR "revolutionary guard" OR "quds force") (attack OR operation OR strike OR proxy)',
    mode: 'ArtList',
    maxrecords: 20,
    timespan: '5d',
  },
  {
    name: 'US CENTCOM Middle East',
    query: '(CENTCOM OR pentagon) (iran OR "middle east" OR deploy OR strike OR intercept)',
    mode: 'ArtList',
    maxrecords: 25,
    timespan: '3d',
  },
];

/**
 * Fetch articles from GDELT DOC 2.0 API
 */
export async function fetchGdeltData() {
  const allArticles = [];

  for (const queryConfig of GDELT_QUERIES) {
    try {
      logger.info(`GDELT query: ${queryConfig.name}`);

      const params = {
        query: queryConfig.query,
        mode: queryConfig.mode,
        maxrecords: queryConfig.maxrecords,
        timespan: queryConfig.timespan,
        format: 'json',
        sort: 'DateDesc',
      };

      const response = await axios.get(config.gdelt.apiUrl, {
        params,
        timeout: 20000,
        headers: {
          'User-Agent': 'OSINT-Monitor/1.0 (Academic Research)',
        },
      });

      const data = response.data;
      const articles = data.articles || [];

      for (const article of articles) {
        allArticles.push({
          source_feed: `GDELT - ${queryConfig.name}`,
          source_type: 'gdelt',
          source_reliability: { score: 6, tier: 3 },
          title: article.title || '',
          description: article.seendate
            ? `[${article.domain}] ${article.title}`
            : article.title,
          url: article.url || '',
          published: article.seendate
            ? parseGdeltDate(article.seendate)
            : new Date().toISOString(),
          raw: {
            domain: article.domain || '',
            language: article.language || '',
            sourcecountry: article.sourcecountry || '',
            socialimage: article.socialimage || '',
            tone: article.tone || '',
            gdelt_query: queryConfig.name,
          },
          // Attempt to identify the original source from GDELT domain
          original_source: extractSourceName(article.domain || ''),
        });
      }

      logger.info(`GDELT ${queryConfig.name}: ${articles.length} articles`);

      // Rate limit: small delay between queries
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      logger.error(`GDELT query failed (${queryConfig.name}): ${error.message}`);
    }
  }

  logger.info(`Total GDELT articles collected: ${allArticles.length}`);
  return allArticles;
}

function parseGdeltDate(dateStr) {
  // GDELT date format: 20250328T143000Z
  try {
    if (!dateStr) return new Date().toISOString();
    const cleaned = dateStr.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?/, '$1-$2-$3T$4:$5:$6Z');
    const d = new Date(cleaned);
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function extractSourceName(domain) {
  const knownDomains = {
    'reuters.com': 'Reuters',
    'apnews.com': 'Associated Press',
    'bbc.com': 'BBC',
    'bbc.co.uk': 'BBC',
    'aljazeera.com': 'Al Jazeera',
    'cnn.com': 'CNN',
    'theguardian.com': 'The Guardian',
    'nytimes.com': 'New York Times',
    'washingtonpost.com': 'Washington Post',
    'haaretz.com': 'Haaretz',
    'timesofisrael.com': 'Times of Israel',
    'jpost.com': 'Jerusalem Post',
    'alarabiya.net': 'Al Arabiya',
    'almonitor.com': 'Al Monitor',
    'middleeasteye.net': 'Middle East Eye',
    'farsnews.ir': 'FARS News',
    'presstv.ir': 'Press TV',
    'irna.ir': 'IRNA',
    'tass.com': 'TASS',
    'defenseone.com': 'Defense One',
    'defensenews.com': 'Defense News',
  };

  if (!domain) return 'Unknown';
  const cleanDomain = domain.replace('www.', '').toLowerCase();
  return knownDomains[cleanDomain] || domain;
}