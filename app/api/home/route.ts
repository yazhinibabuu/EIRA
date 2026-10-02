import { NextRequest, NextResponse } from 'next/server';
import { getLanguageFromRequest, translateHomeStories } from '@/utils/eira-translate';

type Story = {
  title: string;
  source: string;
  publishedAt: string;
  description: string;
  url: string;
  image: string;
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
  'Tamil Nadu': ['tamil nadu','chennai','coimbatore','madurai','tiruchirappalli','trichy','salem','tiruppur','erode','vellore','thoothukudi','tirunelveli','kanchipuram','cuddalore','thanjavur','dindigul','virudhunagar','sivaganga','ramanathapuram','pudukkottai','namakkal','krishnagiri','dharmapuri','karur','ariyalur','perambalur','nagapattinam','mayiladuthurai','nilgiris'],
  Karnataka: ['karnataka','bengaluru','bangalore','mysuru','mysore','mangaluru','hubballi','belagavi','dharwad','shivamogga','tumakuru','ballari'],
  Kerala: ['kerala','kochi','thiruvananthapuram','kozhikode','thrissur','kannur','kollam','alappuzha','palakkad','kottayam','malappuram'],
  Maharashtra: ['maharashtra','mumbai','pune','nagpur','nashik','thane','aurangabad','chhatrapati sambhajinagar','kolhapur','navi mumbai'],
  Telangana: ['telangana','hyderabad','warangal','secunderabad','nizamabad','karimnagar'],
  'Andhra Pradesh': ['andhra pradesh','visakhapatnam','vijayawada','tirupati','guntur','nellore','kakinada','amaravati'],
  Delhi: ['delhi','new delhi'],
  Gujarat: ['gujarat','ahmedabad','surat','vadodara','rajkot','gandhinagar','bhavnagar'],
  'West Bengal': ['west bengal','kolkata','howrah','siliguri','durgapur'],
  Rajasthan: ['rajasthan','jaipur','jodhpur','udaipur','kota','ajmer','bikaner'],
  'Uttar Pradesh': ['uttar pradesh','lucknow','kanpur','noida','varanasi','agra','ghaziabad','meerut','prayagraj','ayodhya'],
  'Madhya Pradesh': ['madhya pradesh','bhopal','indore','jabalpur','gwalior','ujjain'],
  Odisha: ['odisha','bhubaneswar','cuttack','rourkela','puri','sambalpur'],
  Punjab: ['punjab','amritsar','ludhiana','chandigarh','jalandhar','patiala'],
  Bihar: ['bihar','patna','gaya','muzaffarpur','bhagalpur','darbhanga'],
  Assam: ['assam','guwahati','dibrugarh','silchar'],
  Goa: ['goa','panaji','margao'],
  Haryana: ['haryana','gurugram','gurgaon','faridabad','panipat','ambala'],
  Jharkhand: ['jharkhand','ranchi','jamshedpur','dhanbad','bokaro'],
  Chhattisgarh: ['chhattisgarh','raipur','bilaspur','durg','bhilai'],
};

const STOP_WORDS = new Set([
  'the','a','an','and','or','of','to','in','on','for','from','with','as','at','by','is','are','was','were','be','been','has','have','had',
  'this','that','these','those','after','before','into','over','its','their','his','her','new','news','latest','live','update','updates',
  'says','said','will','would','could','may','might','gets','get','one','two','three','first','second','top','today','day','report','reports',
  'according','amid','amidst','via','also','more','than','now','just','how','what','why','when','where','here','there'
]);

const IMPORTANCE_GROUPS: Array<{ terms: string[]; points: number; topic: string }> = [
  { topic: 'courts', points: 12, terms: ['supreme court','high court','court ruling','court order','judgment','judgement','verdict','legal challenge','court directs','court asks','court seeks'] },
  { topic: 'disaster', points: 12, terms: ['flood','flooding','cyclone','earthquake','landslide','tsunami','evacuation','evacuated','red alert','orange alert','disaster','extreme rain','heavy rain','severe weather'] },
  { topic: 'public-safety', points: 10, terms: ['security','terror','attack','explosion','accident','fire','rescue','missing','police','crime','pocso','rape','sexual assault'] },
  { topic: 'government', points: 9, terms: ['government','minister','ministry','cabinet','chief minister','policy','decision','approves','approved','announces','announced','bill','law','rule','regulation','order'] },
  { topic: 'economy', points: 9, terms: ['economy','inflation','rbi','interest rate','market','trade','tariff','investment','jobs','employment','tax','budget','exports','imports'] },
  { topic: 'infrastructure', points: 8, terms: ['infrastructure','railway','railways','metro','airport','highway','road project','bridge','port','power','energy','water project','sewer','sewage'] },
  { topic: 'health', points: 8, terms: ['health','hospital','outbreak','epidemic','disease','virus','vaccination','vaccine','public health'] },
  { topic: 'education', points: 6, terms: ['education','school','schools','university','universities','exam','students','college','neet'] },
  { topic: 'business', points: 6, terms: ['company','business','merger','acquisition','startup','industry','factory','manufacturing','layoff','ipo'] },
  { topic: 'weather', points: 2, terms: ['rain','rainfall','showers','weather','heatwave','temperature','thunderstorm','wind'] },
];

const ROUNDUP_TITLE_PATTERNS = [
  /school assembly/i, /top headlines/i, /^top news/i, /morning news/i, /evening news/i,
  /news roundup/i, /news round-up/i, /weekly roundup/i, /weekly round-up/i, /daily roundup/i,
  /daily round-up/i, /headlines today/i, /top india/i, /top international/i, /\b10 things\b/i,
  /things to know/i, /news in 10/i, /major headlines/i, /breaking news live/i, /live updates/i,
  /all you need to know/i, /what happened today/i, /latest news.*headlines/i,
];

const LOW_VALUE_TERMS = [
  'horoscope','astrology','viral video','viral','trending','lottery','box office','celebrity','fashion','recipe','tourism','travel guide',
  'photos','look','watch','entertainment','lifestyle','movie review','memorial','tribute','anniversary','inauguration','award ceremony',
  'birthday','wedding','festival celebration'
];

const STRONG_SOURCE_TERMS = [
  'reuters','associated press','bbc','the hindu','indian express','hindustan times','times of india','ndtv','deccan herald',
  'business standard','mint','cnbc','the indian express','new indian express'
];

const LOW_QUALITY_SOURCE_PATTERNS = [
  'instagram', 'facebook', 'youtube', 'x.com', 'twitter', 'blogspot', 'wordpress',
  'pinterest', 'telegram', 'tiktok', 'quora'
];

const ANALYSIS_TITLE_PATTERNS = [
  /what it means/i, /why it matters/i, /explained/i, /analysis/i, /outlook/i,
  /remains resilient/i, /what to know/i, /how .* could/i, /how .* may/i
];

const NATIONAL_SIGNALS = [
  'india', 'indian government', 'central government', 'union government', 'new delhi',
  'parliament', 'supreme court', 'rbi', 'reserve bank', 'nationwide', 'across india',
  'ministry of', 'union cabinet', 'cabinet approves', 'national policy', 'indian railways',
  'lok sabha', 'rajya sabha'
];

const ACTION_TERMS = [
  'orders','ordered','approves','approved','announces','announced','allows','blocks','bans','clears','signs','signed','moves',
  'seeks','asks','directs','launches','starts','suspends','resumes','rules','ruled','rejects','reject','sets','raises','cuts','extends'
];

const CONSEQUENCE_TERMS = [
  'affects','affecting','impact','impacts','public','residents','districts','nationwide','across the state','across india','thousands',
  'crore','billion','million','tariff','investment','deadline','effective from','will affect','will impact','disruption','shutdown'
];

function decodeXml(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));
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
  return parts.length > 1 ? parts[parts.length - 1].trim() : 'Current reporting';
}

function cleanHeadline(title: string) {
  return title
    .replace(/\s*\|\s*(?:India|Indian|World|Latest|Breaking|Live)\s+News(?:\s+Updates?)?\s*$/i, '')
    .replace(/\s*\|\s*(?:Latest|Breaking|Live)\s+Updates?\s*$/i, '')
    .replace(/\s*[-–—]\s*(?:Latest|Breaking|Live)\s+News(?:\s+Updates?)?\s*$/i, '')
    .replace(/\s*[-–—]\s*(?:Latest|Breaking|Live)\s+Updates?\s*$/i, '')
    .replace(/\s*\|\s*(?:News|Updates?)\s*$/i, '')
    .replace(/\s*\|\s*(?:India|Indian|World)\s*$/i, '')
    .replace(/\s*[-–—]\s*(?:India|Indian|World)\s+News\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function headlineWithoutSource(title: string) {
  const parts = title.split(' - ');
  return cleanHeadline(parts.length > 1 ? parts.slice(0, -1).join(' - ').trim() : title.trim());
}

function isUsableImageUrl(value: string) {
  if (!value) return false;
  const raw = decodeXml(value).trim();
  if (!/^https?:\/\//i.test(raw)) return false;

  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase();
    const path = `${host}${url.pathname}`.toLowerCase();

    // Google News RSS can expose Google's own placeholder/logo instead of
    // the publisher's article image. Never send those through to the UI.
    if (
      host === 'news.google.com' ||
      host.endsWith('.google.com') ||
      host === 'google.com' ||
      host.endsWith('.googleusercontent.com') ||
      host.endsWith('.gstatic.com') ||
      path.includes('/images/srpr/logo') ||
      path.includes('google-logo') ||
      path.includes('google_news')
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

function extractImageUrl(item: string) {
  const candidates = [
    item.match(/<img[^>]*\bclass=["'][^"']*type:primaryImage[^"']*["'][^>]*\bsrc=["']([^"']+)["']/i)?.[1],
    item.match(/<img[^>]*\bsrc=["']([^"']+)["'][^>]*\bclass=["'][^"']*type:primaryImage[^"']*["']/i)?.[1],
    item.match(/<(?:media:content|media:thumbnail)[^>]*\burl=["']([^"']+)["']/i)?.[1],
    item.match(/<enclosure[^>]*\burl=["']([^"']+)["'][^>]*\btype=["']image\/[^"]+["']/i)?.[1],
    item.match(/<img[^>]*\bsrc=["']([^"']+)["']/i)?.[1],
  ];

  for (const candidate of candidates) {
    const image = candidate ? decodeXml(candidate).trim() : '';
    if (isUsableImageUrl(image)) return image;
  }

  return '';
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
  return value.replace(/\s*[-:|–—]+\s*$/g, '').replace(/\s+/g, ' ').trim();
}

async function fetchGoogleNews(query: string): Promise<Story[]> {
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
      image: extractImageUrl(item),
    };
  }).filter((story) => story.title && story.url);
}

async function fetchArticleImage(url: string) {
  if (!url) return '';

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/154 Safari/537.36 EIRA/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-IN,en;q=0.9',
      },
      signal: AbortSignal.timeout(3500),
    });

    if (!response.ok) return '';

    const html = (await response.text()).slice(0, 900000);

    // Prefer the publisher's Open Graph image. Publishers commonly put the
    // meta attributes in either property/content order, so handle both.
    const patterns = [
      /<meta[^>]+property=["']og:image(?::secure_url|:url)?["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url|:url)?["']/i,
      /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["']/i,
      /<link[^>]+rel=["'][^"']*image_src[^"']*["'][^>]+href=["']([^"']+)["']/i,
      /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'][^"']*image_src[^"']*["']/i,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (!match?.[1]) continue;

      const candidate = decodeXml(match[1].trim());
      try {
        const absolute = new URL(candidate, response.url).href;
        if (isUsableImageUrl(absolute)) return absolute;
      } catch {}
    }

    // Some publishers expose the lead image only through JSON-LD.
    const jsonLdMatches = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) ?? [];
    for (const block of jsonLdMatches) {
      const jsonText = block
        .replace(/^<script[^>]*>/i, '')
        .replace(/<\/script>$/i, '')
        .trim();
      try {
        const parsed = JSON.parse(jsonText);
        const queue = Array.isArray(parsed) ? [...parsed] : [parsed];

        while (queue.length) {
          const node = queue.shift();
          if (!node || typeof node !== 'object') continue;

          const image = (node as { image?: unknown }).image;
          if (typeof image === 'string') {
            const absolute = new URL(decodeXml(image), response.url).href;
            if (isUsableImageUrl(absolute)) return absolute;
          } else if (Array.isArray(image)) {
            for (const value of image) {
              if (typeof value !== 'string') continue;
              const absolute = new URL(decodeXml(value), response.url).href;
              if (isUsableImageUrl(absolute)) return absolute;
            }
          } else if (image && typeof image === 'object') {
            const imageUrl = (image as { url?: unknown; contentUrl?: unknown }).url
              ?? (image as { url?: unknown; contentUrl?: unknown }).contentUrl;
            if (typeof imageUrl === 'string') {
              const absolute = new URL(decodeXml(imageUrl), response.url).href;
              if (isUsableImageUrl(absolute)) return absolute;
            }
          }

          const graph = (node as { '@graph'?: unknown })['@graph'];
          if (Array.isArray(graph)) queue.push(...graph);
        }
      } catch {}
    }
  } catch {}

  return '';
}

async function fetchSearchImage(story: Story) {
  const query = `${story.title} ${story.source}`.trim();
  if (!query) return '';

  try {
    const searchUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`;
    const response = await fetch(searchUrl, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/154 Safari/537.36 EIRA/1.0',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-IN,en;q=0.9',
      },
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) return '';

    const html = await response.text();
    const candidates = new Set<string>();

    // Google Images embeds source image URLs in several JSON/HTML forms.
    const patterns = [
      /https?:\\?\/\\?\/[^"'\\\s<>]+\.(?:jpg|jpeg|png|webp)(?:\?[^"'\\\s<>]*)?/gi,
      /https?:\/\/[^"'\s<>]+\.(?:jpg|jpeg|png|webp)(?:\?[^"'\s<>]*)?/gi,
    ];

    for (const pattern of patterns) {
      for (const match of html.matchAll(pattern)) {
        const raw = match[0]
          .replace(/\\\//g, '/')
          .replace(/\\u003d/g, '=')
          .replace(/\\u0026/g, '&')
          .replace(/\\u003f/g, '?');
        if (isUsableImageUrl(raw)) candidates.add(raw);
        if (candidates.size >= 12) break;
      }
      if (candidates.size >= 12) break;
    }

    // Prefer non-Google-hosted images. Google thumbnails are often generic
    // placeholders and are not useful as story artwork.
    for (const candidate of candidates) {
      try {
        const host = new URL(candidate).hostname.toLowerCase();
        if (!host.includes('google.') && !host.includes('gstatic.') && !host.includes('googleusercontent.')) {
          return candidate;
        }
      } catch {}
    }
  } catch {}

  return '';
}

async function attachArticleImages(stories: Story[]) {
  return Promise.all(stories.map(async (story) => {
    const rssImage = isUsableImageUrl(story.image) ? story.image : '';
    if (rssImage) return { ...story, image: rssImage };

    const articleImage = await fetchArticleImage(story.url);
    if (articleImage) return { ...story, image: articleImage };

    // Last-resort editorial image lookup. This is only used when the publisher
    // blocks metadata fetching, so cards never fall back to a generic Google
    // placeholder. The query is the actual story headline + source.
    const searchImage = await fetchSearchImage(story);
    return { ...story, image: searchImage };
  }));
}

function normalizeToken(token: string) {
  let value = token.toLowerCase();
  for (const [pattern, replacement] of [[/ies$/, 'y'], [/ves$/, 'f'], [/ing$/, ''], [/ed$/, ''], [/es$/, ''], [/s$/, '']] as Array<[RegExp,string]>) {
    if (value.length > 4 && pattern.test(value)) {
      value = value.replace(pattern, replacement);
      break;
    }
  }
  return value;
}

function tokens(value: string) {
  return new Set(value.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).map(normalizeToken).filter((token) => token.length > 2 && !STOP_WORDS.has(token)));
}

function storyText(story: Story) {
  return `${story.title} ${story.description}`;
}

function similarity(a: Story, b: Story) {
  if (a.url && b.url && a.url === b.url) return 1;
  const aTokens = tokens(storyText(a));
  const bTokens = tokens(storyText(b));
  if (!aTokens.size || !bTokens.size) return 0;

  let shared = 0;
  for (const token of aTokens) if (bTokens.has(token)) shared++;
  const union = new Set([...aTokens, ...bTokens]).size;
  const jaccard = shared / union;
  const smaller = Math.min(aTokens.size, bTokens.size);
  const containment = smaller ? shared / smaller : 0;

  const aTitle = tokens(a.title);
  const bTitle = tokens(b.title);
  let titleShared = 0;
  for (const token of aTitle) if (bTitle.has(token)) titleShared++;
  const titleSmaller = Math.min(aTitle.size, bTitle.size);
  const titleContainment = titleSmaller ? titleShared / titleSmaller : 0;

  if (shared >= 5 && containment >= 0.38) return Math.max(jaccard, 0.82);
  if (titleShared >= 3 && titleContainment >= 0.6) return Math.max(jaccard, 0.78);
  if (shared >= 3 && containment >= 0.62) return Math.max(jaccard, 0.76);
  return Math.max(jaccard, containment * 0.85, titleContainment * 0.72);
}

function dedupe(stories: Story[]) {
  const result: Story[] = [];
  for (const story of stories) {
    if (result.some((existing) => similarity(existing, story) >= 0.76)) continue;
    result.push(story);
  }
  return result;
}

function hoursOld(value: string) {
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return 72;
  return Math.max(0, (Date.now() - time) / 3600000);
}

function sourceQuality(source: string) {
  const normalized = source.toLowerCase();
  if (LOW_QUALITY_SOURCE_PATTERNS.some((term) => normalized.includes(term))) return 0;
  if (STRONG_SOURCE_TERMS.some((term) => normalized.includes(term))) return 3;
  return 1;
}

function isLowQualitySource(source: string) {
  const normalized = source.toLowerCase();
  return LOW_QUALITY_SOURCE_PATTERNS.some((term) => normalized.includes(term));
}

function isAnalysisHeadline(story: Story) {
  return ANALYSIS_TITLE_PATTERNS.some((pattern) => pattern.test(story.title));
}

const PRIMARY_FRESH_HOURS = 24;
const MAX_HOME_AGE_HOURS = 36;

function isCurrentHomeStory(story: Story) {
  return hoursOld(story.publishedAt) <= MAX_HOME_AGE_HOURS;
}

function isPrimaryFreshStory(story: Story) {
  return hoursOld(story.publishedAt) <= PRIMARY_FRESH_HOURS;
}

function hasNationalSignal(story: Story) {
  const text = storyText(story).toLowerCase();
  return NATIONAL_SIGNALS.some((term) => text.includes(term));
}

function hasStateOnlySignal(story: Story) {
  const text = storyText(story).toLowerCase();
  const matchedStates = Object.values(REGION_TERMS).filter((terms) =>
    terms.some((term) => text.includes(term.toLowerCase()))
  ).length;
  return matchedStates === 1 && !hasNationalSignal(story);
}

function shortenHeadline(value: string, maxLength = 180) {
  const clean = cleanHeadline(value);
  if (clean.length <= maxLength) return clean;
  const clipped = clean.slice(0, maxLength + 1).replace(/\s+\S*$/, '').trim();
  return `${clipped}…`;
}

function isRoundup(story: Story) {
  // Only inspect the headline. Descriptions often contain phrases such as
  // "latest news" even when the article itself is a real event.
  return ROUNDUP_TITLE_PATTERNS.some((pattern) => pattern.test(story.title));
}

function classifyTopic(story: Story) {
  const text = storyText(story).toLowerCase();
  let bestTopic = 'general';
  let bestPoints = 0;
  for (const group of IMPORTANCE_GROUPS) {
    const hits = group.terms.filter((term) => text.includes(term)).length;
    if (hits > 0) {
      const score = group.points + Math.min(hits - 1, 3) * 2;
      if (score > bestPoints) {
        bestPoints = score;
        bestTopic = group.topic;
      }
    }
  }
  return bestTopic;
}

function baseImportanceScore(story: Story) {
  const text = storyText(story).toLowerCase();
  if (isRoundup(story)) return -100;
  if (!isCurrentHomeStory(story)) return -40;

  let score = 0;
  for (const group of IMPORTANCE_GROUPS) {
    const hits = group.terms.filter((term) => text.includes(term)).length;
    if (hits > 0) score += group.points + Math.min(hits - 1, 3) * 2;
  }

  for (const term of LOW_VALUE_TERMS) if (text.includes(term)) score -= 9;
  if (classifyTopic(story) === 'weather') score -= 4;
  if (isAnalysisHeadline(story)) score -= 8;

  score += ACTION_TERMS.filter((term) => text.includes(term)).length * 2;
  score += CONSEQUENCE_TERMS.filter((term) => text.includes(term)).length * 2;
  score += sourceQuality(story.source) * 2;

  const age = hoursOld(story.publishedAt);
  if (age <= 3) score += 16;
  else if (age <= 6) score += 13;
  else if (age <= 12) score += 10;
  else if (age <= 18) score += 8;
  else if (age <= 24) score += 6;
  else if (age <= 30) score += 3;
  else score -= 2;

  return score;
}

function regionalRelevance(story: Story, region: string) {
  const terms = (REGION_TERMS[region] || [region]).map((term) => term.toLowerCase());
  const title = story.title.toLowerCase();
  const description = story.description.toLowerCase();
  let score = 0;
  let titleHits = 0;
  let bodyHits = 0;

  for (const term of terms) {
    if (title.includes(term)) {
      titleHits++;
      score += term === region.toLowerCase() ? 20 : 12;
    }
    if (description.includes(term)) {
      bodyHits++;
      score += 2;
    }
  }
  return { score, titleHits, bodyHits };
}

function eventScore(story: Story) {
  const text = storyText(story).toLowerCase();
  let score = baseImportanceScore(story);

  // A story describing a concrete decision, ruling, disruption, project,
  // warning or measurable consequence is more valuable to EIRA than a
  // personality/ceremonial story.
  const strongEventTerms = [
    'court orders','court allows','court directs','court seeks','government approves','government orders',
    'cabinet approves','policy takes effect','tariff takes effect','warning issued','red alert issued',
    'evacuated','evacuation','project worth','crore project','billion investment','deadline','effective from'
  ];
  score += strongEventTerms.filter((term) => text.includes(term)).length * 4;

  const personalityTerms = ['actor','actress','singer','celebrity','leader pays tribute'];
  score -= personalityTerms.filter((term) => text.includes(term)).length * 4;

  return score;
}

function rankRegional(stories: Story[], region: string) {
  return dedupe(stories)
    .filter((story) => !isRoundup(story) && isCurrentHomeStory(story) && !isLowQualitySource(story.source))
    .map((story) => {
      const relevance = regionalRelevance(story, region);
      let score = eventScore(story) + relevance.score;

      if (relevance.titleHits === 0) score -= 22;
      if (relevance.titleHits === 0 && relevance.bodyHits === 0) score -= 40;
      if (isAnalysisHeadline(story)) score -= 10;
      if (LOW_VALUE_TERMS.some((term) => storyText(story).toLowerCase().includes(term))) score -= 8;
      if (sourceQuality(story.source) >= 3) score += 3;

      return { story, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((item) => item.story);
}

function rankIndia(stories: Story[]) {
  const terms = ['india','indian government','new delhi','parliament','supreme court','rbi','election','government','minister','economy','trade','budget','policy','law'];
  return dedupe(stories)
    .filter((story) => !isRoundup(story) && isCurrentHomeStory(story) && !hasStateOnlySignal(story))
    .map((story) => {
      const text = storyText(story).toLowerCase();
      let score = eventScore(story);
      for (const term of terms) if (text.includes(term)) score += 3;
      if (hasNationalSignal(story)) score += 8;
      if (isAnalysisHeadline(story)) score -= 10;
      if (isLowQualitySource(story.source)) score -= 15;
      if (sourceQuality(story.source) >= 3) score += 3;
      return { story, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((item) => item.story);
}

function rankWorld(stories: Story[]) {
  const worldTerms = ['united states','china','russia','ukraine','gaza','israel','europe','global','world','trump','iran','japan','south korea','nato','united nations','middle east','gulf','oil','strait of hormuz'];
  const indiaOnlyTerms = ['india','indian government','new delhi','tamil nadu','karnataka','kerala','maharashtra','andhra pradesh','telangana'];

  return dedupe(stories)
    .filter((story) => !isRoundup(story) && isCurrentHomeStory(story))
    .map((story) => {
      const text = storyText(story).toLowerCase();
      let score = eventScore(story);
      for (const term of worldTerms) if (text.includes(term)) score += 3;
      const hasWorldSignal = worldTerms.some((term) => text.includes(term));
      const hasIndiaSignal = indiaOnlyTerms.some((term) => text.includes(term));
      if (hasIndiaSignal && !hasWorldSignal) score -= 30;
      if (isAnalysisHeadline(story)) score -= 10;
      if (isLowQualitySource(story.source)) score -= 15;
      if (sourceQuality(story.source) >= 3) score += 3;
      return { story, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((item) => item.story);
}

function selectUnique(candidates: Story[], limit: number, alreadyShown: Story[] = []) {
  const selected: Story[] = [];
  const topics = new Set<string>();

  for (const story of candidates) {
    if (isRoundup(story)) continue;
    if (alreadyShown.some((existing) => similarity(existing, story) >= 0.68)) continue;
    if (selected.some((existing) => similarity(existing, story) >= 0.68)) continue;

    // Preserve the ranking order. Topic diversity is only a tie-breaker:
    // importance must never be sacrificed just to make the cards look varied.
    const topic = classifyTopic(story);
    if (topics.has(topic) && selected.length < limit - 1) {
      const laterAlternative = candidates.slice(candidates.indexOf(story) + 1).find((candidate) => {
        if (classifyTopic(candidate) === topic) return false;
        if (alreadyShown.some((existing) => similarity(existing, candidate) >= 0.68)) return false;
        return !selected.some((existing) => similarity(existing, candidate) >= 0.68);
      });
      if (laterAlternative) continue;
    }

    selected.push(story);
    topics.add(topic);
    if (selected.length >= limit) break;
  }

  return selected;
}

function regionFromCode(value: string | null) {
  if (!value) return '';
  const code = value.split('-').pop()?.toUpperCase() || '';
  return STATE_CODES[code] || '';
}

function regionFromName(value: string | null) {
  if (!value) return '';
  const normalized = value.trim().toLowerCase();
  return Object.values(STATE_CODES).find((name) => name.toLowerCase() === normalized) || '';
}

function detectRegion(request: NextRequest) {
  const requestedRegion = regionFromName(request.nextUrl.searchParams.get('region'));
  if (requestedRegion) return requestedRegion;
  const regionCode = regionFromCode(request.headers.get('x-vercel-ip-country-region'));
  if (regionCode) return regionCode;
  return 'India';
}

export async function GET(request: NextRequest) {
  try {
    const region = detectRegion(request);

    // Explicit ?lang= is the source of truth; cookie is only a fallback.
    const requestedLanguage = request.nextUrl.searchParams.get('lang');
    const language = requestedLanguage === 'ta' || requestedLanguage === 'hi'
      ? requestedLanguage
      : requestedLanguage === 'en'
        ? 'en'
        : getLanguageFromRequest(request);

    // EIRA Home is a current-news product, not a static three-story feed.
    // Build a broad fresh candidate pool on every request, then select the
    // most consequential distinct events for each geography.
    //
    // We deliberately query multiple beats because a single "latest news"
    // query can repeatedly surface the same dominant story (for example,
    // the flydubai pilot story) while missing other important developments.
    const regionalFreshQueries = region !== 'India'
      ? [
          `"${region}" latest news when:1d`,
          `"${region}" government court policy when:1d`,
          `"${region}" business economy industry when:1d`,
          `"${region}" health education transport infrastructure when:1d`,
          `"${region}" rain weather disaster warning when:1d`,
          `"${region}" crime police accident court when:1d`,
          `"${region}" latest when:1d`,
        ]
      : [
          'India latest news when:1d',
          'India government court policy when:1d',
          'India business economy industry when:1d',
          'India health education transport infrastructure when:1d',
        ];

    const regionalFallbackQueries = region !== 'India'
      ? [
          `"${region}" latest news when:2d`,
          `"${region}" government court business when:2d`,
          `"${region}" infrastructure health education transport when:2d`,
          `"${region}" weather disaster police court when:2d`,
        ]
      : [
          'India latest news when:2d',
          'India government court economy business when:2d',
          'India infrastructure health education policy when:2d',
        ];

    const indiaFreshQueries = [
      'India latest news when:1d',
      'India government court policy when:1d',
      'India economy business markets when:1d',
      'India health education transport infrastructure when:1d',
      'India security disaster weather when:1d',
      'India technology science major development when:1d',
    ];

    const indiaFallbackQueries = [
      'India latest news when:2d',
      'India government court economy business when:2d',
      'India infrastructure health education policy when:2d',
    ];

    const worldFreshQueries = [
      'world latest news when:1d',
      'global economy markets business when:1d',
      'United States China Europe Middle East latest when:1d',
      'world conflict security diplomacy court when:1d',
      'world disaster health science technology when:1d',
    ];

    const worldFallbackQueries = [
      'world latest news when:2d',
      'world economy security disaster court when:2d',
      'United States China Europe Middle East latest when:2d',
    ];

    const [
      regionalFreshSets,
      regionalFallbackSets,
      indiaFreshSets,
      indiaFallbackSets,
      worldFreshSets,
      worldFallbackSets,
    ] = await Promise.all([
      Promise.all(regionalFreshQueries.map(fetchGoogleNews)),
      Promise.all(regionalFallbackQueries.map(fetchGoogleNews)),
      Promise.all(indiaFreshQueries.map(fetchGoogleNews)),
      Promise.all(indiaFallbackQueries.map(fetchGoogleNews)),
      Promise.all(worldFreshQueries.map(fetchGoogleNews)),
      Promise.all(worldFallbackQueries.map(fetchGoogleNews)),
    ]);

    const freshOnly = (stories: Story[]) =>
      dedupe(stories).filter(isPrimaryFreshStory);

    const fallbackOnly = (stories: Story[], fresh: Story[]) =>
      dedupe(stories)
        .filter(isCurrentHomeStory)
        .filter((story) => !fresh.some((existing) => similarity(existing, story) >= 0.68));

    const regionalFreshRaw = freshOnly(regionalFreshSets.flat());
    const regionalFallbackRaw = fallbackOnly(regionalFallbackSets.flat(), regionalFreshRaw);

    const indiaFreshRaw = freshOnly(indiaFreshSets.flat());
    const indiaFallbackRaw = fallbackOnly(indiaFallbackSets.flat(), indiaFreshRaw);

    const worldFreshRaw = freshOnly(worldFreshSets.flat());
    const worldFallbackRaw = fallbackOnly(worldFallbackSets.flat(), worldFreshRaw);

    const rankedRegionalFresh = region === 'India' ? [] : rankRegional(regionalFreshRaw, region);
    const rankedRegionalFallback = region === 'India' ? [] : rankRegional(regionalFallbackRaw, region);
    const rankedIndiaFresh = rankIndia(indiaFreshRaw);
    const rankedIndiaFallback = rankIndia(indiaFallbackRaw);
    const rankedWorldFresh = rankWorld(worldFreshRaw);
    const rankedWorldFallback = rankWorld(worldFallbackRaw);

    // Select a larger candidate set first, then de-duplicate by underlying
    // event. This prevents one viral story from occupying every slot.
    const regional = selectUnique(rankedRegionalFresh, 6);
    const regionalCompleted = regional.length < 6
      ? [...regional, ...selectUnique(rankedRegionalFallback, 6 - regional.length, regional)]
      : regional;

    const india = selectUnique(rankedIndiaFresh, 6, regionalCompleted);
    const indiaCompleted = india.length < 6
      ? [...india, ...selectUnique(rankedIndiaFallback, 6 - india.length, [...regionalCompleted, ...india])]
      : india;

    const world = selectUnique(rankedWorldFresh, 6, [...regionalCompleted, ...indiaCompleted]);
    const worldCompleted = world.length < 6
      ? [...world, ...selectUnique(rankedWorldFallback, 6 - world.length, [...regionalCompleted, ...indiaCompleted, ...world])]
      : world;

    const formattedRegional = regionalCompleted.map((story) => ({ ...story, title: shortenHeadline(story.title, 165) }));
    const formattedIndia = indiaCompleted.map((story) => ({ ...story, title: shortenHeadline(story.title, 150) }));
    const formattedWorld = worldCompleted.map((story) => ({ ...story, title: shortenHeadline(story.title, 150) }));

    const [regionalWithImages, indiaWithImages, worldWithImages] = await Promise.all([
      attachArticleImages(formattedRegional),
      attachArticleImages(formattedIndia),
      attachArticleImages(formattedWorld),
    ]);
    const [translatedRegional, translatedIndia, translatedWorld] = await Promise.all([
      translateHomeStories(regionalWithImages, language),
      translateHomeStories(indiaWithImages, language),
      translateHomeStories(worldWithImages, language),
    ]);

    return NextResponse.json(
      {
        region,
        regionCode: Object.entries(STATE_CODES).find(([, name]) => name === region)?.[0] || '',
        regional: translatedRegional.slice(0, 3),
        india: translatedIndia.slice(0, 3),
        world: translatedWorld.slice(0, 2),
        currentPool: {
          regional: translatedRegional,
          india: translatedIndia,
          world: translatedWorld,
        },
        retrievedAt: new Date().toISOString(),
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('EIRA Home API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not load current news.' },
      { status: 500 }
    );
  }
}
