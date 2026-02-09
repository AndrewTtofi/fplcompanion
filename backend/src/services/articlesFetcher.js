const Parser = require('rss-parser');
const redisClient = require('../config/redis');

const ARTICLES_CACHE_KEY = 'fpl:articles:cache';
const ARTICLES_CACHE_TTL = 1800; // 30 minutes

const RSS_FEEDS = [
  // --- News outlets ---
  { url: 'http://feeds.bbci.co.uk/sport/football/rss.xml', source: 'BBC Sport' },
  { url: 'https://www.theguardian.com/football/premierleague/rss', source: 'The Guardian' },
  { url: 'https://www.skysports.com/rss/12040', source: 'Sky Sports' },
  { url: 'https://www.espn.com/espn/rss/soccer/news', source: 'ESPN FC' },
  { url: 'https://www.fourfourtwo.com/rss.xml', source: 'FourFourTwo' },
  { url: 'https://talksport.com/football/feed/', source: 'TalkSport' },
  { url: 'https://www.football365.com/feed', source: 'Football365' },
  { url: 'https://www.mirror.co.uk/sport/football/rss.xml', source: 'Mirror Football' },
  { url: 'https://www.90min.com/posts.rss', source: '90min' },
  { url: 'https://theathletic.com/football/premier-league/?rss', source: 'The Athletic' },
  // --- Reddit communities ---
  { url: 'https://www.reddit.com/r/FantasyPL/.rss', source: 'r/FantasyPL' },
  { url: 'https://www.reddit.com/r/PremierLeague/.rss', source: 'r/PremierLeague' },
  // --- Official club feeds (clubs without RSS are omitted) ---
  { url: 'https://www.afcb.co.uk/rss.xml', source: 'Bournemouth FC' },
  { url: 'https://www.avfc.co.uk/rss.xml', source: 'Aston Villa FC' },
  { url: 'https://burnleyfootballclub.com/rss.xml', source: 'Burnley FC' },
  { url: 'https://www.cpfc.co.uk/rss.xml', source: 'Crystal Palace FC' },
  { url: 'https://www.evertonfc.com/rss.xml', source: 'Everton FC' },
  { url: 'https://www.fulhamfc.com/rss.xml', source: 'Fulham FC' },
  { url: 'https://www.manutd.com/rss.xml', source: 'Man United FC' },
  { url: 'https://www.nottinghamforest.co.uk/rss.xml', source: 'Nott\'m Forest FC' },
  { url: 'https://safc.com/rss.xml', source: 'Sunderland AFC' },
];

// Map FPL team names to search keywords for article matching
// Keys are the FPL API team short_name, values are keywords to match in articles
// 2025-26 Premier League teams
const TEAM_KEYWORDS = {
  ARS: ['arsenal', 'gunners'],
  AVL: ['aston villa', 'villa'],
  BOU: ['bournemouth', 'cherries'],
  BRE: ['brentford', 'bees'],
  BHA: ['brighton', 'seagulls', 'albion'],
  BUR: ['burnley', 'clarets'],
  CHE: ['chelsea', 'blues'],
  CRY: ['crystal palace', 'palace', 'eagles'],
  EVE: ['everton', 'toffees'],
  FUL: ['fulham', 'cottagers'],
  LEE: ['leeds', 'leeds united'],
  LIV: ['liverpool', 'reds'],
  MCI: ['manchester city', 'man city', 'city'],
  MUN: ['manchester united', 'man utd', 'man united', 'united'],
  NEW: ['newcastle', 'magpies'],
  NFO: ['nottingham forest', 'nott\'m forest', 'forest'],
  SUN: ['sunderland', 'black cats'],
  TOT: ['tottenham', 'spurs'],
  WHU: ['west ham', 'hammers'],
  WOL: ['wolves', 'wolverhampton'],
};

class ArticlesFetcher {
  constructor() {
    this.parser = new Parser({
      timeout: 10000,
      headers: { 'User-Agent': 'FPL-Companion/1.0' },
    });
  }

  /**
   * Fetch articles from all RSS feeds
   */
  async fetchArticles() {
    // Fetch all feeds in parallel for speed
    const results = await Promise.allSettled(
      RSS_FEEDS.map(async (feed) => {
        try {
          const parsed = await this.parser.parseURL(feed.url);
          return (parsed.items || []).slice(0, 15).map(item => ({
            title: item.title || '',
            link: item.link || '',
            snippet: this._cleanSnippet(item.contentSnippet || item.content || item.summary || ''),
            source: feed.source,
            pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
            _searchText: `${item.title || ''} ${item.contentSnippet || item.content || item.summary || ''}`.toLowerCase(),
          }));
        } catch (err) {
          console.error(`[ArticlesFetcher] Failed to fetch ${feed.source}: ${err.message}`);
          return [];
        }
      })
    );

    const allArticles = [];
    for (const result of results) {
      if (result.status === 'fulfilled') {
        allArticles.push(...result.value);
      }
    }

    // Sort by date, newest first
    allArticles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    // Store in Redis (without _searchText in the cached version)
    const cacheData = {
      articles: allArticles,
      fetched_at: new Date().toISOString(),
      total: allArticles.length,
    };
    await redisClient.set(ARTICLES_CACHE_KEY, JSON.stringify(cacheData), { EX: ARTICLES_CACHE_TTL });

    console.log(`[ArticlesFetcher] Cached ${allArticles.length} articles from ${RSS_FEEDS.length} feeds`);
    return cacheData;
  }

  /**
   * Clean up HTML/whitespace from snippet
   */
  _cleanSnippet(text) {
    return text
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 200);
  }

  /**
   * Get cached articles, fetching if needed
   */
  async _getCachedArticles() {
    const cached = await redisClient.get(ARTICLES_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
    // Cache miss — fetch fresh
    return await this.fetchArticles();
  }

  /**
   * Get articles matched against ALL teams, with matchedTeams annotation
   */
  async getArticlesAllTeams() {
    const data = await this._getCachedArticles();
    if (!data || !data.articles) return [];

    return data.articles
      .map(article => {
        const text = article._searchText || `${article.title} ${article.snippet}`.toLowerCase();
        const matchedTeams = [];
        for (const [shortName, kws] of Object.entries(TEAM_KEYWORDS)) {
          if (kws.some(kw => text.includes(kw))) {
            matchedTeams.push(shortName);
          }
        }
        if (matchedTeams.length === 0) return null;
        const { _searchText, ...rest } = article;
        return { ...rest, matchedTeams };
      })
      .filter(Boolean)
      .slice(0, 50); // higher limit since all teams
  }

  /**
   * Get all articles (unfiltered)
   */
  async getAllArticles() {
    const data = await this._getCachedArticles();
    if (!data || !data.articles) return { articles: [], fetched_at: null };
    return {
      articles: data.articles.map(({ _searchText, ...a }) => a),
      fetched_at: data.fetched_at,
      total: data.total,
    };
  }
}

const articlesFetcher = new ArticlesFetcher();
articlesFetcher.ALL_TEAMS = Object.keys(TEAM_KEYWORDS).sort();
module.exports = articlesFetcher;
