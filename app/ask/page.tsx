'use client';



import { useState } from 'react';

import { ArrowUp, ExternalLink } from 'lucide-react';



import {

  Nav,

  SectionLabel,

  Footer,

  Status,

} from '@/components/eira';



type Source = {

  id: number;

  title: string;

  url: string;

  publishedAt: string | null;

};



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



type AskResponse = {

  topic: string;

  result: EiraResult;

  sources: Source[];

  sourceCount: number;

  retrievedAt: string;

  error?: string;

};



function getSources(

  sourceIds: number[] | undefined,

  sources: Source[]

) {

  if (!sourceIds || sourceIds.length === 0) {

    return [];

  }



  return sourceIds

    .map((id) => sources.find((source) => source.id === id))

    .filter(Boolean) as Source[];

}



function formatDate(date: string | null) {

  if (!date) return '';



  const parsed = new Date(date);



  if (Number.isNaN(parsed.getTime())) {

    return '';

  }



  return parsed.toLocaleDateString('en-IN', {

    day: 'numeric',

    month: 'short',

    year: 'numeric',

  });

}



function EvidenceItemRow({

  item,

  sources,

}: {

  item: EvidenceItem;

  sources: Source[];

}) {

  const linkedSources = getSources(item.sourceIds, sources);



  return (

    <div className="border-t edge py-5 first:border-t-0">

      <p className="leading-7 text-[#ddd5c9]">

        {item.text}

      </p>



      {linkedSources.length > 0 && (

        <div className="mt-3 flex flex-wrap gap-3">

          {linkedSources.map((source) => (

            <a

              key={source.id}

              href={source.url}

              target="_blank"

              rel="noreferrer"

              className="inline-flex items-center gap-1.5 text-xs text-[#dca76d] transition hover:text-[#f3d3a8]"

            >

              {`Source ${source.id}`}

              <ExternalLink size={12} />

            </a>

          ))}

        </div>

      )}

    </div>

  );

}



export default function Ask() {

  const [question, setQuestion] = useState('');

  const [askedQuestion, setAskedQuestion] = useState('');

  const [answer, setAnswer] = useState<EiraResult | null>(null);

  const [sources, setSources] = useState<Source[]>([]);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState('');



  async function handleSubmit(

    event: React.FormEvent<HTMLFormElement>

  ) {

    event.preventDefault();



    const value = question.trim();



    if (!value || loading) {

      return;

    }



    setLoading(true);

    setError('');

    setAnswer(null);

    setSources([]);

    setAskedQuestion(value);



    try {

      const response = await fetch('/api/catch-up', {

        method: 'POST',

        headers: {

          'Content-Type': 'application/json',

        },

        body: JSON.stringify({

          topic: value,

        }),

      });



      const data: AskResponse = await response.json();



      if (!response.ok) {

        throw new Error(

          data?.error ||

            'EIRA could not research this question.'

        );

      }



      if (!data.result) {

        throw new Error(

          'EIRA did not return a usable answer.'

        );

      }



      setAnswer(data.result);

      setSources(data.sources || []);

    } catch (err) {

      console.error('Ask EIRA error:', err);



      setError(

        err instanceof Error

          ? err.message

          : 'Something went wrong while researching your question.'

      );

    } finally {

      setLoading(false);

    }

  }



  function useExample(value: string) {

    setQuestion(value);

  }



  return (

    <main className="page">

      <Nav />



      <div className="mx-auto max-w-4xl px-6 pb-20 pt-36 sm:px-10">

        <SectionLabel>Ask EIRA</SectionLabel>



        <h1 className="serif max-w-3xl text-5xl leading-[.98] tracking-[-.05em] sm:text-7xl">

          Ask from the

          <br />

          <i>evidence.</i>

        </h1>



        <p className="mt-6 max-w-xl text-lg leading-8 text-[#d5cdc1]">

          Ask about something happening in the world. EIRA researches

          current reporting and separates what is known from what is

          still uncertain.

        </p>



        <form

          onSubmit={handleSubmit}

          className="mt-10 rounded-2xl border edge bg-[#20352b] p-3"

        >

          <label

            className="sr-only"

            htmlFor="question"

          >

            Your question

          </label>



          <textarea

            id="question"

            value={question}

            onChange={(event) =>

              setQuestion(event.target.value)

            }

            placeholder="What do you want to understand?"

            className="min-h-28 w-full resize-none bg-transparent p-3 text-lg leading-7 outline-none placeholder:text-[#8f9188]"

          />



          <div className="flex flex-col gap-3 border-t edge px-3 pt-3 sm:flex-row sm:items-center sm:justify-between">

            <span className="text-xs text-[#aaa398]">

              EIRA will use current reporting and show its sources.

            </span>



            <button

              type="submit"

              disabled={loading || !question.trim()}

              className="grid h-11 w-11 shrink-0 place-items-center self-end rounded-full bg-[#eedac0] text-[#1e3128] transition hover:bg-[#f3e3d0] disabled:cursor-not-allowed disabled:opacity-40 sm:self-auto"

              aria-label="Ask EIRA"

            >

              <ArrowUp size={19} />

            </button>

          </div>

        </form>



        {!answer && !loading && !error && (

          <section className="mt-10">

            <SectionLabel>Try asking</SectionLabel>



            <div className="mt-4 flex flex-wrap gap-3">

              {[

                'What is changing in AI right now?',

                'What is happening with India US trade talks?',

                'What is happening in Tamil Nadu?',

                'What is happening in the semiconductor industry?',

              ].map((example) => (

                <button

                  key={example}

                  type="button"

                  onClick={() => useExample(example)}

                  className="rounded-full border edge bg-[#1c3027] px-4 py-2.5 text-sm text-[#d5cdc1] transition hover:border-[#dfaa70]/50 hover:text-[#f3d3a8]"

                >

                  {example}

                </button>

              ))}

            </div>

          </section>

        )}



        {loading && (

          <section className="reveal mt-10 rounded-2xl border edge bg-[#1d3027] p-7">

            <p className="mono text-[10px] uppercase tracking-widest text-[#e3aa72]">

              Researching

            </p>



            <h2 className="serif mt-3 text-3xl">

              Looking into what is known about your question.

            </h2>



            <div className="mt-6 h-2 overflow-hidden rounded-full bg-[#294137]">

              <div className="h-full w-1/2 animate-pulse rounded-full bg-[#dfaa70]" />

            </div>

          </section>

        )}



        {!loading && error && (

          <section className="reveal mt-10 rounded-2xl border border-[#a96f60]/50 bg-[#3a2925] p-7">

            <p className="mono text-[10px] uppercase tracking-widest text-[#e3aa72]">

              EIRA could not answer

            </p>



            <p className="mt-3 leading-7 text-[#ddd5c9]">

              {error}

            </p>

          </section>

        )}



        {!loading && answer && (

          <section className="reveal mt-10">

            <div className="border-b edge pb-6">

                            <h2 className="serif mt-3 text-3xl leading-tight sm:text-4xl">

                {askedQuestion}

              </h2>

            </div>



            {/* SHORT VERSION */}

            <div className="mt-8 rounded-2xl border edge bg-[#eadbc5] p-7 text-[#21342c] sm:p-8">

              <p className="mono text-[10px] uppercase tracking-widest text-[#8d684b]">

                In 20 seconds

              </p>



              <p className="serif mt-4 text-2xl leading-9 sm:text-3xl sm:leading-10">

                {answer.shortVersion}

              </p>

            </div>



            {/* WHAT CHANGED */}

            {answer.whatChanged?.length > 0 && (

              <section className="mt-12">

                <SectionLabel>What changed</SectionLabel>



                <div className="mt-4 rounded-2xl border edge bg-[#1d3027] px-6">

                  {answer.whatChanged.map((item, index) => (

                    <EvidenceItemRow

                      key={`changed-${index}`}

                      item={item}

                      sources={sources}

                    />

                  ))}

                </div>

              </section>

            )}



            {/* EVIDENCE */}

            {(answer.confirmed?.length > 0 ||
              answer.reported?.length > 0 ||
              answer.uncertain?.length > 0) && (
              <section className="mt-12">

              <SectionLabel>

                What we know

              </SectionLabel>



              <div className="mt-4 overflow-hidden rounded-2xl border edge bg-[#1d3027]">

                {answer.confirmed?.length > 0 && (

                  <div className="p-6">

                    <div className="flex items-center gap-3">

                      <Status status="Confirmed" />



                      <span className="text-xs text-[#9f9a90]">

                        Directly supported by the available reporting

                      </span>

                    </div>



                    <div className="mt-3">

                      {answer.confirmed.map((item, index) => (

                        <EvidenceItemRow

                          key={`confirmed-${index}`}

                          item={item}

                          sources={sources}

                        />

                      ))}

                    </div>

                  </div>

                )}



                {answer.reported?.length > 0 && (

                  <div className="border-t edge p-6">

                    <div className="flex items-center gap-3">

                      <Status status="Developing" />



                      <span className="text-xs text-[#9f9a90]">

                        Reported, but not independently established

                      </span>

                    </div>



                    <div className="mt-3">

                      {answer.reported.map((item, index) => (

                        <EvidenceItemRow

                          key={`reported-${index}`}

                          item={item}

                          sources={sources}

                        />

                      ))}

                    </div>

                  </div>

                )}



                {answer.uncertain?.length > 0 && (

                  <div className="border-t edge p-6">

                    <div className="flex items-center gap-3">

                      <Status status="Unconfirmed" />



                      <span className="text-xs text-[#9f9a90]">

                        What remains unresolved

                      </span>

                    </div>



                    <div className="mt-3">

                      {answer.uncertain.map((item, index) => (

                        <EvidenceItemRow

                          key={`uncertain-${index}`}

                          item={item}

                          sources={sources}

                        />

                      ))}

                    </div>

                  </div>

                )}

              </div>

              </section>
            )}



            {/* WHY IT MATTERS */}

            {answer.whyItMatters && (

              <section className="mt-12">

                <SectionLabel>Why it matters</SectionLabel>



                <div className="mt-4 rounded-2xl border edge bg-[#20352b] p-7">

                  <p className="max-w-3xl text-lg leading-8 text-[#d8d0c4]">

                    {answer.whyItMatters}

                  </p>

                </div>

              </section>

            )}



            {/* WHAT TO WATCH */}

            {answer.whatToWatch?.length > 0 && (

              <section className="mt-12">

                <SectionLabel>What to watch</SectionLabel>



                <div className="mt-4 space-y-3">

                  {answer.whatToWatch.map((item, index) => (

                    <div

                      key={index}

                      className="flex gap-4 rounded-xl border edge bg-[#1d3027] p-5"

                    >

                      <span className="mono shrink-0 text-xs text-[#e0a56b]">

                        0{index + 1}

                      </span>



                      <p className="leading-7 text-[#d5cdc1]">

                        {item}

                      </p>

                    </div>

                  ))}

                </div>

              </section>

            )}



            {/* SOURCES */}

            {sources.length > 0 && (

              <section className="mt-12">

                <SectionLabel>

                  Sources · {sources.length}

                </SectionLabel>



                <div className="mt-4 space-y-2">

                  {sources.map((source) => (

                    <a

                      key={source.id}

                      href={source.url}

                      target="_blank"

                      rel="noreferrer"

                      className="group flex items-start justify-between gap-4 rounded-xl border edge bg-[#1c3027] p-4 transition hover:border-[#dfaa70]/40"

                    >

                      <div>

                        <p className="text-sm leading-6 text-[#ddd5c9]">

                          {source.title}

                        </p>



                        {formatDate(source.publishedAt) && (

                          <p className="mt-1 text-xs text-[#8f9188]">

                            {formatDate(source.publishedAt)}

                          </p>

                        )}

                      </div>



                      <ExternalLink

                        size={15}

                        className="mt-1 shrink-0 text-[#cda06f] transition group-hover:text-[#f3d3a8]"

                      />

                    </a>

                  ))}

                </div>

              </section>

            )}



          </section>

        )}

      </div>



      <Footer />

    </main>

  );

}