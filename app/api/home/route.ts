import { NextRequest, NextResponse } from 'next/server';

type Story = {
  title: string;
  source: string;
  publishedAt: string;
  description: string;
  url: string;
};

const STATE_CODES: Record<string, string> = {
  AP: 'Andhra Pradesh', AR: 'Arunachal Pradesh', AS: 'Assam', BR: 'Bihar', CT: 'Chhattisgarh',
  GA: 'Goa', GJ: 'Gujarat', HR: 'Haryana', HP: 'Himachal Pradesh', JH: 'Jharkhand',
  KA: 'Karnataka', KL: 'Kerala', MP: 'Madhya Pradesh', MH: 'Maharashtra', MN: 'Manipur',
  ML: 'Meghalaya', MZ: 'Mizoram', NL: 'Nagaland', OD: 'Odisha', PB: 'Punjab',
  RJ: 'Rajasthan', SK: 'Sikkim', TN: 'Tamil Nadu', TG: 'Telangana', TR: 'Tripura',
  UP: 'Uttar Pradesh', UK: 'Uttarakhand', WB: 'West Bengal', DL: 'Delhi', PY: 'Puducherry',
};

const REGION_TERMS: Record<string, string[]> = {
  "Tamil Nadu": [
    "tamil nadu",
    "chennai",
    "coimbatore",
    "madurai",
    "tiruchirappalli",
    "trichy",
    "salem",
    "tiruppur",
    "erode",
    "vellore",
    "thoothukudi",
    "tirunelveli",
    "kanchipuram",
  ],
  Karnataka: [
    "karnataka",
    "bengaluru",
    "bangalore",
    "mysuru",
    "mysore",
    "mangaluru",
    "hubballi",
  ],
  Kerala: [
    "kerala",
    "kochi",
    "thiruvananthapuram",
    "kozhikode",
    "thrissur",
  ],
  Maharashtra: [
    "maharashtra",
    "mumbai",
    "pune",
    "nagpur",
    "nashik",
  ],
  Telangana: [
    "telangana",
    "hyderabad",
    "warangal",
  ],
  "Andhra Pradesh": [
    "andhra pradesh",
    "visakhapatnam",
    "vijayawada",
    "tirupati",
  ],
  Delhi: [
    "delhi",
    "new delhi",
  ],
  Gujarat: [
    "gujarat",
    "ahmedabad",
    "surat",
    "vadodara",
  ],
  "West Bengal": [
    "west bengal",
    "kolkata",
    "howrah",
  ],
  Rajasthan: [
    "rajasthan",
    "jaipur",
    "jodhpur",
    "udaipur",
  ],
  "Uttar Pradesh": [
    "uttar pradesh",
    "lucknow",
    "kanpur",
    "noida",
    "varanasi",
    "agra",
  ],
  "Madhya Pradesh": [
    "madhya pradesh",
    "bhopal",
    "indore",
    "jabalpur",
  ],
  Odisha: [
    "odisha",
    "bhubaneswar",
    "cuttack",
  ],
  Punjab: [
    "punjab",
    "amritsar",
    "ludhiana",
    "chandigarh",
  ],
  Bihar: [
    "bihar",
    "patna",
    "gaya",
  ],
  Assam: [
    "assam",
    "guwahati",
  ],
  Goa: [
    "goa",
    "panaji",
  ],
  Haryana: [
    "haryana",
    "gurugram",
    "gurgaon",
    "faridabad",
  ],
  Jharkhand: [
    "jharkhand",
    "ranchi",
    "jamshedpur",
  ],
  Chhattisgarh: [
    "chhattisgarh",
    "raipur",
    "bilaspur",
  ],
};

function decodeXml(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/gi, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));

}

function stripHtml(value: string) {
  return decodeXml(value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function extract(tag: string, item: string) {
  const match = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? stripHtml(match[1]) : '';
}

function sourceFromTitle(title: string) {
  const parts = title.split(' - ');
  if (parts.length > 1) return parts[parts.length - 1].trim();
  return 'Current reporting';
}

function cleanHeadline(title: string) {
  let value = title
    .replace(/\s*\|\s*(?:India|Indian|World|Latest|Breaking|Live)\s+News(?:\s+Updates?)?\s*$/i, '')
    .replace(/\s*\|\s*(?:Latest|Breaking|Live)\s+Updates?\s*$/i, '')
    .replace(/\s*[-–—]\s*(?:Latest|Breaking|Live)\s+News(?:\s+Updates?)?\s*$/i, '')
    .replace(/\s*[-–—]\s*(?:Latest|Breaking|Live)\s+Updates?\s*$/i, '')
    .replace(/\s*\|\s*(?:News|Updates?)\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  value = value
    .replace(/\s*\|\s*(?:India|Indian|World)\s*$/i, '')
    .replace(/\s*[-–—]\s*(?:India|Indian|World)\s+News\s*$/i, '')
    .trim();

  return value;
}

function headlineWithoutSource(title: string) {
  const parts = title.split(' - ');
  const headline =
    parts.length > 1
      ? parts.slice(0, -1).join(' - ').trim()
      : title.trim();

  return cleanHeadline(headline);
}

function cleanDescription(description: string, title: string, source: string) {
  let value = stripHtml(description);
  const titleText = cleanHeadline(title);

  if (titleText) {
    const escapedTitle = titleText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    value = value.replace(new RegExp(`^${escapedTitle}\\s*[-:|–—]?\\s*`, 'i'), '').trim();
  }

  if (source) {
    const escapedSource = source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    value = value.replace(new RegExp(`\\s*[-:|–—]?\\s*${escapedSource}\\s*$`, 'i'), '').trim();
  }

  return value
    .replace(/\s*[-:|–—]+\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchGoogleNews(query: string) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`;
  const response = await fetch(url, { cache: 'no-store', headers: { 'User-Agent': 'EIRA/1.0' } });
  if (!response.ok) throw new Error(`News source returned ${response.status}.`);
  const xml = await response.text();
  const items = xml.match(/<item>[\s\S]*?<\/item>/gi) ?? [];
  return items.map((item): Story => {
    const rawTitle = extract('title', item);
    const source = sourceFromTitle(rawTitle);
    const title = headlineWithoutSource(rawTitle);
    return {
      title,
      source,
      publishedAt: extract('pubDate', item),
      description: cleanDescription(extract('description', item), title, source),
      url: extract('link', item),
    };
  }).filter((story) => story.title && story.url);
}

const STOP_WORDS = new Set([
  'the','a','an','and','or','of','to','in','on','for','from','with','as','at',
  'by','is','are','was','were','be','has','have','had','this','that','these',
  'those','after','before','into','over','its','their','his','her','new','news',
  'latest','live','update','updates'
]);

function tokens(value: string) {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length > 2 && !STOP_WORDS.has(token))
  );
}

function similarity(a: Story, b: Story) {
  if (a.url && b.url && a.url === b.url) return 1;

  const aTokens = tokens(a.title);
  const bTokens = tokens(b.title);
  if (!aTokens.size || !bTokens.size) return 0;

  let shared = 0;
  for (const token of aTokens) {
    if (bTokens.has(token)) shared++;
  }

  const union = new Set([...aTokens, ...bTokens]).size;
  const jaccard = shared / union;
  const smaller = Math.min(aTokens.size, bTokens.size);
  const containment = smaller ? shared / smaller : 0;

  return Math.max(jaccard, containment * 0.85);
}

function dedupe(stories: Story[]) {
  const result: Story[] = [];

  for (const story of stories) {
    if (result.some((existing) => similarity(existing, story) >= 0.72)) continue;
    result.push(story);
  }

  return result;
}

function hoursOld(value: string) {
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return 72;
  return Math.max(0, (Date.now() - time) / 3600000);
}

const IMPORTANCE_TERMS = [
  'government','minister','ministry','court','supreme court','high court',
  'parliament','bill','law','policy','decision','approves','approved',
  'announces','announced','ban','bans','protest','strike','election','budget',
  'economy','market','trade','tariff','investment','infrastructure','railway',
  'airport','power','energy','flood','cyclone','earthquake','fire','accident',
  'health','hospital','outbreak','security','border','education','schools',
  'universities'
];

const LOW_VALUE_TERMS = [
  'horoscope','astrology','viral video','viral','trending','lottery',
  'box office','celebrity','fashion','recipe','tourism','travel guide',
  'conference','festival','photos','look','watch'
];

const STRONG_SOURCE_TERMS = [
  'reuters','associated press','bbc','the hindu','indian express',
  'hindustan times','times of india','ndtv','deccan herald',
  'business standard','mint','cnbc'
];

function sourceQuality(source: string) {
  return STRONG_SOURCE_TERMS.some((term) =>
    source.toLowerCase().includes(term)
  ) ? 4 : 0;
}

function baseImportanceScore(story: Story) {
  const text = `${story.title} ${story.description}`.toLowerCase();
  let score = 0;

  for (const term of IMPORTANCE_TERMS) {
    if (text.includes(term)) score += 2;
  }

  for (const term of LOW_VALUE_TERMS) {
    if (text.includes(term)) score -= 7;
  }

  score += sourceQuality(story.source);

  const age = hoursOld(story.publishedAt);
  if (age <= 6) score += 7;
  else if (age <= 12) score += 5;
  else if (age <= 24) score += 3;
  else if (age <= 48) score += 1;

  return score;
}

function rankRegional(stories: Story[], region: string) {
  const terms = (REGION_TERMS[region] || [region]).map((term) =>
    term.toLowerCase()
  );

  return dedupe(stories)
    .map((story) => {
      const title = story.title.toLowerCase();
      const description = story.description.toLowerCase();
      let score = baseImportanceScore(story);
      let titleRegionHits = 0;
      let bodyRegionHits = 0;

      for (const term of terms) {
        if (title.includes(term)) {
          titleRegionHits++;
          score += term === region.toLowerCase() ? 15 : 10;
        }

        if (description.includes(term)) {
          bodyRegionHits++;
          score += 2;
        }
      }

      // Regional results should actually be about the region,
      // not merely mention it somewhere in the article.
      if (titleRegionHits === 0) score -= 14;
      if (titleRegionHits === 0 && bodyRegionHits === 0) score -= 25;

      return { story, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((item) => item.story);
}

function rankIndia(stories: Story[]) {
  const terms = [
    'india','indian government','new delhi','parliament',
    'supreme court','rbi','election','government','minister',
    'economy','trade'
  ];

  return dedupe(stories)
    .map((story) => {
      const text = `${story.title} ${story.description}`.toLowerCase();
      let score = baseImportanceScore(story);

      for (const term of terms) {
        if (text.includes(term)) score += 3;
      }

      return { story, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((item) => item.story);
}

function rankWorld(stories: Story[]) {
  const terms = [
    'united states','china','russia','ukraine','gaza','israel',
    'europe','global','world','trump','iran','japan','south korea'
  ];

  return dedupe(stories)
    .map((story) => {
      const text = `${story.title} ${story.description}`.toLowerCase();
      let score = baseImportanceScore(story);

      for (const term of terms) {
        if (text.includes(term)) score += 3;
      }

      return { story, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((item) => item.story);
}

function selectUnique(
  candidates: Story[],
  limit: number,
  alreadyShown: Story[] = []
) {
  const selected: Story[] = [];

  for (const story of candidates) {
    if (alreadyShown.some((existing) => similarity(existing, story) >= 0.58)) {
      continue;
    }

    if (selected.some((existing) => similarity(existing, story) >= 0.58)) {
      continue;
    }

    selected.push(story);

    if (selected.length >= limit) break;
  }

  return selected;
}

function detectRegion(request: NextRequest) {
  const regionCode = request.headers.get('x-vercel-ip-country-region');
  if (regionCode) {
    const code = regionCode.split('-').pop()?.toUpperCase() || '';
    if (STATE_CODES[code]) return STATE_CODES[code];
  }

  return 'India';
}

export async function GET(request: NextRequest) {
  try {
    const region = detectRegion(request);
    const regionalQueries = region !== 'India'
      ? [
          `\"${region}\" news when:2d`,
          `\"${region}\" latest news when:2d`,
          `\"${region}\" government news when:3d`,
        ]
      : ['India latest news when:2d'];

    const [regionalRaw, indiaRaw, worldRaw] = await Promise.all([
      Promise.all(regionalQueries.map(fetchGoogleNews))
        .then((sets) => dedupe(sets.flat())),
      fetchGoogleNews('India latest news when:2d'),
      fetchGoogleNews('world latest news when:2d'),
    ]);

    const regional =
      region === 'India'
        ? []
        : selectUnique(
            rankRegional(regionalRaw, region),
            3
          );

    const india = selectUnique(
      rankIndia(indiaRaw),
      3,
      regional
    );

    const world = selectUnique(
      rankWorld(worldRaw),
      2,
      [...regional, ...india]
    );

    return NextResponse.json(
      {
        region,
        regionCode:
          Object.entries(STATE_CODES).find(
            ([, name]) => name === region
          )?.[0] || '',
        regional,
        india,
        world,
        retrievedAt: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    console.error('EIRA Home API error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not load current news.' }, { status: 500 });
  }
}
