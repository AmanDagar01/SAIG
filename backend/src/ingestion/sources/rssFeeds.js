import RssParser from 'rss-parser';
import { logger } from '../../utils/logger.js';
import { CONFLICT_KEYWORDS, SOURCE_RELIABILITY } from '../../utils/constants.js';

const parser = new RssParser({
  timeout: 15000,
  headers: {
    'User-Agent': 'OSINT-Monitor/1.0 (Academic Research)',
  },
});

// RSS feeds covering Iran-Israel-US conflict
const RSS_FEEDS = [
  // Tier 1: Wire services
  {
    name: 'Reuters Middle East',
    url: 'https://www.rss-bridge.org/bridge01/?action=display&bridge=FilterBridge&url=https%3A%2F%2Fwww.reuters.com%2Fworld%2Fmiddle-east&format=Atom',
    backupUrl: 'https://news.google.com/rss/search?q=iran+israel+conflict+when:3d&hl=en&gl=US&ceid=US:en',
    type: 'news_agency',
    reliability: SOURCE_RELIABILITY['Reuters'] || { score: 9, tier: 1 },
  },
  // Google News aggregated feeds (reliable & always available)
  {
    name: 'Google News - Iran Israel',
    url: 'https://news.google.com/rss/search?q=iran+israel+military+OR+attack+OR+strike+OR+missile+when:3d&hl=en&gl=US&ceid=US:en',
    type: 'news_aggregator',
    reliability: { score: 7, tier: 2 },
  },
  {
    name: 'Google News - Middle East Conflict',
    url: 'https://news.google.com/rss/search?q=hezbollah+OR+houthi+OR+IRGC+OR+IDF+when:3d&hl=en&gl=US&ceid=US:en',
    type: 'news_aggregator',
    reliability: { score: 7, tier: 2 },
  },
  {
    name: 'Google News - Iran Nuclear',
    url: 'https://news.google.com/rss/search?q=iran+nuclear+OR+enrichment+OR+IAEA+when:7d&hl=en&gl=US&ceid=US:en',
    type: 'news_aggregator',
    reliability: { score: 7, tier: 2 },
  },
  // Al Jazeera
  {
    name: 'Al Jazeera',
    url: 'https://www.aljazeera.com/xml/rss/all.xml',
    type: 'news_outlet',
    reliability: SOURCE_RELIABILITY['Al Jazeera'] || { score: 7, tier: 2 },
  },
  // BBC
  {
    name: 'BBC Middle East',
    url: 'https://feeds.bbci.co.uk/news/world/middle_east/rss.xml',
    type: 'news_outlet',
    reliability: SOURCE_RELIABILITY['BBC'] || { score: 8, tier: 2 },
  },
  // Defense & military
  {
    name: 'Defense One',
    url: 'https://www.defenseone.com/rss/threats/',
    type: 'specialist',
    reliability: { score: 7, tier: 3 },
  },
  // Arms Control
  {
    name: 'Arms Control Association',
    url: 'https://www.armscontrol.org/rss.xml',
    type: 'specialist',
    reliability: { score: 8, tier: 2 },
  },
];

/**
 * Check if an article is relevant to the Iran-Israel-US conflict
 */
function isRelevant(title = '', description = '', content = '') {
  const combined = `${title} ${description} ${content}`.toLowerCase();
  let matchCount = 0;

  for (const keyword of CONFLICT_KEYWORDS) {
    if (combined.includes(keyword)) {
      matchCount++;
      if (matchCount >= 2) return true; // At least 2 keyword matches
    }
  }

  return false;
}

/**
 * Fetch and filter articles from all RSS feeds
 */
export async function fetchRssFeeds() {
  const allArticles = [];

  for (const feed of RSS_FEEDS) {
    try {
      logger.info(`Fetching RSS: ${feed.name}`);

      let parsedFeed;
      try {
        parsedFeed = await parser.parseURL(feed.url);
      } catch (err) {
        if (feed.backupUrl) {
          logger.warn(`Primary URL failed for ${feed.name}, trying backup`);
          parsedFeed = await parser.parseURL(feed.backupUrl);
        } else {
          throw err;
        }
      }

      const items = parsedFeed.items || [];
      let relevantCount = 0;

      for (const item of items) {
        const title = item.title || '';
        const description = item.contentSnippet || item.content || item.summary || '';
        const content = item['content:encoded'] || '';

        if (isRelevant(title, description, content)) {
          relevantCount++;
          allArticles.push({
            source_feed: feed.name,
            source_type: feed.type,
            source_reliability: feed.reliability,
            title: title.trim(),
            description: description.trim().substring(0, 2000),
            url: item.link || item.guid || '',
            published: item.isoDate || item.pubDate || new Date().toISOString(),
            raw: {
              categories: item.categories || [],
              author: item.creator || item.author || '',
              guid: item.guid || '',
            },
          });
        }
      }

      logger.info(`RSS ${feed.name}: ${items.length} items, ${relevantCount} relevant`);
    } catch (error) {
      logger.error(`RSS fetch failed for ${feed.name}: ${error.message}`);
    }
  }

  logger.info(`Total RSS articles collected: ${allArticles.length}`);
  return allArticles;
}

export { RSS_FEEDS };