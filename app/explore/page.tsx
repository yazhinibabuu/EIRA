'use client';

import Link from 'next/link';
import { Search, ArrowUpRight, ExternalLink, ChevronDown } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';

import { Nav, SectionLabel, Footer } from '@/components/eira';
import { getStoredLanguage, type Language } from '@/components/language-switcher';
import FollowTopicButton from '@/components/follow-topic';

type ExploreSource = {
  name: string;
  title: string;
  url: string;
  publishedAt: string;
};

type ExploreResult = {
  id: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
  url: string;
  reportCount: number;
  sources: ExploreSource[];
};

type ExploreResponse = {
  topic: string;
  results: ExploreResult[];
  resultCount: number;
  retrievedAt: string;
  error?: string;
};

const paths = [
  ['Climate', 'The systems shaping a changing planet', 'from-[#375a4c] to-[#c88159]'],
  ['AI & society', 'How new tools enter everyday life', 'from-[#193940] to-[#5d8d87]'],
  ['Cities', 'Where policy becomes lived experience', 'from-[#755945] to-[#b88860]'],
  ['Ocean', 'The planet’s moving heat map', 'from-[#254a4b] to-[#81a994]'],
] as const;

const copy = {
  en: {
    explore: 'Explore',
    headline1: 'Follow your', headline2: 'curiosity.',
    description: 'Search for a subject, place, person, idea, or event. EIRA groups reporting into the developments happening around it.',
    placeholder: 'Search topics, places, ideas…', search: 'Search', searching: 'Searching',
    paths: 'Paths into the world', pathway: 'Topic pathway',
    climate: 'Climate', climateDesc: 'The systems shaping a changing planet',
    ai: 'AI & society', aiDesc: 'How new tools enter everyday life',
    cities: 'Cities', citiesDesc: 'Where policy becomes lived experience',
    ocean: 'Ocean', oceanDesc: 'The planet’s moving heat map',
    results: 'Search results', developments: 'developments',
    finding: 'Finding the developments around', wrong: 'Something went wrong',
    noResults: 'We couldn’t find enough relevant reporting.', trySpecific: '{ui.trySpecific}',
    developing: 'Developing story', current: 'Current reporting', updated: 'Updated',
    understand: 'Understand this story', hide: 'Hide reporting', view: 'View', reports: 'reports', read: 'Read source',
    reportingBehind: 'Reporting behind this development', footer: 'EIRA groups reports that appear to describe the same development. Open a story for deeper context and source-backed understanding.',
  },
  ta: {
    explore: 'ஆராயுங்கள்',
    headline1: 'உங்கள்', headline2: 'ஆர்வத்தைப் பின்தொடருங்கள்.',
    description: 'ஒரு தலைப்பு, இடம், நபர், யோசனை அல்லது நிகழ்வைத் தேடுங்கள். அதைச் சுற்றி நடக்கும் முன்னேற்றங்களாக செய்தி அறிக்கைகளை EIRA ஒன்றிணைக்கிறது.',
    placeholder: 'தலைப்புகள், இடங்கள், யோசனைகளைத் தேடுங்கள்…', search: 'தேடுங்கள்', searching: 'தேடுகிறது',
    paths: 'உலகத்தை அறியும் வழிகள்', pathway: 'தலைப்பு வழி',
    climate: 'காலநிலை', climateDesc: 'மாறிவரும் பூமியை வடிவமைக்கும் அமைப்புகள்',
    ai: 'AI மற்றும் சமூகம்', aiDesc: 'புதிய கருவிகள் அன்றாட வாழ்க்கையில் நுழையும் விதம்',
    cities: 'நகரங்கள்', citiesDesc: 'கொள்கை மக்களின் வாழ்வில் தாக்கத்தை ஏற்படுத்தும் இடம்',
    ocean: 'பெருங்கடல்', oceanDesc: 'பூமியின் நகரும் வெப்ப வரைபடம்',
    results: 'தேடல் முடிவுகள்', developments: 'முன்னேற்றங்கள்',
    finding: 'இதனைச் சுற்றியுள்ள முன்னேற்றங்களைத் தேடுகிறது', wrong: 'ஏதோ தவறு ஏற்பட்டது',
    noResults: 'போதுமான தொடர்புடைய செய்திகளை எங்களால் கண்டுபிடிக்க முடியவில்லை.', trySpecific: 'மேலும் குறிப்பிட்ட தலைப்பு, நபர், இடம் அல்லது நிகழ்வை முயற்சிக்கவும்.',
    developing: 'வளர்ந்து வரும் செய்தி', current: 'தற்போதைய செய்தி', updated: 'புதுப்பிக்கப்பட்டது',
    understand: 'இந்த செய்தியைப் புரிந்துகொள்ளுங்கள்', hide: 'செய்திகளை மறைக்கவும்', view: 'பார்க்கவும்', reports: 'அறிக்கைகள்', read: 'மூலத்தைப் படிக்கவும்',
    reportingBehind: 'இந்த முன்னேற்றத்தின் பின்னுள்ள செய்திகள்', footer: 'ஒரே முன்னேற்றத்தைப் பற்றியதாகத் தோன்றும் அறிக்கைகளை EIRA ஒன்றிணைக்கிறது. ஆழமான பின்னணியையும் ஆதாரங்களையும் அறிய ஒரு செய்தியைத் திறக்கவும்.',
  },
  hi: {
    explore: 'एक्सप्लोर करें',
    headline1: 'अपनी', headline2: 'जिज्ञासा का अनुसरण करें।',
    description: 'किसी विषय, स्थान, व्यक्ति, विचार या घटना को खोजें। EIRA उससे जुड़ी रिपोर्टिंग को हो रहे घटनाक्रमों में जोड़ता है।',
    placeholder: 'विषय, स्थान, विचार खोजें…', search: 'खोजें', searching: 'खोज रहा है',
    paths: 'दुनिया को समझने के रास्ते', pathway: 'विषय मार्ग',
    climate: 'जलवायु', climateDesc: 'बदलती धरती को आकार देने वाली प्रणालियाँ',
    ai: 'AI और समाज', aiDesc: 'नई तकनीकें रोज़मर्रा की ज़िंदगी में कैसे आती हैं',
    cities: 'शहर', citiesDesc: 'जहाँ नीति लोगों के जीवन का हिस्सा बनती है',
    ocean: 'महासागर', oceanDesc: 'धरती का बदलता तापमान मानचित्र',
    results: 'खोज परिणाम', developments: 'घटनाक्रम',
    finding: 'इसके आसपास के घटनाक्रम खोज रहा है', wrong: 'कुछ गलत हो गया',
    noResults: 'हमें पर्याप्त प्रासंगिक रिपोर्टिंग नहीं मिली।', trySpecific: 'कोई अधिक विशिष्ट विषय, व्यक्ति, स्थान या घटना आज़माएँ।',
    developing: 'विकसित होती खबर', current: 'ताज़ा रिपोर्टिंग', updated: 'अपडेट किया गया',
    understand: 'इस खबर को समझें', hide: 'रिपोर्टिंग छिपाएँ', view: 'देखें', reports: 'रिपोर्टें', read: 'स्रोत पढ़ें',
    reportingBehind: 'इस घटनाक्रम के पीछे की रिपोर्टिंग', footer: 'EIRA एक ही घटनाक्रम का वर्णन करने वाली रिपोर्टों को एक साथ जोड़ता है। गहरे संदर्भ और स्रोत-आधारित जानकारी के लिए कोई कहानी खोलें।',
  },
} as const;

function formatDate(date: string) {
  if (!date) return '';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatReportLabel(count: number, ui: { reports: string }) {
  return `${count} ${ui.reports}`;
}

export default function Explore() {
  const [query, setQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [results, setResults] = useState<ExploreResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const sync = () => setLanguage(getStoredLanguage());
    sync();
    window.addEventListener('storage', sync);
    window.addEventListener('eira:language-changed', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('eira:language-changed', sync);
    };
  }, []);

  const ui = copy[language];

  useEffect(() => {
    if (!activeQuery) return;

    let cancelled = false;

    async function refreshResultsForLanguage() {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`/api/explore?q=${encodeURIComponent(activeQuery)}`, {
          cache: 'no-store',
        });
        const data: ExploreResponse = await response.json();
        if (!response.ok) throw new Error(data.error || 'Search failed.');
        if (!cancelled) setResults(data.results || []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'We could not search this topic right now.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void refreshResultsForLanguage();

    return () => {
      cancelled = true;
    };
  }, [language]);

  const pathCopy = [
    [ui.climate, ui.climateDesc],
    [ui.ai, ui.aiDesc],
    [ui.cities, ui.citiesDesc],
    [ui.ocean, ui.oceanDesc],
  ] as const;

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setLoading(true);
    setSearched(true);
    setError('');
    setResults([]);
    setExpanded({});
    setActiveQuery(trimmed);

    try {
      const response = await fetch(`/api/explore?q=${encodeURIComponent(trimmed)}`, {
        cache: 'no-store',
      });
      const data: ExploreResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Search failed.');
      }

      setResults(data.results || []);
    } catch (err) {
      console.error('Explore search error:', err);
      setError(err instanceof Error ? err.message : 'We could not search this topic right now.');
    } finally {
      setLoading(false);
    }
  }

  function searchPath(topic: string) {
    setQuery(topic);
    setTimeout(() => {
      document.getElementById('explore-search')?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 50);
  }

  function toggleSources(id: string) {
    setExpanded((current) => ({ ...current, [id]: !current[id] }));
  }

  return (
    <main className="page">
      <Nav />

      <div className="mx-auto max-w-7xl px-6 pb-20 pt-36 sm:px-10">
        <SectionLabel>{ui.explore}</SectionLabel>

        <h1 className="serif text-5xl tracking-[-.05em] sm:text-7xl">
          {ui.headline1} <i>{ui.headline2}</i>
        </h1>

        <p className="mt-5 max-w-xl text-lg leading-8 text-[#d4ccc0]">
          {ui.description}
        </p>

        <form
          id="explore-search"
          onSubmit={handleSearch}
          className="mt-12 flex min-h-14 max-w-2xl items-center gap-3 rounded-full border edge bg-[#20352b] px-5"
        >
          <Search size={19} className="shrink-0 text-[#dfaa70]" />
          <input
            aria-label={ui.search}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={ui.placeholder}
            className="w-full bg-transparent text-base outline-none placeholder:text-[#a69f94]"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="shrink-0 rounded-full border border-[#dfaa70]/40 px-4 py-2 text-xs uppercase tracking-widest text-[#f3d3a8] transition hover:bg-[#dfaa70]/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? ui.searching : ui.search}
          </button>
        </form>

        {!searched && (
          <section className="mt-20">
            <SectionLabel>{ui.paths}</SectionLabel>

            <div className="grid gap-5 md:grid-cols-2">
              {paths.map((path) => (
                <button
                  key={path[0]}
                  type="button"
                  onClick={() => searchPath(path[0])}
                  className="group min-h-72 overflow-hidden rounded-2xl border edge bg-[#20342b] p-6 text-left"
                >
                  <div className={`h-32 rounded-xl bg-gradient-to-br ${path[2]} transition duration-500 group-hover:scale-[1.03]`} />
                  <div className="mt-5 flex items-start justify-between">
                    <div>
                      <p className="mono text-[10px] uppercase tracking-widest text-[#e0a56b]">{ui.pathway}</p>
                      <h2 className="serif mt-2 text-3xl">{pathCopy[paths.indexOf(path)]?.[0]}</h2>
                      <p className="mt-1 text-[#cec5b8]">{pathCopy[paths.indexOf(path)]?.[1]}</p>
                    </div>
                    <ArrowUpRight className="mt-4" />
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {searched && (
          <section className="mt-16">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b edge pb-6">
              <div>
                <SectionLabel>{ui.results}</SectionLabel>
                <h2 className="serif mt-2 text-4xl">{activeQuery}</h2>
              </div>

              {!loading && !error && (
                <p className="mono text-[10px] uppercase tracking-widest text-[#aaa195]">
                  {results.length} {ui.developments}
                </p>
              )}
            </div>

            {loading && (
              <div className="mt-8 rounded-2xl border edge bg-[#20342b] p-8">
                <p className="mono text-[10px] uppercase tracking-widest text-[#e0a56b]">Searching</p>
                <p className="serif mt-3 text-2xl">{ui.finding} {activeQuery}.</p>
                <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-[#31483d]">
                  <div className="h-full w-1/2 animate-pulse rounded-full bg-[#dfaa70]" />
                </div>
              </div>
            )}

            {!loading && error && (
              <div className="mt-8 rounded-2xl border border-[#a96f60]/50 bg-[#3a2925] p-8">
                <p className="mono text-[10px] uppercase tracking-widest text-[#e0a56b]">{ui.wrong}</p>
                <p className="mt-3 text-[#ddd2c5]">{error}</p>
              </div>
            )}

            {!loading && !error && results.length === 0 && (
              <div className="mt-8 rounded-2xl border edge bg-[#20342b] p-8">
                <p className="serif text-2xl">{ui.noResults}</p>
                <p className="mt-3 max-w-xl leading-7 text-[#cfc6ba]">
                  {ui.trySpecific}
                </p>
              </div>
            )}

            {!loading && !error && results.length > 0 && (
              <div className="mt-8 space-y-5">
                {results.map((result) => {
                  const isExpanded = Boolean(expanded[result.id]);

                  return (
                    <article
                      key={result.id}
                      className="rounded-2xl border edge bg-[#20342b] p-6 transition hover:border-[#dfaa70]/40 sm:p-7"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="mono text-[10px] uppercase tracking-widest text-[#e0a56b]">
                          {result.reportCount > 1 ? ui.developing : ui.current}
                        </p>
                        <span className="text-[#59665f]">·</span>
                        <p className="text-xs text-[#9e978c]">{formatReportLabel(result.reportCount, ui)}</p>
                        {formatDate(result.publishedAt) && (
                          <>
                            <span className="text-[#59665f]">·</span>
                            <p className="text-xs text-[#9e978c]">{ui.updated} {formatDate(result.publishedAt)}</p>
                          </>
                        )}
                      </div>

                      <h3 className="serif mt-3 max-w-5xl text-2xl leading-tight text-[#f1ebe1] sm:text-3xl">
                        {result.title}
                      </h3>

                      <p className="mt-4 max-w-4xl text-[15px] leading-7 text-[#cfc7bb]">
                        {result.summary}
                      </p>

                      <div className="mt-5 flex flex-wrap items-center gap-4">
                        <Link
                          href={`/catch-up?topic=${encodeURIComponent(result.title)}`}
                          className="inline-flex items-center gap-2 border-b border-[#e5aa70] pb-1 text-sm text-[#f3d3a8]"
                        >
                          {ui.understand}
                          <ArrowUpRight size={15} />
                        </Link>

                        <FollowTopicButton topic={activeQuery} />

                        {result.reportCount > 1 && (
                          <button
                            type="button"
                            onClick={() => toggleSources(result.id)}
                            className="inline-flex items-center gap-2 text-sm text-[#aaa195] transition hover:text-[#f3d3a8]"
                          >
                            {isExpanded ? ui.hide : `${ui.view} ${result.reportCount} ${ui.reports}`}
                            <ChevronDown size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>
                        )}

                        <a
                          href={result.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-[#aaa195] transition hover:text-[#f3d3a8]"
                        >
                          {ui.read}
                          <ExternalLink size={14} />
                        </a>
                      </div>

                      {isExpanded && (
                        <div className="mt-6 border-t edge pt-5">
                          <p className="mono text-[9px] uppercase tracking-[.18em] text-[#8f968f]">{ui.reportingBehind}</p>
                          <div className="mt-3 space-y-2">
                            {result.sources.map((source) => (
                              <a
                                key={`${source.url}-${source.name}`}
                                href={source.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/5 bg-[#1a2d25] px-4 py-3 transition hover:border-[#dfaa70]/30"
                              >
                                <span className="min-w-0">
                                  <span className="mono block text-[9px] uppercase tracking-widest text-[#e0a56b]">{source.name}</span>
                                  <span className="mt-1 block text-sm leading-5 text-[#d4ccc0]">{source.title}</span>
                                </span>
                                <ExternalLink size={14} className="shrink-0 text-[#8f968f]" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}

            <p className="mt-8 text-xs leading-6 text-[#817b72]">
              {ui.footer}
            </p>
          </section>
        )}
      </div>

      <Footer />
    </main>
  );
}
