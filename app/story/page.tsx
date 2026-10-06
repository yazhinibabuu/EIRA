"use client";



import Link from "next/link";

import {

  ArrowLeft,

  ArrowUpRight,

  ExternalLink,

} from "lucide-react";

import { useEffect, useState } from "react";



import {

  Footer,

  Nav,

  SectionLabel,

} from "@/components/eira";



type StorySection = {

  heading: string;

  paragraphs: string[];

  sourceIds: string[];

};



type StoryResult = {

  mode: "story";

  headline: string;

  deck: string;

  hook: string;

  sections: StorySection[];

  bottomLine: string;
  confirmed: string[];
  openQuestions: string[];

};



type Source = {

  id: string;

  title: string;

  source: string;

  publishedAt: string;

  url: string;

};



type ApiResponse = {

  result?: StoryResult;

  sources?: Source[];

  error?: string;

};



function formatDate(value: string): string {

  if (!value) return "";



  const date = new Date(value);



  if (Number.isNaN(date.getTime())) {

    return "";

  }



  return date.toLocaleDateString("en-IN", {

    day: "numeric",

    month: "short",

    year: "numeric",

  });

}



export default function StoryPage() {

  const [story, setStory] =

    useState<StoryResult | null>(null);



  const [sources, setSources] =

    useState<Source[]>([]);



  const [loading, setLoading] =

    useState(true);



  const [error, setError] =

    useState("");



  useEffect(() => {

    async function loadStory() {

      const params =

        new URLSearchParams(

          window.location.search

        );



      const title =

        params.get("title")?.trim() || "";



      const source =

        params.get("source")?.trim() || "";



      const publishedAt =

        params.get("publishedAt")?.trim() || "";



      const description =

        params.get("description")?.trim() || "";



      const url =

        params.get("url")?.trim() || "";



      const topic =

        params.get("topic")?.trim() ||

        title;



      if (!title || !url) {

        setError(

          "The selected story could not be found."

        );

        setLoading(false);

        return;

      }



      try {

        /*

         * IMPORTANT:

         * Story pages use /api/story.

         *

         * DO NOT change this back to

         * /api/catch-up.

         */

        const response = await fetch(

          "/api/story",

          {

            method: "POST",

            headers: {

              "Content-Type":

                "application/json",

            },

            cache: "no-store",

            body: JSON.stringify({

              topic,

              selectedStory: {

                title,

                source,

                publishedAt,

                description,

                url,

              },

            }),

          }

        );



        const raw =

          await response.text();



        let data:

          | ApiResponse

          | null = null;



        try {

          data = raw.trim()

            ? (JSON.parse(raw) as ApiResponse)

            : null;

        } catch {

          throw new Error(

            response.status === 404

              ? "The Story API was not found. Make sure app/api/story/route.ts exists, then restart Next.js."

              : "The Story API returned an invalid response. Restart Next.js and try again."

          );

        }



        if (!response.ok) {

          throw new Error(

            data?.error ||

              "EIRA couldn't build this story."

          );

        }



        if (!data?.result) {

          throw new Error(

            "EIRA returned no story."

          );

        }



        setStory(data.result);

        setSources(data.sources || []);

      } catch (err) {

        console.error(

          "EIRA Story error:",

          err

        );



        setError(

          err instanceof Error

            ? err.message

            : "EIRA couldn't build this story."

        );

      } finally {

        setLoading(false);

      }

    }



    void loadStory();

  }, []);



  return (

    <main className="min-h-screen bg-[#10271f] text-[#e8dfd3]">

      <Nav />



      <div className="mx-auto max-w-5xl px-6 pb-24 pt-20 md:px-10 md:pt-24">

        <Link

          href="/explore"

          className="inline-flex items-center gap-2 text-sm text-[#8f9b91] transition hover:text-[#dca268]"

        >

          <ArrowLeft size={15} />

          Back to Explore

        </Link>



        {loading && (

          <div className="mt-24 max-w-3xl">

            <SectionLabel>

              EIRA research

            </SectionLabel>



            <h1 className="mt-5 font-serif text-4xl leading-tight text-[#eee5d8] md:text-6xl">

              Understanding the story...

            </h1>



            <p className="mt-5 text-base leading-7 text-[#8f9b91]">

              EIRA is checking the selected

              story against recent reporting.

            </p>

          </div>

        )}



        {!loading && error && (

          <div className="mt-20 max-w-3xl rounded-2xl border border-[#dca268]/20 bg-[#142d24] p-10">

            <SectionLabel>

              EIRA research error

            </SectionLabel>



            <h1 className="mt-5 font-serif text-4xl text-[#eee5d8]">

              We couldn't build this story.

            </h1>



            <p className="mt-5 text-base leading-7 text-[#b9b1a6]">

              {error}

            </p>



            <Link

              href="/explore"

              className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#ead8bc] px-6 py-3 text-sm font-medium text-[#183027]"

            >

              Return to Explore

              <ArrowUpRight size={15} />

            </Link>

          </div>

        )}



        {!loading && !error && story && (

          <>

            {/* STORY HEADER */}



            <article className="mt-16">

              <SectionLabel>

                This story

              </SectionLabel>



              <div className="mt-5 flex flex-wrap items-center gap-3">

                <span className="mono text-[9px] uppercase tracking-[0.16em] text-[#dca268]">

                  {sources[0]?.source ||

                    "Source"}

                </span>



                {sources[0]?.publishedAt && (

                  <>

                    <span className="text-[#58665e]">

                      ·

                    </span>



                    <span className="mono text-[9px] uppercase tracking-[0.16em] text-[#69756d]">

                      {formatDate(

                        sources[0].publishedAt

                      )}

                    </span>

                  </>

                )}

              </div>



              <h1 className="mt-7 max-w-4xl font-serif text-5xl leading-[0.98] tracking-[-0.04em] text-[#eee5d8] md:text-7xl">

                {story.headline}

              </h1>



              <p className="mt-7 max-w-3xl text-lg leading-8 text-[#b6b8ad]">

                {story.deck}

              </p>



              <div className="mt-12 max-w-3xl border-l border-[#dca268]/50 pl-6 md:pl-8">

                <p className="font-serif text-xl leading-8 text-[#e3dacd] md:text-2xl">

                  {story.hook}

                </p>

              </div>

            </article>



            {/* WHAT IS CONFIRMED / WHAT IS STILL OPEN */}

            {(story.confirmed.length > 0 || story.openQuestions.length > 0) && (
              <section className="mt-20 max-w-4xl border-y border-white/10 py-12">
                <div className="grid gap-10 md:grid-cols-2">
                  {story.confirmed.length > 0 && (
                    <div>
                      <SectionLabel>What's confirmed</SectionLabel>
                      <ul className="mt-5 space-y-4">
                        {story.confirmed.map((item: string, index: number) => (
                          <li key={`confirmed-${index}`} className="flex gap-3 text-[15px] leading-7 text-[#b8b7ad]">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#dca268]" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {story.openQuestions.length > 0 && (
                    <div>
                      <SectionLabel>What's still open</SectionLabel>
                      <ul className="mt-5 space-y-4">
                        {story.openQuestions.map((item: string, index: number) => (
                          <li key={`open-${index}`} className="flex gap-3 text-[15px] leading-7 text-[#b8b7ad]">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full border border-[#dca268]" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* STORY BODY */}

            <div className="mt-20 max-w-3xl">

              {story.sections.map(

                (section, index) => (

                  <section

                    key={`${section.heading}-${index}`}

                    className="border-t border-white/10 py-12"

                  >

                    <div className="flex gap-5">

                      <span className="mono pt-1 text-[9px] tracking-[0.16em] text-[#dca268]">

                        {String(index + 1).padStart(

                          2,

                          "0"

                        )}

                      </span>



                      <div className="min-w-0 flex-1">

                        <h2 className="font-serif text-3xl leading-tight text-[#eee5d8] md:text-4xl">

                          {section.heading}

                        </h2>



                        <div className="mt-6 space-y-5">

                          {section.paragraphs.map(

                            (

                              paragraph,

                              paragraphIndex

                            ) => (

                              <p

                                key={

                                  paragraphIndex

                                }

                                className="text-[15px] leading-8 text-[#b8b7ad] md:text-base"

                              >

                                {paragraph}

                              </p>

                            )

                          )}

                        </div>



                        {section.sourceIds.length >

                          0 && (

                          <div className="mt-6 flex flex-wrap gap-3">

                            {section.sourceIds.map(

                              (sourceId) => {

                                const source =

                                  sources.find(

                                    (item) =>

                                      item.id ===

                                      sourceId

                                  );



                                if (!source) {

                                  return null;

                                }



                                return (

                                  <a

                                    key={

                                      sourceId

                                    }

                                    href={

                                      source.url

                                    }

                                    target="_blank"

                                    rel="noreferrer"

                                    className="mono inline-flex items-center gap-1.5 text-[9px] uppercase tracking-[0.14em] text-[#7f8a82] transition hover:text-[#dca268]"

                                  >

                                    {source.source}

                                    <ExternalLink

                                      size={10}

                                    />

                                  </a>

                                );

                              }

                            )}

                          </div>

                        )}

                      </div>

                    </div>

                  </section>

                )

              )}

            </div>



            {/* TAKEAWAY */}



            <section className="mt-4 max-w-3xl border-y border-white/10 py-12">

              <SectionLabel>

                The takeaway

              </SectionLabel>



              <p className="mt-5 font-serif text-2xl leading-9 text-[#e7ded2] md:text-3xl">

                {story.bottomLine}

              </p>

            </section>



            {/* SOURCES */}



            {sources.length > 0 && (

              <section className="mt-20 max-w-4xl">

                <SectionLabel>

                  Sources

                </SectionLabel>



                <h2 className="mt-4 font-serif text-3xl text-[#eee5d8] md:text-4xl">

                  Check the reporting yourself.

                </h2>



                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#7f8982]">

                  EIRA's explanation is built from the reporting shown below.

                  Only sources relevant to this specific development are included.

                </p>



                <div className="mt-8 divide-y divide-white/10 border-y border-white/10">

                  {sources.map(

                    (source, index) => (

                      <a

                        key={source.id}

                        href={source.url}

                        target="_blank"

                        rel="noreferrer"

                        className="group block py-6"

                      >

                        <div className="flex gap-5">

                          <span className="mono pt-1 text-[9px] text-[#dca268]">

                            {String(

                              index + 1

                            ).padStart(

                              2,

                              "0"

                            )}

                          </span>



                          <div className="min-w-0 flex-1">

                            <div className="flex flex-wrap items-center gap-3">

                              <span className="mono text-[9px] uppercase tracking-[0.14em] text-[#dca268]">

                                {source.source}

                              </span>



                              {source.publishedAt && (

                                <>

                                  <span className="text-[#4d5b53]">

                                    ·

                                  </span>



                                  <span className="mono text-[9px] uppercase tracking-[0.14em] text-[#69756d]">

                                    {formatDate(

                                      source.publishedAt

                                    )}

                                  </span>

                                </>

                              )}

                            </div>



                            <h3 className="mt-2 text-sm leading-6 text-[#d1cbc1] transition group-hover:text-[#eee5d8]">

                              {source.title}

                            </h3>

                          </div>



                          <ArrowUpRight

                            size={16}

                            className="mt-1 shrink-0 text-[#69756d] transition group-hover:text-[#dca268]"

                          />

                        </div>

                      </a>

                    )

                  )}

                </div>

              </section>

            )}



            {/* END */}



            <div className="mt-24 flex items-center justify-between border-t border-white/10 pt-8">

              <div>

                <p className="mono text-[9px] uppercase tracking-[0.16em] text-[#69756d]">

                  You've reached the end

                </p>



                <p className="mt-2 text-sm text-[#8f9b91]">

                  Want to understand something else?

                </p>

              </div>



              <Link

                href="/explore"

                className="inline-flex items-center gap-2 text-sm text-[#dca268] transition hover:text-[#f0b978]"

              >

                Explore another story

                <ArrowUpRight size={15} />

              </Link>

            </div>

          </>

        )}

      </div>



      <Footer />

    </main>

  );

}