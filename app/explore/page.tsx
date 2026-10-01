'use client';

import Link from 'next/link';
import { Search, ArrowUpRight, ExternalLink, ChevronDown } from 'lucide-react';
import { FormEvent, useState } from 'react';

import { Nav, SectionLabel, Footer } from '@/components/eira';
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
];

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

function formatReportLabel(count: number) {
  return `${count} report${count === 1 ? '' : 's'}`;
}

export default function Explore() {
  const [query, setQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [results, setResults] = useState<ExploreResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

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
        <SectionLabel>Explore</SectionLabel>

        <h1 className="serif text-5xl tracking-[-.05em] sm:text-7xl">
          Follow your <i>curiosity.</i>
        </h1>

        <p className="mt-5 max-w-xl text-lg leading-8 text-[#d4ccc0]">
          Search for a subject, place, person, idea, or event. EIRA groups reporting into the developments happening around it.
        </p>

        <form
          id="explore-search"
          onSubmit={handleSearch}
          className="mt-12 flex min-h-14 max-w-2xl items-center gap-3 rounded-full border edge bg-[#20352b] px-5"
        >
          <Search size={19} className="shrink-0 text-[#dfaa70]" />
          <input
            aria-label="Search topics"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search topics, places, ideas…"
            className="w-full bg-transparent text-base outline-none placeholder:text-[#a69f94]"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="shrink-0 rounded-full border border-[#dfaa70]/40 px-4 py-2 text-xs uppercase tracking-widest text-[#f3d3a8] transition hover:bg-[#dfaa70]/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? 'Searching' : 'Search'}
          </button>
        </form>

        {!searched && (
          <section className="mt-20">
            <SectionLabel>Paths into the world</SectionLabel>

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
                      <p className="mono text-[10px] uppercase tracking-widest text-[#e0a56b]">Topic pathway</p>
                      <h2 className="serif mt-2 text-3xl">{path[0]}</h2>
                      <p className="mt-1 text-[#cec5b8]">{path[1]}</p>
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
                <SectionLabel>Search results</SectionLabel>
                <h2 className="serif mt-2 text-4xl">{activeQuery}</h2>
              </div>

              {!loading && !error && (
                <p className="mono text-[10px] uppercase tracking-widest text-[#aaa195]">
                  {results.length} development{results.length === 1 ? '' : 's'}
                </p>
              )}
            </div>

            {loading && (
              <div className="mt-8 rounded-2xl border edge bg-[#20342b] p-8">
                <p className="mono text-[10px] uppercase tracking-widest text-[#e0a56b]">Searching</p>
                <p className="serif mt-3 text-2xl">Finding the developments around {activeQuery}.</p>
                <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-[#31483d]">
                  <div className="h-full w-1/2 animate-pulse rounded-full bg-[#dfaa70]" />
                </div>
              </div>
            )}

            {!loading && error && (
              <div className="mt-8 rounded-2xl border border-[#a96f60]/50 bg-[#3a2925] p-8">
                <p className="mono text-[10px] uppercase tracking-widest text-[#e0a56b]">Something went wrong</p>
                <p className="mt-3 text-[#ddd2c5]">{error}</p>
              </div>
            )}

            {!loading && !error && results.length === 0 && (
              <div className="mt-8 rounded-2xl border edge bg-[#20342b] p-8">
                <p className="serif text-2xl">We couldn&apos;t find enough relevant reporting.</p>
                <p className="mt-3 max-w-xl leading-7 text-[#cfc6ba]">
                  Try a more specific topic, person, place, or event.
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
                          {result.reportCount > 1 ? 'Developing story' : 'Current reporting'}
                        </p>
                        <span className="text-[#59665f]">·</span>
                        <p className="text-xs text-[#9e978c]">{formatReportLabel(result.reportCount)}</p>
                        {formatDate(result.publishedAt) && (
                          <>
                            <span className="text-[#59665f]">·</span>
                            <p className="text-xs text-[#9e978c]">Updated {formatDate(result.publishedAt)}</p>
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
                          Understand this story
                          <ArrowUpRight size={15} />
                        </Link>

                        <FollowTopicButton topic={activeQuery} />

                        {result.reportCount > 1 && (
                          <button
                            type="button"
                            onClick={() => toggleSources(result.id)}
                            className="inline-flex items-center gap-2 text-sm text-[#aaa195] transition hover:text-[#f3d3a8]"
                          >
                            {isExpanded ? 'Hide reporting' : `View ${result.reportCount} reports`}
                            <ChevronDown size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>
                        )}

                        <a
                          href={result.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-[#aaa195] transition hover:text-[#f3d3a8]"
                        >
                          Read source
                          <ExternalLink size={14} />
                        </a>
                      </div>

                      {isExpanded && (
                        <div className="mt-6 border-t edge pt-5">
                          <p className="mono text-[9px] uppercase tracking-[.18em] text-[#8f968f]">Reporting behind this development</p>
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
              EIRA groups reports that appear to describe the same development. Open a story for deeper context and source-backed understanding.
            </p>
          </section>
        )}
      </div>

      <Footer />
    </main>
  );
}
