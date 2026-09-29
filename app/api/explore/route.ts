import { NextResponse } from "next/server";
import Parser from "rss-parser";

const parser = new Parser();

type ExploreArticle = {
  title: string;
  source: string;
  publishedAt: string;
  description: string;
  url: string;
};

/* -------------------------------------------------------------------------- */
/* TEXT HELPERS                                                               */
/* -------------------------------------------------------------------------- */

function cleanText(value: unknown): string {
  return String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalize(value: string): string {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* -------------------------------------------------------------------------- */
/* SOURCE / PUBLISHER HANDLING                                                */
/* -------------------------------------------------------------------------- */

/*
 * Google News can sometimes give us a generic feed label such as "Google"
 * instead of the actual publisher.
 *
 * We NEVER want to display those as the article source.
 */
const GENERIC_SOURCES = new Set([
  "google",
  "google news",
  "google news rss",
  "news.google.com",
  "google news feed",
  "inshorts",
]);

function isGenericSource(value: string): boolean {
  return GENERIC_SOURCES.has(
    normalize(value).replace(/\s+/g, " ")
  );
}

/*
 * Google News commonly formats titles like:
 *
 *   Article headline - The Indian Express
 *
 * or:
 *
 *   Article headline | Inshorts
 *
 * Extract the publisher from the end of the title.
 */
function extractPublisherFromTitle(value: unknown): string {
  const raw = cleanText(value);

  if (!raw) {
    return "";
  }

  const pipeMatch = raw.match(/\s+\|\s+([^|]+)$/);

  if (pipeMatch?.[1]) {
    const candidate = cleanText(pipeMatch[1]);

    if (
      candidate &&
      !isGenericSource(candidate) &&
      candidate.length <= 100
    ) {
      return candidate;
    }
  }

  const dashMatch = raw.match(/\s+-\s+([^-|]+)$/);

  if (dashMatch?.[1]) {
    const candidate = cleanText(dashMatch[1]);

    if (
      candidate &&
      !isGenericSource(candidate) &&
      candidate.length <= 100
    ) {
      return candidate;
    }
  }

  return "";
}

function cleanTitle(value: unknown): string {
  let title = cleanText(value);

  if (!title) {
    return "";
  }

  /*
   * Remove known aggregator suffixes first.
   */
  title = title
    .replace(/\s+\|\s+Inshorts.*$/i, "")
    .replace(/\s+-\s+Inshorts.*$/i, "")
    .replace(/\s+\|\s+Google News.*$/i, "")
    .replace(/\s+-\s+Google News.*$/i, "")
    .trim();

  /*
   * If this is a Google News title in the form:
   *
   * "Headline - Publisher"
   *
   * remove the publisher from the displayed headline.
   *
   * We only do this when the ending looks like a real publisher.
   */
  const publisher = extractPublisherFromTitle(title);

  if (publisher) {
    const pipeSuffix = ` | ${publisher}`;
    const dashSuffix = ` - ${publisher}`;

    if (title.endsWith(pipeSuffix)) {
      title = title.slice(0, -pipeSuffix.length).trim();
    } else if (title.endsWith(dashSuffix)) {
      title = title.slice(0, -dashSuffix.length).trim();
    }
  }

  return title;
}

function sourceFromHostname(
  url: string
): string {
  try {
    const hostname = new URL(url).hostname
      .replace(/^www\./i, "")
      .replace(/^m\./i, "")
      .toLowerCase();

    /*
     * Do NOT turn news.google.com into "Google".
     */
    if (
      hostname === "news.google.com" ||
      hostname.endsWith(".google.com")
    ) {
      return "";
    }

    const knownPublishers: Record<string, string> = {
      "indianexpress.com": "The Indian Express",
      "thehindu.com": "The Hindu",
      "hindustantimes.com": "Hindustan Times",
      "ndtv.com": "NDTV",
      "ndtvprofit.com": "NDTV Profit",
      "cnbctv18.com": "CNBC TV18",
      "moneycontrol.com": "Moneycontrol",
      "livemint.com": "Mint",
      "reuters.com": "Reuters",
      "bbc.com": "BBC",
      "bbc.co.uk": "BBC",
      "cnn.com": "CNN",
      "business-standard.com": "Business Standard",
      "businessline.global": "BusinessLine",
      "deccanherald.com": "Deccan Herald",
      "timesofindia.indiatimes.com": "The Times of India",
      "economictimes.indiatimes.com":
        "The Economic Times",
      "economictimes.com": "The Economic Times",
      "theprint.in": "ThePrint",
      "news18.com": "News18",
      "firstpost.com": "Firstpost",
      "thewire.in": "The Wire",
      "scroll.in": "Scroll.in",
      "outlookindia.com": "Outlook India",
      "financialexpress.com": "Financial Express",
      "telegraphindia.com": "The Telegraph",
    };

    if (knownPublishers[hostname]) {
      return knownPublishers[hostname];
    }

    const parts = hostname.split(".");

    if (parts.length >= 2) {
      const name = parts[parts.length - 2];

      return name
        .split(/[-_]/)
        .map(
          (word) =>
            word.charAt(0).toUpperCase() +
            word.slice(1)
        )
        .join(" ");
    }

    return hostname;
  } catch {
    return "";
  }
}

/*
 * This is the important fix.
 *
 * Priority:
 *
 * 1. Real <source> publisher from Google News
 * 2. Publisher extracted from Google News title
 * 3. Publisher derived from article URL
 * 4. "Source" as final fallback
 *
 * Generic "Google" / "Google News" is NEVER returned.
 */
function cleanSource(
  value: unknown,
  url: string,
  title: unknown
): string {
  let source = cleanText(value);

  source = source
    .replace(/\s+\|\s+Inshorts.*$/i, "")
    .replace(/\s+-\s+Inshorts.*$/i, "")
    .replace(/\s+\|\s+Google News.*$/i, "")
    .replace(/\s+-\s+Google News.*$/i, "")
    .trim();

  /*
   * If Google gives us the actual publisher, use it.
   */
  if (
    source &&
    !isGenericSource(source)
  ) {
    return source;
  }

  /*
   * If source was "Google", inspect the title:
   *
   * "What a tripling of India's economy actually demands - The Indian Express"
   *
   * becomes:
   *
   * "The Indian Express"
   */
  const publisherFromTitle =
    extractPublisherFromTitle(title);

  if (
    publisherFromTitle &&
    !isGenericSource(publisherFromTitle)
  ) {
    return publisherFromTitle;
  }

  /*
   * Try the article URL.
   *
   * This is useful when the RSS item contains a real
   * publisher URL rather than a Google News URL.
   */
  const publisherFromUrl =
    sourceFromHostname(url);

  if (publisherFromUrl) {
    return publisherFromUrl;
  }

  return "Source";
}

/* -------------------------------------------------------------------------- */
/* SEARCH TERMS                                                               */
/* -------------------------------------------------------------------------- */

const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "for",
  "with",
  "from",
  "into",
  "about",
  "this",
  "that",
  "these",
  "those",
  "what",
  "when",
  "where",
  "why",
  "how",
  "who",
  "which",
  "latest",
  "news",
  "today",
  "current",
  "recent",
  "recently",
  "update",
  "updates",
  "happening",
  "happen",
  "world",
  "in",
  "on",
  "of",
  "to",
  "is",
  "are",
  "was",
  "were",
  "be",
  "by",
  "as",
  "at",
  "it",
  "its",
  "their",
  "they",
  "them",
  "has",
  "have",
  "had",
]);

function getTerms(query: string): string[] {
  return Array.from(
    new Set(
      normalize(query)
        .split(/\s+/)
        .filter(
          (term) =>
            term.length >= 2 &&
            !STOP_WORDS.has(term)
        )
    )
  );
}

/* -------------------------------------------------------------------------- */
/* ARTICLE RELEVANCE                                                          */
/* -------------------------------------------------------------------------- */

function scoreArticle(
  article: ExploreArticle,
  query: string
): number {
  const terms = getTerms(query);

  if (!terms.length) {
    return 0;
  }

  const title = normalize(article.title);

  const description = normalize(
    article.description
  );

  const fullText =
    `${title} ${description}`;

  let score = 0;

  /*
   * Direct term matching.
   */
  for (const term of terms) {
    if (title.includes(term)) {
      score += 8;
    } else if (
      description.includes(term)
    ) {
      score += 2;
    }
  }

  /*
   * Exact phrase bonus.
   */
  const normalizedQuery =
    normalize(query);

  if (
    normalizedQuery.length > 3 &&
    title.includes(normalizedQuery)
  ) {
    score += 20;
  }

  /*
   * Concept groups.
   */
  const groups = [
    [
      "semiconductor",
      "semiconductors",
      "chip",
      "chips",
      "fab",
      "fabs",
      "foundry",
    ],
    [
      "artificial intelligence",
      "ai",
      "technology",
      "software",
      "data",
    ],
    [
      "india",
      "indian",
      "delhi",
      "government",
      "minister",
    ],
    [
      "trade",
      "tariff",
      "tariffs",
      "export",
      "import",
      "deal",
      "talks",
      "negotiation",
    ],
    [
      "business",
      "company",
      "companies",
      "market",
      "investment",
      "investments",
    ],
    [
      "science",
      "scientific",
      "research",
      "study",
      "space",
      "climate",
    ],
  ];

  for (const group of groups) {
    const queryHasGroup =
      group.some((term) =>
        normalizedQuery.includes(term)
      );

    const articleHasGroup =
      group.some((term) =>
        fullText.includes(term)
      );

    if (
      queryHasGroup &&
      articleHasGroup
    ) {
      score += 4;
    }
  }

  /*
   * Freshness.
   */
  const published =
    Date.parse(
      article.publishedAt
    );

  if (
    Number.isFinite(published)
  ) {
    const ageDays =
      Math.max(
        0,
        (Date.now() - published) /
          86400000
      );

    if (ageDays <= 1) {
      score += 5;
    } else if (ageDays <= 3) {
      score += 3;
    } else if (ageDays <= 7) {
      score += 1;
    }
  }

  return score;
}

/* -------------------------------------------------------------------------- */
/* DEDUPLICATION                                                              */
/* -------------------------------------------------------------------------- */

function dedupe(
  articles: ExploreArticle[]
): ExploreArticle[] {
  const seen = new Set<string>();

  return articles.filter(
    (article) => {
      const key =
        normalize(article.title);

      if (!key || seen.has(key)) {
        return false;
      }

      seen.add(key);

      return true;
    }
  );
}

/* -------------------------------------------------------------------------- */
/* GOOGLE NEWS RSS                                                             */
/* -------------------------------------------------------------------------- */

async function fetchNews(
  query: string
): Promise<ExploreArticle[]> {
  const rssUrl =
    `https://news.google.com/rss/search?q=${encodeURIComponent(
      query
    )}&hl=en-IN&gl=IN&ceid=IN:en`;

  const response =
    await fetch(rssUrl, {
      headers: {
        Accept:
          "application/rss+xml, application/xml, text/xml",
      },
      cache: "no-store",
    });

  if (!response.ok) {
    throw new Error(
      `Google News returned HTTP ${response.status}.`
    );
  }

  const xml =
    await response.text();

  if (!xml.trim()) {
    throw new Error(
      "Google News returned an empty response."
    );
  }

  const feed =
    await parser.parseString(xml);

  const articles =
    (feed.items ?? [])
      .map((item: any) => {
        const url =
          cleanText(item?.link);

        if (!url) {
          return null;
        }

        /*
         * Google News RSS normally exposes:
         *
         * <source url="...">Publisher</source>
         *
         * rss-parser commonly puts the text into
         * item.source._.
         */
        const rawSource =
          item?.source?._ ??
          item?.source?.name ??
          item?.source?.title ??
          item?.creator ??
          "";

        const rawTitle =
          item?.title ?? "";

        const title =
          cleanTitle(rawTitle);

        const source =
          cleanSource(
            rawSource,
            url,
            rawTitle
          );

        const publishedAt =
          cleanText(
            item?.isoDate ??
              item?.pubDate ??
              ""
          );

        const description =
          cleanText(
            item?.contentSnippet ??
              item?.content ??
              item?.description ??
              ""
          );

        return {
          title,
          source,
          publishedAt,
          description,
          url,
        };
      })
      .filter(
        (
          item
        ): item is ExploreArticle =>
          item !== null &&
          item.title.length > 0
      );

  return dedupe(articles);
}

/* -------------------------------------------------------------------------- */
/* GET                                                                         */
/* -------------------------------------------------------------------------- */

export async function GET(
  request: Request
) {
  try {
    const url =
      new URL(request.url);

    const query =
      url.searchParams
        .get("q")
        ?.trim() ?? "";

    if (!query) {
      return NextResponse.json(
        {
          query: "",
          results: [],
        },
        {
          status: 200,
        }
      );
    }

    const articles =
      await fetchNews(query);

    const ranked =
      articles
        .map((article) => ({
          article,
          score:
            scoreArticle(
              article,
              query
            ),
        }))
        .sort(
          (a, b) =>
            b.score - a.score
        );

    /*
     * Only return reasonably relevant
     * results.
     */
    let results =
      ranked
        .filter(
          (item) =>
            item.score >= 4
        )
        .slice(0, 8)
        .map(
          (item) =>
            item.article
        );

    /*
     * If nothing passed the threshold,
     * return the strongest few results.
     */
    if (!results.length) {
      results =
        ranked
          .slice(0, 5)
          .map(
            (item) =>
              item.article
          );
    }

    return NextResponse.json(
      {
        query,
        results,
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "EIRA Explore API error:",
      error
    );

    return NextResponse.json(
      {
        query: "",
        results: [],
        error:
          error instanceof Error
            ? error.message
            : "Explore could not load right now.",
      },
      {
        status: 500,
      }
    );
  }
}