import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

const parser = new Parser();

type ExploreArticle = {
  title: string;
  source: string;
  publishedAt: string;
  description: string;
  url: string;
};

type ExploreCluster = {
  id: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
  url: string;
  reportCount: number;
  sources: Array<{
    name: string;
    title: string;
    url: string;
    publishedAt: string;
  }>;
};

const STOP_WORDS = new Set([
  'the','a','an','and','or','for','with','from','into','about','this','that','these','those',
  'what','when','where','why','how','who','which','latest','news','today','current','recent',
  'recently','update','updates','happening','happen','world','in','on','of','to','is','are',
  'was','were','be','by','as','at','it','its','their','they','them','has','have','had','says',
  'said','will','would','could','may','might','one','two','three','first','second','top','report',
  'reports','according','amid','also','more','than','now','just','here','there'
]);

const EVENT_ANCHORS = [
  'attack','attacked','assault','stabbed','stabbing','injured','wounded','killed','death','dead',
  'crash','crashed','flight','pilot','passenger','crew','airport','diverted','evacuated','evacuation',
  'fire','flood','cyclone','earthquake','arrested','arrest','court','ruling','ruling','ban','banned',
  'approved','approval','deal','agreement','strike','protest','tariff','sanctions','investment','launch',
  'launched','resigns','resignation','election','policy','decision','warning','storm','explosion'
];

function cleanText(value: unknown): string {
  return String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanTitle(value: unknown): string {
  return cleanText(value)
    .replace(/\s*[|–—-]\s*(?:Inshorts|Google News)\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanSource(value: unknown, url: string): string {
  const source = cleanText(value)
    .replace(/\s*[|–—-]\s*(?:Inshorts|Google News)\s*$/i, '')
    .trim();

  if (source) return source;

  try {
    const host = new URL(url).hostname.replace(/^www\./i, '');
    const parts = host.split('.');
    return parts.length >= 2
      ? parts[parts.length - 2]
          .split(/[-_]/)
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      : host;
  } catch {
    return 'Source';
  }
}

function normalize(value: string): string {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeToken(token: string) {
  let value = token.toLowerCase();
  if (value.length > 5 && value.endsWith('ies')) value = `${value.slice(0, -3)}y`;
  else if (value.length > 5 && value.endsWith('ves')) value = `${value.slice(0, -3)}f`;
  else if (value.length > 5 && value.endsWith('ing')) value = value.slice(0, -3);
  else if (value.length > 4 && value.endsWith('ed')) value = value.slice(0, -2);
  else if (value.length > 4 && value.endsWith('es')) value = value.slice(0, -2);
  else if (value.length > 3 && value.endsWith('s')) value = value.slice(0, -1);
  return value;
}

function tokens(value: string): Set<string> {
  return new Set(
    normalize(value)
      .split(/\s+/)
      .map(normalizeToken)
      .filter((token) => token.length >= 3 && !STOP_WORDS.has(token))
  );
}

function queryTerms(query: string): Set<string> {
  return tokens(query);
}

function articleRelevance(article: ExploreArticle, query: string): number {
  const terms = queryTerms(query);
  const title = normalize(article.title);
  const description = normalize(article.description);
  let score = 0;

  for (const term of terms) {
    if (title.includes(term)) score += 10;
    else if (description.includes(term)) score += 2;
  }

  if (normalize(query).length > 3 && title.includes(normalize(query))) score += 20;

  const time = Date.parse(article.publishedAt);
  if (Number.isFinite(time)) {
    const ageDays = Math.max(0, (Date.now() - time) / 86400000);
    if (ageDays <= 1) score += 8;
    else if (ageDays <= 3) score += 5;
    else if (ageDays <= 7) score += 2;
  }

  return score;
}

function articleSimilarity(a: ExploreArticle, b: ExploreArticle, query: string) {
  if (a.url === b.url) return 1;

  const querySet = queryTerms(query);
  const aTokens = tokens(a.title);
  const bTokens = tokens(b.title);
  const aEvent = new Set([...aTokens].filter((token) => !querySet.has(token)));
  const bEvent = new Set([...bTokens].filter((token) => !querySet.has(token)));

  let shared = 0;
  for (const token of aEvent) if (bEvent.has(token)) shared++;

  const union = new Set([...aEvent, ...bEvent]).size;
  const jaccard = union ? shared / union : 0;
  const smaller = Math.min(aEvent.size, bEvent.size);
  const containment = smaller ? shared / smaller : 0;

  return Math.max(jaccard, containment * 0.85);
}

function sameDevelopingEvent(a: ExploreArticle, b: ExploreArticle, query: string) {
  if (a.url === b.url) return true;
  if (articleSimilarity(a, b, query) >= 0.40) return true;

  const q = queryTerms(query);
  const aTokens = tokens(`${a.title} ${a.description}`);
  const bTokens = tokens(`${b.title} ${b.description}`);
  const sharedQueryTerms = [...q].filter((term) => aTokens.has(term) && bTokens.has(term));
  if (!sharedQueryTerms.length) return false;

  const aEvent = new Set([...aTokens].filter((token) => !q.has(token)));
  const bEvent = new Set([...bTokens].filter((token) => !q.has(token)));
  const sharedEvent = [...aEvent].filter((token) => bEvent.has(token));
  const sharedAnchors = sharedEvent.filter((token) => EVENT_ANCHORS.includes(token)).length;

  // A topic/entity search can produce many different stories involving the
  // same entity. Group reports only when there is meaningful event overlap.
  if (sharedAnchors >= 1 && sharedEvent.length >= 2) return true;
  if (sharedAnchors >= 2) return true;

  // For very recent reporting, two shared non-trivial event terms plus the
  // searched entity is strong evidence that outlets are describing the same
  // developing incident with different wording.
  const recentA = Date.now() - Date.parse(a.publishedAt) <= 2 * 86400000;
  const recentB = Date.now() - Date.parse(b.publishedAt) <= 2 * 86400000;
  return recentA && recentB && sharedEvent.length >= 3;
}

function dedupeExact(articles: ExploreArticle[]) {
  const seen = new Set<string>();
  return articles.filter((article) => {
    const key = normalize(article.title);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function stripLeadingTitle(description: string, title: string) {
  const value = cleanText(description);
  const clean = cleanText(title);
  if (!value) return '';

  if (clean) {
    const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return value.replace(new RegExp(`^${escaped}\\s*[-:|–—]?\\s*`, 'i'), '').trim();
  }

  return value;
}

function conciseSummary(description: string, title: string) {
  let value = stripLeadingTitle(description, title);
  if (!value) return '';

  // Google News snippets can concatenate several headlines and publisher names.
  // Keep the first coherent two sentences rather than exposing the feed blob.
  value = value
    .replace(/\s*\|\s*(?:Google News|Inshorts)\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  const sentences = value.match(/[^.!?]+[.!?]+/g) || [];
  const firstTwo = sentences.slice(0, 2).join(' ').trim();
  const candidate = firstTwo || value;
  return candidate.length > 360 ? `${candidate.slice(0, 357).replace(/\s+\S*$/, '')}…` : candidate;
}

async function fetchArticleSummary(url: string, fallback: string, title: string) {
  if (!url) return fallback;

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 EIRA/1.0',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(4500),
    });

    if (!response.ok) return fallback;
    const html = (await response.text()).slice(0, 600000);
    const patterns = [
      /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i,
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match?.[1]) {
        const summary = conciseSummary(match[1], title);
        if (summary) return summary;
      }
    }
  } catch {}

  return fallback;
}

async function fetchNews(query: string): Promise<ExploreArticle[]> {
  const searches = [
    `${query} when:7d`,
    `${query} latest when:7d`,
  ];

  const feeds = await Promise.allSettled(
    searches.map(async (search) => {
      const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(search)}&hl=en-IN&gl=IN&ceid=IN:en`;
      const response = await fetch(rssUrl, {
        cache: 'no-store',
        headers: { Accept: 'application/rss+xml, application/xml, text/xml' },
      });
      if (!response.ok) throw new Error(`Google News returned HTTP ${response.status}.`);
      return parser.parseString(await response.text());
    })
  );

  const articles = feeds.flatMap((result) => {
    if (result.status !== 'fulfilled') return [];
    return (result.value.items ?? []).map((item: any) => {
      const url = cleanText(item?.link);
      if (!url) return null;
      return {
        title: cleanTitle(item?.title),
        source: cleanSource(item?.source?._ ?? item?.source?.name ?? item?.source?.title ?? '', url),
        publishedAt: cleanText(item?.isoDate ?? item?.pubDate ?? ''),
        description: cleanText(item?.contentSnippet ?? item?.content ?? item?.description ?? ''),
        url,
      } satisfies ExploreArticle;
    }).filter(Boolean) as ExploreArticle[];
  });

  return dedupeExact(articles);
}

function clusterArticles(articles: ExploreArticle[], query: string): ExploreArticle[][] {
  const ranked = articles
    .map((article) => ({ article, score: articleRelevance(article, query) }))
    .sort((a, b) => b.score - a.score)
    .map((item) => item.article);

  const clusters: ExploreArticle[][] = [];

  for (const article of ranked) {
    const existing = clusters.find((cluster) => sameDevelopingEvent(cluster[0], article, query));
    if (existing) existing.push(article);
    else clusters.push([article]);
  }

  return clusters;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('q')?.trim() ?? '';

    if (!query) {
      return NextResponse.json({ topic: '', results: [], resultCount: 0, retrievedAt: new Date().toISOString() });
    }

    const articles = await fetchNews(query);
    if (!articles.length) {
      return NextResponse.json({ topic: query, results: [], resultCount: 0, retrievedAt: new Date().toISOString() });
    }

    const clusters = clusterArticles(articles, query).slice(0, 8);
    const topClusters = clusters.slice(0, 8);

    const results: ExploreCluster[] = await Promise.all(topClusters.map(async (cluster, index) => {
      const representative = cluster[0];
      const fallback = conciseSummary(representative.description, representative.title);
      const summary = await fetchArticleSummary(representative.url, fallback, representative.title);

      return {
        id: `cluster-${index + 1}`,
        title: representative.title,
        summary: summary || 'Current reporting is available from the sources below.',
        source: representative.source,
        publishedAt: representative.publishedAt,
        url: representative.url,
        reportCount: cluster.length,
        sources: cluster.slice(0, 8).map((article) => ({
          name: article.source,
          title: article.title,
          url: article.url,
          publishedAt: article.publishedAt,
        })),
      };
    }));

    return NextResponse.json(
      {
        topic: query,
        results,
        resultCount: results.length,
        retrievedAt: new Date().toISOString(),
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('EIRA Explore API error:', error);
    return NextResponse.json(
      {
        topic: '',
        results: [],
        resultCount: 0,
        error: error instanceof Error ? error.message : 'Explore could not load right now.',
      },
      { status: 500 }
    );
  }
}
