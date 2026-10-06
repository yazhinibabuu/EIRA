import { NextRequest, NextResponse } from 'next/server';
import { getLanguageFromRequest, translateHomeStories } from '@/utils/eira-translate';

type Story = {
  title: string;
  source: string;
  publishedAt: string;
  description: string;
  url: string;
  image: string;
  topic?: string;
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
  { topic: 'technology', points: 8, terms: ['technology','tech','artificial intelligence','ai','semiconductor','chip','software','cybersecurity','cyber security','data center','data centre','startup','space','satellite'] },
  { topic: 'education', points: 6, terms: ['education','school','schools','university','universities','exam','students','college','neet'] },
  { topic: 'business', points: 6, terms: ['company','business','merger','acquisition','industry','factory','manufacturing','layoff','ipo','investment','jobs'] },
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
      (host.endsWith('.googleusercontent.com') && !path.includes('encrypted-tbn')) ||
      (host.endsWith('.gstatic.com') && !path.includes('encrypted-tbn')) ||
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
    item.match(/<description>[\s\S]*?<img[^>]*\bsrc=["']([^"']+)["']/i)?.[1],
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
  try {
    const response = await fetch(url, {
      cache: 'no-store',
      headers: { 'User-Agent': 'EIRA/1.0' },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      console.error(`EIRA News source returned ${response.status} for query:`, query);
      return [];
    }
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
  } catch (error) {
    console.error('EIRA Google News fetch failed:', query, error);
    return [];
  }
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
async function fetchBingNewsImage(story: Story) {
  const query = `${story.title} ${story.source}`.trim();
  if (!query) return '';

  try {
    const searchUrl = `https://www.bing.com/news/search?q=${encodeURIComponent(query)}&qft=interval%3d%221%22&format=RSS`;
    const response = await fetch(searchUrl, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/154 Safari/537.36 EIRA/1.0',
        'Accept': 'application/rss+xml, application/xml, text/xml',
        'Accept-Language': 'en-IN,en;q=0.9',
      },
      signal: AbortSignal.timeout(4500),
    });
    if (!response.ok) return '';

    const xml = await response.text();
    const items = xml.match(/<item>[\s\S]*?<\/item>/gi) ?? [];
    const targetWords = story.title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 2);

    let bestImage = '';
    let bestScore = 0;

    for (const item of items.slice(0, 8)) {
      const rawTitle = extract('title', item);
      const imageMatch =
        item.match(/<News:Image[^>]*>([\s\S]*?)<\/News:Image>/i)
        ?? item.match(/<(?:media:content|media:thumbnail)[^>]*\burl=["']([^"']+)["']/i)
        ?? item.match(/<img[^>]*\bsrc=["']([^"']+)["']/i);
      const image = imageMatch ? decodeXml(stripHtml(imageMatch[1])).trim() : '';
      if (!isUsableImageUrl(image)) continue;

      const resultWords = new Set(
        rawTitle.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((word) => word.length > 2)
      );
      const overlap = targetWords.filter((word) => resultWords.has(word)).length;
      const score = overlap / Math.max(1, targetWords.length);

      if (score > bestScore) {
        bestScore = score;
        bestImage = image;
      }
    }

    return bestImage;
  } catch {
    return '';
  }
}

async function attachArticleImages(stories: Story[]) {
  return Promise.all(stories.map(async (story) => {
    const rssImage = isUsableImageUrl(story.image) ? story.image : '';
    if (rssImage) return { ...story, image: rssImage };

    const articleImage = await fetchArticleImage(story.url);
    if (articleImage) return { ...story, image: articleImage };

    const bingImage = await fetchBingNewsImage(story);
    return { ...story, image: bingImage };
  }));
}

async function enrichStoryContext(story: Story): Promise<Story> {
  if (!story.url) return story;
  try {
    const response = await fetch(story.url, {
      cache: 'no-store',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/154 Safari/537.36 EIRA/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-IN,en;q=0.9',
      },
      signal: AbortSignal.timeout(3500),
    });
    if (!response.ok) return story;
    const html = (await response.text()).slice(0, 700000);
    const patterns = [
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i,
      /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i,
    ];
    for (const pattern of patterns) {
      const match = html.match(pattern);
      const description = match?.[1] ? stripHtml(decodeXml(match[1])) : '';
      if (description && description.length >= 40 && !description.toLowerCase().includes('javascript')) {
        return { ...story, description: description.slice(0, 500) };
      }
    }
  } catch {}
  return story;
}

async function editorializeHomeStories(stories: Story[]): Promise<Story[]> {
  if (!stories.length) return stories;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return stories;
  const model = process.env.EIRA_EDITORIAL_MODEL || process.env.EIRA_TRANSLATION_MODEL || 'gemini-3.5-flash-lite';
  const input = stories.map((story, index) => ({
    id: index,
    headline: story.title,
    description: story.description,
    source: story.source,
    topic: classifyTopic(story),
  }));
  const prompt = `You are EIRA's senior news editor. Rewrite these current news items for a calm, trustworthy information product.

For each item return exactly: {"id": number, "title": string, "description": string}.

TITLE rules:
- Aim for 55 to 90 characters when possible; never force awkward clipping.
- One clear sentence, written in EIRA's calm editorial voice rather than copied RSS style.
- Remove publisher clickbait, SEO wording, quotes unless essential, source suffixes, and headline fragments.
- Distinguish a site/location change from cancellation of an entire project. Never say a project was cancelled if the supplied reporting only says a proposed site was dropped.
- Do not invent facts, people, numbers, causes, motives, or consequences.
- Preserve the actual event and important names.

DESCRIPTION rules:
- 1 or 2 sentences, about 25-45 words.
- Start with what actually happened, based only on the supplied headline/description.
- Do not add why it matters unless the supplied reporting supports it.
- Never invent missing details. If the source material is thin, write a concise factual restatement rather than guessing.
- Natural, neutral journalism. No hype.

INPUT:
${JSON.stringify(input)}`;
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(9000),
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'ARRAY',
            items: { type: 'OBJECT', properties: { id: { type: 'INTEGER' }, title: { type: 'STRING' }, description: { type: 'STRING' } }, required: ['id','title','description'] },
          },
        },
      }),
    });
    if (!response.ok) return stories;
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.map((part: any) => part?.text || '').join('') || '';
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) return stories;
    return stories.map((story, index) => {
      const item = parsed.find((candidate: any) => Number(candidate?.id) === index);
      if (!item || typeof item.title !== 'string' || typeof item.description !== 'string') return story;
      const editorialTitle = cleanHeadline(item.title).trim();
      return { ...story, title: shortenHeadline(editorialTitle, 96), description: stripHtml(item.description).trim() };
    });
  } catch (error) {
    console.error('EIRA editorial enrichment failed:', error);
    return stories;
  }
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
const MAX_HOME_AGE_HOURS = 48;

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
  const rules: Array<[string, Array<[string, number]>]> = [
    ['courts', [['supreme court', 12], ['high court', 12], ['court ruling', 10], ['court order', 10], ['judgment', 9], ['judgement', 9], ['verdict', 9], ['legal challenge', 8], ['court directs', 10], ['court asks', 10], ['court seeks', 10]]],
    ['health', [['hospital', 9], ['doctor', 7], ['patient', 7], ['disease', 8], ['virus', 8], ['outbreak', 9], ['epidemic', 9], ['vaccination', 8], ['vaccine', 8], ['medical', 7], ['healthcare', 8], ['health ministry', 10], ['drug', 7], ['medicine', 7], ['cardiac', 9]]],
    ['infrastructure', [['infrastructure', 9], ['railway', 9], ['railways', 9], ['metro', 9], ['airport', 10], ['highway', 9], ['road project', 10], ['bridge', 9], ['port', 10], ['container', 7], ['power', 8], ['energy', 7], ['water project', 9], ['sewer', 8], ['sewage', 8], ['transport', 7]]],
    ['technology', [['artificial intelligence', 10], ['ai', 7], ['semiconductor', 10], ['chip', 10], ['chips', 10], ['software', 9], ['cybersecurity', 10], ['cyber security', 10], ['data center', 9], ['data centre', 9], ['technology', 5], ['tech company', 8], ['startup', 7], ['space', 7], ['satellite', 8]]],
    ['economy', [['economy', 10], ['inflation', 9], ['rbi', 9], ['interest rate', 9], ['market', 7], ['markets', 7], ['trade', 7], ['tariff', 8], ['investment', 6], ['jobs', 6], ['employment', 6], ['tax', 8], ['budget', 8], ['exports', 7], ['imports', 7], ['growth', 8]]],
    ['business', [['company', 8], ['companies', 8], ['business', 8], ['businesses', 8], ['merger', 9], ['acquisition', 9], ['ipo', 9], ['investor', 7], ['investors', 7], ['stock', 7], ['stocks', 7], ['shares', 7], ['revenue', 8], ['profit', 8], ['earnings', 8], ['manufacturing', 7], ['industry', 7], ['factory', 7]]],
    ['education', [['education', 9], ['school', 8], ['schools', 8], ['university', 9], ['universities', 9], ['exam', 8], ['students', 7], ['college', 8], ['neet', 9]]],
    ['government', [['government approves', 10], ['government orders', 10], ['government announces', 10], ['chief minister', 10], ['prime minister', 10], ['minister announces', 9], ['cabinet approves', 10], ['cabinet decision', 10], ['ministry orders', 10], ['new policy', 9], ['policy takes effect', 9], ['bill passed', 9], ['law comes into effect', 9], ['regulation comes into effect', 9], ['parliament passes', 10]]],
    ['public-safety', [['police', 8], ['crime', 8], ['attack', 9], ['explosion', 9], ['accident', 8], ['fire', 8], ['rescue', 8], ['missing', 7], ['security', 7], ['terror', 10], ['pocso', 10], ['rape', 10], ['sexual assault', 10]]],
    ['disaster', [['flood', 10], ['flooding', 10], ['cyclone', 10], ['earthquake', 10], ['landslide', 10], ['tsunami', 10], ['evacuation', 9], ['evacuated', 9], ['red alert', 10], ['orange alert', 10], ['disaster', 9], ['extreme rain', 9], ['heavy rain', 8], ['severe weather', 9]]],
    ['weather', [['rainfall', 6], ['showers', 6], ['weather', 7], ['heatwave', 8], ['temperature', 6], ['thunderstorm', 7], ['wind', 5]]],
  ];
  let bestTopic = 'general';
  let bestScore = 0;
  for (const [topic, terms] of rules) {
    const score = terms.reduce((sum, [term, weight]) => sum + (text.includes(term) ? weight : 0), 0);
    if (score > bestScore) { bestScore = score; bestTopic = topic; }
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
  const regionTerms = (REGION_TERMS[region] || [region]).map((term) => term.toLowerCase());
  const specificPlaceTerms = regionTerms.filter((term) => term !== region.toLowerCase());

  return dedupe(stories)
    .filter((story) => !isRoundup(story) && isCurrentHomeStory(story) && !isLowQualitySource(story.source))
    .map((story) => {
      const relevance = regionalRelevance(story, region);
      const title = story.title.toLowerCase();
      const description = story.description.toLowerCase();
      const hasTitleRegion = relevance.titleHits > 0;
      const specificBodyHits = specificPlaceTerms.filter((term) => description.includes(term)).length;
      const specificTitleHits = specificPlaceTerms.filter((term) => title.includes(term)).length;
      const isClearlyRegional = hasTitleRegion || specificTitleHits > 0 || specificBodyHits >= 2;

      let score = eventScore(story) + relevance.score;

      if (!isClearlyRegional) score -= 80;
      if (relevance.titleHits === 0) score -= 22;
      if (relevance.titleHits === 0 && relevance.bodyHits === 0) score -= 40;
      if (isAnalysisHeadline(story)) score -= 10;
      if (LOW_VALUE_TERMS.some((term) => storyText(story).toLowerCase().includes(term))) score -= 8;
      if (sourceQuality(story.source) >= 3) score += 3;

      return { story, score, isClearlyRegional };
    })
    .filter((item) => item.isClearlyRegional)
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
      if (!hasWorldSignal) score -= 80;
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
  for (const story of candidates) {
    if (isRoundup(story)) continue;
    if (alreadyShown.some((existing) => similarity(existing, story) >= 0.68)) continue;
    if (selected.some((existing) => similarity(existing, story) >= 0.68)) continue;
    selected.push(story);
    if (selected.length >= limit) break;
  }
  return selected;
}

function selectWithTopicCoverage(
  candidates: Story[],
  limit: number,
  preferredTopics: string[],
  alreadyShown: Story[] = []
) {
  const eligible = candidates.filter((story) =>
    !isRoundup(story) &&
    !alreadyShown.some((existing) => similarity(existing, story) >= 0.68)
  );

  const selected: Story[] = [];
  const usedTopics = new Set<string>();

  // First pass: deliberately reserve slots for different important beats.
  for (const topic of preferredTopics) {
    if (selected.length >= limit) break;
    const candidate = eligible.find((story) =>
      !usedTopics.has(classifyTopic(story)) && classifyTopic(story) === topic &&
      !selected.some((existing) => similarity(existing, story) >= 0.68)
    );
    if (candidate) {
      selected.push(candidate);
      usedTopics.add(classifyTopic(candidate));
    }
  }

  // Second pass: fill remaining slots by editorial score.
  for (const story of eligible) {
    if (selected.length >= limit) break;
    if (selected.some((existing) => similarity(existing, story) >= 0.68)) continue;
    selected.push(story);
    usedTopics.add(classifyTopic(story));
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
    const requestedLanguage = request.nextUrl.searchParams.get('lang');
    const language = requestedLanguage === 'ta' || requestedLanguage === 'hi'
      ? requestedLanguage
      : requestedLanguage === 'en'
        ? 'en'
        : getLanguageFromRequest(request);

    // EIRA Home is deliberately built in three editorial layers.
    // We retrieve by beat, rank within the beat, guarantee topic coverage,
    // then translate/image-enrich only the stories the UI will actually show.
    const regionalQueries = region !== 'India'
      ? [
          `"${region}" government court policy latest when:2d`,
          `"${region}" business economy industry jobs latest when:2d`,
          `"${region}" health education latest when:2d`,
          `"${region}" infrastructure transport power railway latest when:2d`,
          `"${region}" rain weather disaster warning latest when:2d`,
          `"${region}" police crime accident latest when:2d`,
          `"${region}" technology startup science latest when:2d`,
          `"${region}" latest major development when:2d`,
        ]
      : [];

    const indiaQueries = [
      'India government court policy latest when:2d',
      'India economy business markets jobs latest when:2d',
      'India technology AI science cybersecurity semiconductor latest when:2d',
      'India health education latest when:2d',
      'India infrastructure transport energy railway latest when:2d',
      'India security disaster weather latest when:2d',
    ];

    const worldQueries = [
      'world geopolitics government diplomacy conflict latest when:2d',
      'global economy business markets trade latest when:2d',
      'world technology AI science cybersecurity latest when:2d',
      'world health climate disaster latest when:2d',
      'United States China Europe Middle East latest when:2d',
    ];

    const [regionalSets, indiaSets, worldSets] = await Promise.all([
      Promise.all(regionalQueries.map(fetchGoogleNews)),
      Promise.all(indiaQueries.map(fetchGoogleNews)),
      Promise.all(worldQueries.map(fetchGoogleNews)),
    ]);

    const freshEnough = (stories: Story[]) =>
      dedupe(stories).filter(isCurrentHomeStory).filter((story) => !isRoundup(story));

    const emergencyPool = (stories: Story[]) =>
      dedupe(stories).filter((story) => hoursOld(story.publishedAt) <= 72).filter((story) => !isRoundup(story));

    const regionalAll = regionalSets.flat();
    const indiaAll = indiaSets.flat();
    const worldAll = worldSets.flat();

    const regionalRaw = freshEnough(regionalAll);
    const indiaRaw = freshEnough(indiaAll);
    const worldRaw = freshEnough(worldAll);

    // If a feed has a transient timestamp/feed issue, do not punish the user
    // with an empty Home. Use a clearly bounded 72-hour emergency pool.
    const regionalSource = regionalRaw.length ? regionalRaw : emergencyPool(regionalAll);
    const indiaSource = indiaRaw.length ? indiaRaw : emergencyPool(indiaAll);
    const worldSource = worldRaw.length ? worldRaw : emergencyPool(worldAll);

    const rankedRegional = region === 'India' ? [] : rankRegional(regionalSource, region);
    const rankedIndia = rankIndia(indiaSource);
    const rankedWorld = rankWorld(worldSource);

    const regionalSelected = region === 'India'
      ? []
      : selectWithTopicCoverage(
          rankedRegional,
          6,
          ['government', 'courts', 'infrastructure', 'economy', 'business', 'technology', 'health', 'education', 'disaster', 'public-safety']
        );

    const indiaSelected = selectWithTopicCoverage(
      rankedIndia,
      6,
      ['government', 'courts', 'economy', 'technology', 'health', 'infrastructure', 'public-safety', 'education'],
      regionalSelected
    );

    const worldSelected = selectWithTopicCoverage(
      rankedWorld,
      5,
      ['government', 'economy', 'technology', 'public-safety', 'health', 'disaster', 'infrastructure'],
      [...regionalSelected, ...indiaSelected]
    );

    // Only the cards that can actually be rendered are enriched. This avoids
    // making 20+ image requests and 20+ translation strings on every switch.
    const regionalForUi = regionalSelected.slice(0, 3).map((story) => ({ ...story, topic: classifyTopic(story) }));
    const indiaForUi = indiaSelected.slice(0, 3).map((story) => ({ ...story, topic: classifyTopic(story) }));
    const worldForUi = worldSelected.slice(0, 2).map((story) => ({ ...story, topic: classifyTopic(story) }));

    const contextEnriched = await Promise.all([
      ...regionalForUi.map(enrichStoryContext),
      ...indiaForUi.map(enrichStoryContext),
      ...worldForUi.map(enrichStoryContext),
    ]);
    const editorialized = await editorializeHomeStories(contextEnriched);
    const regionalEditorial = editorialized.slice(0, regionalForUi.length);
    const indiaEditorial = editorialized.slice(regionalForUi.length, regionalForUi.length + indiaForUi.length);
    const worldEditorial = editorialized.slice(regionalForUi.length + indiaForUi.length);

    // Home is typography-first when a real publisher image is unavailable.
    // Never manufacture a visual placeholder just to fill a rectangle.
    const [translatedRegional, translatedIndia, translatedWorld] = await Promise.all([
      translateHomeStories(regionalEditorial, language),
      translateHomeStories(indiaEditorial, language),
      translateHomeStories(worldEditorial, language),
    ]);

    return NextResponse.json(
      {
        region,
        regionCode: Object.entries(STATE_CODES).find(([, name]) => name === region)?.[0] || '',
        regional: translatedRegional,
        india: translatedIndia,
        world: translatedWorld,
        currentPool: {
          regional: translatedRegional,
          india: translatedIndia,
          world: translatedWorld,
        },
        retrievedAt: new Date().toISOString(),
      },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=900' } }
    );
  } catch (error) {
    console.error('EIRA Home API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not load current news.' },
      { status: 500 }
    );
  }
}
