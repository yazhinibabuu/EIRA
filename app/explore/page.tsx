'use client';

import Link from 'next/link';
import { Search, ArrowUpRight, ExternalLink } from 'lucide-react';
import { FormEvent, useState } from 'react';

import { Nav, SectionLabel, Footer } from '@/components/eira';
import FollowTopicButton from '@/components/follow-topic';

type ExploreResult = {
  title: string;
  link: string;
  source: string;
  publishedAt: string;
  description: string;
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

export default function Explore() {
  const [query, setQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [results, setResults] = useState<ExploreResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setLoading(true);
    setSearched(true);
    setError('');
    setResults([]);
    setActiveQuery(trimmed);

    try {
      const response = await fetch(`/api/explore?q=${encodeURIComponent(trimmed)}`);
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

  return (
    <main className="page">
      <Nav />

      <div className="mx-auto max-w-7xl px-6 pb-20 pt-36 sm:px-10">
        <SectionLabel>Explore</SectionLabel>

        <h1 className="serif text-5xl tracking-[-.05em] sm:text-7xl">
          Follow your <i>curiosity.</i>
        </h1>

        <p className="mt-5 max-w-xl text-lg leading-8 text-[#d4ccc0]">
          Search for a subject, place, person, idea, or event. EIRA helps you find what is happening around it.
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
                  {results.length} result{results.length === 1 ? '' : 's'}
                </p>
              )}
            </div>

            {loading && (
              <div className="mt-8 rounded-2xl border edge bg-[#20342b] p-8">
                <p className="mono text-[10px] uppercase tracking-widest text-[#e0a56b]">Searching</p>
                <p className="serif mt-3 text-2xl">Finding what is happening around {activeQuery}.</p>
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
                <p className="serif text-2xl">We couldn&apos;t find enough relevant results.</p>
                <p className="mt-3 max-w-xl leading-7 text-[#cfc6ba]">
                  Try a more specific topic, person, place, or event.
                </p>
              </div>
            )}

            {!loading && !error && results.length > 0 && (
              <div className="mt-8 space-y-4">
                {results.map((result, index) => (
                  <article
                    key={`${result.link}-${index}`}
                    className="group rounded-2xl border edge bg-[#20342b] p-6 transition hover:border-[#dfaa70]/40"
                  >
                    <div className="flex items-start justify-between gap-6">
                      <div className="min-w-0 w-full">
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="mono text-[10px] uppercase tracking-widest text-[#e0a56b]">{result.source}</p>
                          {formatDate(result.publishedAt) && (
                            <>
                              <span className="text-[#6f786f]">·</span>
                              <p className="text-xs text-[#9e978c]">{formatDate(result.publishedAt)}</p>
                            </>
                          )}
                        </div>

                        <h3 className="serif mt-3 text-2xl leading-tight text-[#f1ebe1] sm:text-3xl">
                          {result.title}
                        </h3>

                        {result.description && (
                          <p className="mt-3 max-w-3xl leading-7 text-[#c9c1b5]">{result.description}</p>
                        )}

                        <div className="mt-5 flex flex-wrap items-center gap-4">
                          <Link
                            href={`/catch-up?topic=${encodeURIComponent(activeQuery)}`}
                            className="inline-flex items-center gap-2 border-b border-[#e5aa70] pb-1 text-sm text-[#f3d3a8]"
                          >
                            Understand this topic
                            <ArrowUpRight size={15} />
                          </Link>

                          <FollowTopicButton topic={activeQuery} />

                          <a
                            href={result.link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-[#aaa195] transition hover:text-[#f3d3a8]"
                          >
                            Read source
                            <ExternalLink size={14} />
                          </a>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            <p className="mt-8 text-xs leading-6 text-[#817b72]">
              EIRA surfaces current reporting from external sources. Search results are not the final EIRA understanding of a story.
            </p>
          </section>
        )}
      </div>

      <Footer />
    </main>
  );
}
