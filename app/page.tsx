'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Nav, Footer, SectionLabel, ArrowLink } from '@/components/eira';

type HomeStory = {
  title: string;
  source: string;
  publishedAt: string;
  description: string;
  url: string;
};

type HomeResponse = {
  region: string;
  regionCode: string;
  regional: HomeStory[];
  india: HomeStory[];
  world: HomeStory[];
  retrievedAt: string;
  error?: string;
};

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function storyLink(story: HomeStory, topic: string) {
  const params = new URLSearchParams({
    title: story.title,
    source: story.source,
    publishedAt: story.publishedAt,
    description: story.description,
    url: story.url,
    topic,
  });

  return `/story?${params.toString()}`;
}

function StoryCard({
  story,
  topic,
}: {
  story: HomeStory;
  topic: string;
}) {
  return (
    <Link
      href={storyLink(story, topic)}
      className="group block rounded-2xl border edge bg-[#1c3027] p-5 transition hover:-translate-y-1"
    >
      <div className="mb-8 h-20 rounded-xl bg-gradient-to-br from-[#375a4c] to-[#9a6b50] opacity-75" />

      <p className="mono text-[10px] uppercase tracking-widest text-[#e3aa72]">
        {story.source || 'Current reporting'}
      </p>

      <h3 className="serif mt-2 text-2xl leading-tight text-[#f5efe5]">
        {story.title}
      </h3>

      <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#c9c1b5]">
        {story.description}
      </p>

      <p className="mono mt-4 text-[9px] uppercase tracking-wider text-[#aaa297]">
        {formatDate(story.publishedAt)} · Understand this story
      </p>
    </Link>
  );
}

function StoryGrid({ stories, topic }: { stories: HomeStory[]; topic: string }) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {stories.map((story) => (
        <StoryCard key={story.url || story.title} story={story} topic={topic} />
      ))}
    </div>
  );
}

function storyKey(story: HomeStory) {
  return story.title
    .toLowerCase()
    .replace(/\|.*$/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function isSameStory(a: HomeStory, b: HomeStory) {
  if (a.url && b.url && a.url === b.url) return true;
  const aKey = storyKey(a);
  const bKey = storyKey(b);
  if (!aKey || !bKey) return false;
  if (aKey === bKey) return true;
  const aWords = new Set(aKey.split(/\s+/).filter((word) => word.length > 2));
  const bWords = new Set(bKey.split(/\s+/).filter((word) => word.length > 2));
  let shared = 0;
  for (const word of aWords) if (bWords.has(word)) shared++;
  const smaller = Math.min(aWords.size, bWords.size);
  return smaller > 0 && shared / smaller >= 0.8;
}

function removeStory(stories: HomeStory[], excluded: HomeStory[]) {
  return stories.filter((story) => !excluded.some((candidate) => isSameStory(story, candidate)));
}

export default function Home() {
  const [data, setData] = useState<HomeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadHome() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/home', { cache: 'no-store' });
      const result: HomeResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'EIRA could not load current stories.');
      }

      setData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'EIRA could not load current stories.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHome();
  }, []);

  const regional = data?.regional ?? [];
  const india = data?.india ?? [];
  const world = data?.world ?? [];

  const hero = regional[0] || india[0] || world[0];
  const heroList = hero ? [hero] : [];
  const regionalMore = removeStory(regional.slice(1), heroList).slice(0, 2);
  const indiaAvailable = removeStory(india, [...heroList, ...regionalMore]);
  const indiaMore = indiaAvailable.slice(0, 2);
  const worthKnowing = indiaAvailable.slice(2, 3);
  const worldMore = removeStory(world, [...heroList, ...regionalMore, ...indiaMore, ...worthKnowing]).slice(0, 2);
  const regionLabel = data?.region || 'India';

  return (
    <main>
      {/* HERO */}
      <section className="dawn px-6 pb-10 pt-8 sm:px-10 lg:pt-10">
        <Nav />

        <div className="mx-auto flex max-w-7xl flex-col gap-8">
          <div className="max-w-xl">
            <p className="mono text-xs uppercase tracking-[.17em] text-[#806e74]">
  Understand what’s happening
</p>

<h1 className="serif mt-7 text-5xl leading-[.98] tracking-[-.055em] sm:text-7xl">
  Know what happened.
  <br />
  <i>Understand why it matters.</i>
</h1>

<p className="mt-6 max-w-xl text-lg leading-7 text-[#34425a]">
  EIRA brings together the developments that matter, explains the context,
  and shows what’s confirmed—so you don’t have to sort through endless headlines.
</p>
          </div>

          <div className="inline-flex w-fit rounded-full border border-[#10233e]/15 bg-white/45 px-4 py-2 text-sm text-[#10233e]">
            Your region · <b>{regionLabel}</b>
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-900/10 bg-white/65 p-6 text-[#10233e]">
              <p className="font-medium">EIRA could not load the homepage.</p>
              <p className="mt-2 text-sm">{error}</p>
              <button
                onClick={loadHome}
                className="mt-4 rounded-full bg-[#10233e] px-4 py-2 text-sm text-white"
              >
                Try again
              </button>
            </div>
          ) : hero ? (
            <article className="reveal mx-auto w-full max-w-5xl rounded-[28px] border border-white/80 bg-[#fffdf9]/85 p-5 shadow-[0_22px_70px_rgba(31,42,59,.25)] backdrop-blur-xl sm:p-8">
              <div className="grid gap-7 lg:grid-cols-[1.35fr_.75fr]">
                <div>
                  <div className="mb-5 flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-[#10233e]/20 px-3 py-1 mono text-[10px] uppercase tracking-wider text-[#10233e]">
                      Start here
                    </span>
                    <span className="mono text-[10px] uppercase tracking-wider text-[#6d7280]">
                      {hero.source} · {formatDate(hero.publishedAt)}
                    </span>
                  </div>

                  <p className="mono mb-3 text-xs uppercase tracking-[.16em] text-[#ba7666]">
                    {regionLabel} · Current reporting
                  </p>

                  <h2 className="serif max-w-xl text-4xl leading-[1.04] tracking-[-.04em] text-[#10233e] sm:text-5xl">
                    {hero.title}
                  </h2>

                  <p className="mt-5 max-w-xl text-lg leading-7 text-[#46546b]">
                    {hero.description}
                  </p>

                  <div className="mt-7 flex flex-wrap gap-3">
                    <Link
                      href={storyLink(hero, regionLabel)}
                      className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#10233e] px-5 text-sm font-medium text-white"
                    >
                      Understand this story <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>

                <div className="hidden rounded-2xl bg-[#e9ded2] p-6 text-[#10233e] lg:block">
                  <p className="mono text-[10px] uppercase tracking-[.18em] text-[#a26f63]">
                    How EIRA helps
                  </p>

                  <div className="mt-8 space-y-5">
                    <Link
                      href={`/catch-up?topic=${encodeURIComponent(regionLabel)}`}
                      className="block border-b border-[#10233e]/15 pb-4"
                    >
                      <b>Catch me up</b>
                      <span className="block pt-1 text-sm text-[#556174]">
                        What has been happening in {regionLabel}
                      </span>
                    </Link>

                    <Link
                      href="/ask"
                      className="block border-b border-[#10233e]/15 pb-4"
                    >
                      <b>Ask EIRA</b>
                      <span className="block pt-1 text-sm text-[#556174]">
                        Ask about something happening now
                      </span>
                    </Link>

                    <Link href="/explore" className="block">
                      <b>Explore more</b>
                      <span className="block pt-1 text-sm text-[#556174]">
                        Follow a subject that interests you
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          ) : loading ? (
            <div className="rounded-[28px] border border-white/80 bg-[#fffdf9]/70 p-10 text-[#10233e]">
              Loading what matters in {regionLabel}…
            </div>
          ) : null}
        </div>
      </section>

      {/* REGIONAL — only shown when we actually have regional reporting */}
      {regionLabel !== 'India' && regionalMore.length > 0 && (
        <section className="bg-[#10261d] px-6 py-14 sm:px-10">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex items-end justify-between gap-6">
              <div>
                <SectionLabel>{regionLabel}</SectionLabel>
                <h2 className="serif text-4xl tracking-[-.04em]">
                  More from your region.
                </h2>
              </div>
              <ArrowLink href={`/explore?q=${encodeURIComponent(regionLabel)}`}>
                Explore the region
              </ArrowLink>
            </div>

            <StoryGrid stories={regionalMore} topic={regionLabel} />
          </div>
        </section>
      )}

      {/* INDIA */}
      {indiaMore.length > 0 && (
        <section className="bg-[#10261d] px-6 py-14 sm:px-10">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8">
              <SectionLabel>India</SectionLabel>
              <h2 className="serif text-4xl tracking-[-.04em]">
                What matters nationally.
              </h2>
            </div>

            <StoryGrid stories={indiaMore} topic="India" />
          </div>
        </section>
      )}

      {/* WORTH KNOWING */}
      {worthKnowing.length > 0 && (
        <section className="bg-[#10261d] px-6 pb-10 pt-2 sm:px-10">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6">
              <SectionLabel>Worth knowing</SectionLabel>
              <h2 className="serif text-3xl tracking-[-.035em]">
                A little more context.
              </h2>
            </div>
            <div className="max-w-3xl">
              <StoryGrid stories={worthKnowing} topic="India" />
            </div>
          </div>
        </section>
      )}

      {/* WORLD */}
      {worldMore.length > 0 && (
        <section className="bg-[#10261d] px-6 py-14 sm:px-10">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8">
              <SectionLabel>World</SectionLabel>
              <h2 className="serif text-4xl tracking-[-.04em]">
                What matters beyond India.
              </h2>
            </div>

            <StoryGrid stories={worldMore} topic="World" />
          </div>
        </section>
      )}

      <section className="bg-[#10261d] px-6 pb-16 pt-6 sm:px-10">
        <div className="mx-auto max-w-7xl rounded-[24px] border edge bg-[#173128] px-6 py-7 sm:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <SectionLabel>Keep exploring</SectionLabel>
              <h2 className="serif text-3xl tracking-[-.035em]">
                Go deeper when something matters to you.
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href={`/catch-up?topic=${encodeURIComponent(regionLabel)}`} className="rounded-full border edge px-4 py-2 text-sm hover:bg-white/10">Catch me up</Link>
              <Link href="/ask" className="rounded-full border edge px-4 py-2 text-sm hover:bg-white/10">Ask EIRA</Link>
              <Link href="/explore" className="rounded-full border edge px-4 py-2 text-sm hover:bg-white/10">Explore</Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
