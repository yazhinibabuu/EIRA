'use client';

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import { ArrowRight, Search } from 'lucide-react';

import {
  Nav,
  SectionLabel,
  Footer,
  Status,
  DemoNote,
} from '@/components/eira';

import { oceanStory } from '@/data/content';

/* =========================================================
   TYPES
   ========================================================= */

type EvidenceItem = {
  text: string;
  sourceIds: number[];
};

type EiraResult = {
  shortVersion: string;
  whatChanged: EvidenceItem[];
  confirmed: EvidenceItem[];
  reported: EvidenceItem[];
  uncertain: EvidenceItem[];
  whyItMatters: string;
  whatToWatch: string[];
};

type Source = {
  id: number;
  title: string;
  url: string;
  publishedAt: string | null;
};

type SelectedStory = {
  title: string;
  source: string;
  description: string;
  publishedAt: string;
  url: string;
};

/* =========================================================
   COMPONENT
   ========================================================= */

export default function CatchUp() {
  const [topic, setTopic] = useState('');

  const [activeTopic, setActiveTopic] =
    useState('Climate');

  const [searched, setSearched] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [result, setResult] =
    useState<EiraResult | null>(null);

  const [sources, setSources] =
    useState<Source[]>([]);

  const [error, setError] =
    useState('');

  /*
    This stores the EXACT article the user
    selected from Explore.
  */
  const [selectedStory, setSelectedStory] =
    useState<SelectedStory | null>(null);

  /* =======================================================
     RESEARCH
     ======================================================= */

  async function researchTopic(
    value: string,
    story: SelectedStory | null = null
  ) {
    const trimmed = value.trim();

    if (!trimmed || loading) {
      return;
    }

    setTopic(trimmed);
    setActiveTopic(trimmed);
    setSearched(true);
    setLoading(true);
    setResult(null);
    setSources([]);
    setError('');
    setSelectedStory(story);

    try {
      const response = await fetch(
        '/api/catch-up',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            topic: trimmed,
            selectedStory: story,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            'EIRA could not research this topic.'
        );
      }

      setResult(
        data.result || null
      );

      setSources(
        data.sources || []
      );

      /*
        Keep the selected story visible even if
        the API also returns selectedStory.
      */
      if (data.selectedStory) {
        setSelectedStory(
          data.selectedStory
        );
      }
    } catch (err) {
      console.error(
        'Catch Me Up error:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong while researching the topic.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    /*
      Manual Catch Me Up search means:
      "Forget the previously selected article."
    */
    setSelectedStory(null);

    await researchTopic(
      topic,
      null
    );
  }

  /* =======================================================
     OPEN SELECTED STORY FROM EXPLORE
     ======================================================= */

  useEffect(() => {
    const params =
      new URLSearchParams(
        window.location.search
      );

    const topicFromExplore =
      params.get('topic')?.trim();

    const title =
      params.get('title')?.trim();

    const source =
      params.get('source')?.trim() || '';

    const description =
      params.get('description')?.trim() ||
      '';

    const publishedAt =
      params.get('publishedAt')?.trim() ||
      '';

    const url =
      params.get('url')?.trim() || '';

    if (!topicFromExplore) {
      return;
    }

    /*
      If Explore supplied an article,
      construct the selectedStory object.
    */
    let story: SelectedStory | null =
      null;

    if (title && url) {
      story = {
        title,
        source,
        description,
        publishedAt,
        url,
      };
    }

    setTopic(topicFromExplore);

    if (story) {
      setSelectedStory(story);
    }

    void researchTopic(
      topicFromExplore,
      story
    );

    // This intentionally runs once when Catch Me Up opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =======================================================
     EXAMPLES
     ======================================================= */

  function useExample(
    value: string
  ) {
    setTopic(value);
    setSelectedStory(null);
  }

  /* =======================================================
     SOURCE LOOKUP
     ======================================================= */

  function getSourceNumbers(
    sourceIds: number[]
  ): Source[] {
    return sourceIds
      .map((id) =>
        sources.find(
          (source) =>
            source.id === id
        )
      )
      .filter(
        (
          source
        ): source is Source =>
          Boolean(source)
      );
  }

  /* =======================================================
     EVIDENCE ROW
     ======================================================= */

  function EvidenceRow({
    item,
    label,
    symbol,
  }: {
    item: EvidenceItem;
    label: string;
    symbol: string;
  }) {
    const itemSources =
      getSourceNumbers(
        item.sourceIds
      );

    return (
      <div className="border-t border-white/10 py-5 first:border-t-0">
        <div className="flex gap-4">
          <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/15 text-xs text-[#dca268]">
            {symbol}
          </div>

          <div className="min-w-0">
            <p className="mono text-[9px] uppercase tracking-[.16em] text-[#9e968c]">
              {label}
            </p>

            <p className="mt-2 max-w-3xl text-[15px] leading-7 text-[#d8cfc3]">
              {item.text}
            </p>

            {itemSources.length >
              0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {itemSources.map(
                  (source) => (
                    <a
                      key={
                        source.id
                      }
                      href={
                        source.url
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="mono text-[9px] uppercase tracking-wider text-[#8f887e] transition hover:text-[#dca268]"
                    >
                      {source.title}
                    </a>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
     PAGE
     ======================================================= */

  return (
    <main className="page">
      <Nav />

      <div className="mx-auto max-w-5xl px-6 pb-20 pt-36 sm:px-10">

        {/* =================================================
            INTRO
            ================================================= */}

        <SectionLabel>
          Catch me up
        </SectionLabel>

        <h1 className="serif max-w-3xl text-5xl leading-[.98] tracking-[-.05em] sm:text-7xl">
          What do you want to
          <br />
          <i>understand?</i>
        </h1>

        <p className="mt-6 max-w-xl text-lg leading-8 text-[#d8cfc3]">
          Give EIRA a topic. We’ll build
          the story from what changed,
          what is known, why it matters,
          and what to watch next.
        </p>

        {/* =================================================
            SEARCH
            ================================================= */}

        <form
          onSubmit={handleSubmit}
          className="mt-10 rounded-2xl border border-white/15 bg-white/[0.04] p-3"
        >
          <div className="flex flex-col gap-3 sm:flex-row">

            <div className="flex flex-1 items-center gap-3 rounded-xl bg-white/[0.06] px-4">

              <Search
                size={18}
                className="shrink-0 text-[#c8bdac]"
              />

              <input
                value={topic}
                onChange={(e) => {
                  setTopic(
                    e.target.value
                  );

                  /*
                    Typing a new topic means
                    the user is no longer asking
                    about the previously selected
                    article.
                  */
                  if (
                    selectedStory
                  ) {
                    setSelectedStory(
                      null
                    );
                  }
                }}
                placeholder='Try “India–US trade talks”'
                className="h-14 w-full border-0 bg-transparent text-base text-[#f4eee6] outline-none ring-0 focus:border-0 focus:outline-none focus:ring-0 placeholder:text-[#8f887e]"
                aria-label="Topic to catch up on"
                spellCheck={false}
              />

            </div>

            <button
              type="submit"
              disabled={
                loading ||
                !topic.trim()
              }
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-[#e3d2b8] px-6 font-medium text-[#1c3027] transition hover:bg-[#f0dfc5] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? 'Researching…'
                : 'Catch me up'}

              {!loading && (
                <ArrowRight
                  size={17}
                />
              )}
            </button>

          </div>
        </form>

        {/* =================================================
            EXAMPLES
            ================================================= */}

        <div className="mt-5 flex flex-wrap gap-2">
          {[
            'India–US trade talks',
            'AI regulation',
            'Semiconductor industry',
            'Climate change',
          ].map(
            (example) => (
              <button
                key={example}
                type="button"
                onClick={() =>
                  useExample(
                    example
                  )
                }
                className="rounded-full border border-white/15 px-4 py-2 text-xs text-[#cfc6ba] transition hover:border-white/30 hover:bg-white/[0.05]"
              >
                {example}
              </button>
            )
          )}
        </div>

        {/* =================================================
            RESULT AREA
            ================================================= */}

        <div className="mt-16">

          {/* STATUS */}

          <div className="mb-8 flex flex-wrap items-center gap-3">

            <Status
              status={
                searched
                  ? 'Developing'
                  : oceanStory.status
              }
            />

            <span className="mono text-[10px] uppercase tracking-wider text-[#9e968c]">
              {loading
                ? 'Researching live sources…'
                : searched
                  ? 'Live research result'
                  : oceanStory.verified}
            </span>

          </div>

          {/* =================================================
              SELECTED STORY
              ================================================= */}

          {selectedStory && (
            <section className="mb-10 rounded-2xl border border-[#dca268]/25 bg-[#dca268]/[0.05] p-6 sm:p-8">

              <p className="mono text-[10px] uppercase tracking-[.16em] text-[#dca268]">
                Understanding this story
              </p>

              <h3 className="serif mt-3 max-w-4xl text-3xl leading-tight sm:text-4xl">
                {selectedStory.title}
              </h3>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-[#aaa195]">

                {selectedStory.source && (
                  <span>
                    {selectedStory.source}
                  </span>
                )}

                {selectedStory.source &&
                  selectedStory.publishedAt && (
                    <span className="text-[#686f69]">
                      ·
                    </span>
                  )}

                {selectedStory.publishedAt && (
                  <span>
                    {new Date(
                      selectedStory.publishedAt
                    ).toLocaleDateString(
                      'en-IN',
                      {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      }
                    )}
                  </span>
                )}

              </div>

              {selectedStory.description && (
                <p className="mt-4 max-w-3xl text-sm leading-7 text-[#c9c1b5]">
                  {
                    selectedStory.description
                  }
                </p>
              )}

              <a
                href={
                  selectedStory.url
                }
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex items-center gap-2 text-sm text-[#f3d3a8] transition hover:text-[#fff0d5]"
              >
                Read the original story
                <ArrowRight
                  size={15}
                />
              </a>

            </section>
          )}

          {/* TOPIC */}

          <p className="mono mb-3 text-xs uppercase tracking-[.16em] text-[#ba7666]">
            {selectedStory
              ? 'Story context'
              : `Catch up · ${activeTopic}`}
          </p>

          <h2 className="serif max-w-4xl text-4xl leading-[1.04] tracking-[-.04em] sm:text-6xl">
            {selectedStory
              ? 'This story, in context.'
              : searched
                ? `${activeTopic}, in context.`
                : 'Climate, in the last 30 days.'}
          </h2>

          {/* =================================================
              LOADING
              ================================================= */}

          {loading && (
            <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.035] p-7 sm:p-10">

              <p className="mono text-[10px] uppercase tracking-widest text-[#dca268]">
                EIRA research layer
              </p>

              <h3 className="serif mt-3 text-3xl">
                Gathering the latest
                information.
              </h3>

              <p className="mt-3 max-w-2xl leading-7 text-[#d0c8bc]">
                {selectedStory
                  ? 'EIRA is checking this story against recent reporting and building the context around it.'
                  : 'EIRA is searching recent sources and building the context around this topic.'}
              </p>

              <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-1/3 animate-pulse rounded-full bg-[#dca268]" />
              </div>

            </div>
          )}

          {/* =================================================
              ERROR
              ================================================= */}

          {error &&
            !loading && (
              <div className="mt-10 rounded-2xl border border-red-300/20 bg-red-300/[0.05] p-7 sm:p-10">

                <p className="mono text-[10px] uppercase tracking-widest text-[#e6a29a]">
                  EIRA research error
                </p>

                <h3 className="serif mt-3 text-3xl">
                  We couldn’t build
                  this story.
                </h3>

                <p className="mt-3 max-w-2xl leading-7 text-[#d0c8bc]">
                  {error}
                </p>

              </div>
            )}

          {/* =================================================
              LIVE EIRA RESULT
              ================================================= */}

          {result &&
            !loading &&
            !error && (
              <>

                {/* -----------------------------------------
                    ESSENTIAL ANSWER
                    ----------------------------------------- */}

                <section className="mt-10 rounded-2xl bg-[#e3d2b8] p-7 text-[#1c3027] sm:p-10">

                  <div className="flex items-center justify-between gap-4">

                    <p className="mono text-[10px] uppercase tracking-widest">
                      In 20 seconds
                    </p>

                    <span className="mono text-[9px] uppercase tracking-wider opacity-60">
                      EIRA
                    </span>

                  </div>

                  <p className="serif mt-5 max-w-3xl text-2xl leading-[1.35] sm:text-3xl">
                    {result.shortVersion}
                  </p>

                </section>

                {/* -----------------------------------------
                    WHAT CHANGED
                    ----------------------------------------- */}

                {result.whatChanged
                  .length > 0 && (
                  <section className="mt-16">

                    <SectionLabel>
                      What changed
                    </SectionLabel>

                    <h3 className="serif mt-3 text-3xl sm:text-4xl">
                      The latest movement.
                    </h3>

                    <div className="mt-6">

                      {result.whatChanged
                        .slice(0, 3)
                        .map(
                          (
                            item,
                            index
                          ) => (
                            <div
                              key={`${item.text}-${index}`}
                              className="border-t border-white/10 py-5"
                            >

                              <div className="flex gap-5">

                                <span className="mono shrink-0 text-[10px] text-[#dca268]">
                                  {String(
                                    index + 1
                                  ).padStart(
                                    2,
                                    '0'
                                  )}
                                </span>

                                <div>

                                  <p className="max-w-3xl text-[15px] leading-7 text-[#d8cfc3]">
                                    {item.text}
                                  </p>

                                  <div className="mt-2 flex flex-wrap gap-2">
  {getSourceNumbers(item.sourceIds).map(
    (source) => (
      <a
        key={source.id}
        href={source.url}
        target="_blank"
        rel="noreferrer"
        className="mono text-[9px] uppercase tracking-wider text-[#8f887e] transition hover:text-[#dca268]"
      >
        {source.title}
      </a>
    )
  )}
</div>

                                </div>

                              </div>

                            </div>
                          )
                        )}

                    </div>

                  </section>
                )}

                {/* -----------------------------------------
                    EVIDENCE
                    ----------------------------------------- */}

                <section className="mt-16">

                  <SectionLabel>
                    Evidence
                  </SectionLabel>

                  <h3 className="serif mt-3 text-3xl sm:text-4xl">
                    What we know —
                    <br className="sm:hidden" />{' '}
                    and what we don’t.
                  </h3>

                  <p className="mt-3 max-w-2xl text-sm leading-6 text-[#9e968c]">
                    EIRA separates established
                    facts from claims and
                    unresolved questions.
                  </p>

                  <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.025] px-6 sm:px-8">

                    {/* CONFIRMED */}

                    {result.confirmed
                      .slice(0, 3)
                      .map(
                        (
                          item,
                          index
                        ) => (
                          <EvidenceRow
                            key={`confirmed-${index}-${item.text}`}
                            item={item}
                            label="Confirmed"
                            symbol="✓"
                          />
                        )
                      )}

                    {/* REPORTED */}

                    {result.reported
                      .slice(0, 2)
                      .map(
                        (
                          item,
                          index
                        ) => (
                          <EvidenceRow
                            key={`reported-${index}-${item.text}`}
                            item={item}
                            label="Reported"
                            symbol="~"
                          />
                        )
                      )}

                    {/* UNCERTAIN */}

                    {result.uncertain
                      .slice(0, 2)
                      .map(
                        (
                          item,
                          index
                        ) => (
                          <EvidenceRow
                            key={`uncertain-${index}-${item.text}`}
                            item={item}
                            label="Uncertain"
                            symbol="?"
                          />
                        )
                      )}

                  </div>

                </section>

                {/* -----------------------------------------
                    WHY IT MATTERS
                    ----------------------------------------- */}

                {result.whyItMatters && (
                  <section className="mt-16 border-y border-white/10 py-10">

                    <SectionLabel>
                      Why it matters
                    </SectionLabel>

                    <p className="serif mt-4 max-w-4xl text-2xl leading-[1.4] sm:text-3xl">
                      {result.whyItMatters}
                    </p>

                  </section>
                )}

                {/* -----------------------------------------
                    SOURCES
                    ----------------------------------------- */}

                {sources.length >
                  0 && (
                  <section className="mt-16">

                    <SectionLabel>
                      Sources
                    </SectionLabel>

                    <h3 className="serif mt-3 text-3xl sm:text-4xl">
                      Go deeper if
                      you want to.
                    </h3>

                    <p className="mt-3 max-w-xl text-sm leading-6 text-[#9e968c]">
                      EIRA's understanding is
                      built from these recent
                      sources.
                    </p>

                    <div className="mt-7">

                      {sources.map(
                        (
                          source
                        ) => (
                          <a
                            key={
                              source.id
                            }
                            href={
                              source.url
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="group block border-t border-white/10 py-5 transition hover:border-[#dca268]/40"
                          >

                            <div className="flex items-start gap-5">

                              <span className="mono shrink-0 text-[10px] text-[#dca268]">
                                {String(
                                  source.id
                                ).padStart(
                                  2,
                                  '0'
                                )}
                              </span>

                              <div className="min-w-0 flex-1">

                                <p className="text-sm leading-6 text-[#d8cfc3] transition group-hover:text-[#f4eee6]">
                                  {
                                    source.title
                                  }
                                </p>

                                {source.publishedAt && (
                                  <p className="mono mt-2 text-[9px] uppercase tracking-wider text-[#8f887e]">
                                    {new Date(
                                      source.publishedAt
                                    ).toLocaleDateString(
                                      'en-IN',
                                      {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                      }
                                    )}
                                  </p>
                                )}

                              </div>

                              <ArrowRight
                                size={15}
                                className="mt-1 shrink-0 text-[#8f887e] transition group-hover:translate-x-1 group-hover:text-[#dca268]"
                              />

                            </div>

                          </a>
                        )
                      )}

                    </div>

                  </section>
                )}

              </>
            )}

          {/* =================================================
              DEFAULT DEMO STATE
              ================================================= */}

          {!searched && (
            <>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#d8cfc3]">
                A clear starting point,
                meaningful changes, and
                the thread that connects
                them.
              </p>

              {/* DEMO TIMELINE */}

              <div className="mt-16 grid gap-10 lg:grid-cols-[230px_1fr]">

                <aside>

                  <p className="mono text-[10px] uppercase tracking-widest text-[#dca268]">
                    The beginning
                  </p>

                  <p className="mt-3 leading-7 text-[#d5cdc0]">
                    Climate policy is the
                    mix of choices societies
                    use to reduce warming
                    and prepare for its
                    effects.
                  </p>

                </aside>

                <div className="border-l border-[#c78c59] pl-7">

                  {oceanStory.timeline.map(
                    (item) => (
                      <div
                        className="relative mb-10"
                        key={item.date}
                      >

                        <i className="absolute -left-[34px] top-1 h-3 w-3 rounded-full bg-[#dfab72]" />

                        <p className="mono text-[10px] uppercase tracking-widest text-[#dfab72]">
                          {item.date}
                        </p>

                        <h2 className="serif mt-1 text-3xl">
                          {item.title}
                        </h2>

                        <p className="mt-2 max-w-xl leading-7 text-[#d7cfc3]">
                          {item.detail}{' '}
                          <span className="text-[#f4d4a8]">
                            Why it matters:
                          </span>{' '}
                          it helps show
                          the direction
                          of the story
                          without
                          treating a
                          single moment
                          as the whole
                          picture.
                        </p>

                        <div className="mt-3">
                          <Status
                            status={
                              item.status
                            }
                          />
                        </div>

                      </div>
                    )
                  )}

                </div>

              </div>

              {/* WHERE TO GO NEXT */}

              <div className="mt-10 rounded-2xl bg-[#e3d2b8] p-7 text-[#1c3027] sm:p-10">

                <p className="mono text-[10px] uppercase tracking-widest">
                  Where to go next
                </p>

                <h2 className="serif mt-2 text-4xl">
                  Follow the ocean
                  signal as it develops.
                </h2>

                <Link
                  href="/story/ocean-current"
                  className="mt-5 inline-flex items-center gap-2 font-medium"
                >
                  Open the living story
                  <ArrowRight
                    size={17}
                  />
                </Link>

              </div>

            </>
          )}

        </div>

        {/* =================================================
            DEMO NOTE
            ================================================= */}

        <div className="mt-8">
          <DemoNote />
        </div>

      </div>

      <Footer />
    </main>
  );
}