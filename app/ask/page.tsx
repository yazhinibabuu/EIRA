'use client';



import { useEffect, useState } from 'react';

import { ArrowUp, ExternalLink } from 'lucide-react';



import {

  Nav,

  SectionLabel,

  Footer,

  Status,

} from '@/components/eira';
import { getStoredLanguage, type Language } from '@/components/language-switcher';



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



const copy = {
  en: {
    label: 'Ask EIRA', title1: 'Ask from the', title2: 'evidence.', desc: 'Ask about something happening in the world. EIRA researches current reporting and separates what is known from what is still uncertain.', question: 'Your question', placeholder: 'What do you want to understand?', note: 'EIRA will use current reporting and show its sources.', tryAsking: 'Try asking', researching: 'Researching', researchingTitle: 'Looking into what is known about your question.', errorTitle: 'EIRA could not answer', yourQuestion: 'Your question', in20: 'In 20 seconds', whatChanged: 'What changed', evidence: "What we know — and what we don't", supported: 'Directly supported by the available reporting', reported: 'Reported, but not independently established', unresolved: 'What remains unresolved', why: 'Why it matters', watch: 'What to watch', sources: 'Sources', how: 'How EIRA answers', howDesc: 'EIRA separates supported facts, reported claims, and unresolved questions instead of presenting every statement as equally certain.', examples: ['What is changing in AI right now?', 'What is happening with India US trade talks?', 'What is happening in Tamil Nadu?', 'What is happening in the semiconductor industry?']
  },
  ta: {
    label: 'EIRA-விடம் கேளுங்கள்', title1: 'ஆதாரங்களிலிருந்து', title2: 'கேளுங்கள்.', desc: 'உலகில் நடக்கும் நிகழ்வுகளைப் பற்றி கேளுங்கள். EIRA தற்போதைய செய்திகளை ஆய்ந்து, தெரிந்தவை மற்றும் இன்னும் உறுதி செய்யப்படாதவற்றைத் தனித்தனியாகக் காட்டுகிறது.', question: 'உங்கள் கேள்வி', placeholder: 'நீங்கள் எதைப் புரிந்துகொள்ள விரும்புகிறீர்கள்?', note: 'EIRA தற்போதைய செய்திகளைப் பயன்படுத்தி அதன் ஆதாரங்களைக் காட்டும்.', tryAsking: 'இவற்றைக் கேட்டு பாருங்கள்', researching: 'ஆராய்கிறது', researchingTitle: 'உங்கள் கேள்வியைப் பற்றி தெரிந்த தகவல்களைத் தேடுகிறது.', errorTitle: 'EIRA-வால் பதிலளிக்க முடியவில்லை', yourQuestion: 'உங்கள் கேள்வி', in20: '20 விநாடிகளில்', whatChanged: 'என்ன மாறியது', evidence: 'நமக்குத் தெரிந்தவை — தெரியாதவை', supported: 'கிடைத்த செய்திகளால் நேரடியாக ஆதரிக்கப்படுகிறது', reported: 'தெரிவிக்கப்பட்டுள்ளது, ஆனால் தனியாக உறுதி செய்யப்படவில்லை', unresolved: 'இன்னும் தீர்க்கப்படாதவை', why: 'இது ஏன் முக்கியம்', watch: 'எதைக் கவனிக்க வேண்டும்', sources: 'ஆதாரங்கள்', how: 'EIRA எவ்வாறு பதிலளிக்கிறது', howDesc: 'ஆதரிக்கப்பட்ட உண்மைகள், தெரிவிக்கப்பட்ட கூற்றுகள் மற்றும் தீர்க்கப்படாத கேள்விகளை EIRA தனித்தனியாகக் காட்டுகிறது.', examples: ['இப்போது AI துறையில் என்ன மாறுகிறது?', 'இந்தியா-அமெரிக்க வர்த்தகப் பேச்சுவார்த்தைகளில் என்ன நடக்கிறது?', 'தமிழ்நாட்டில் என்ன நடக்கிறது?', 'குறைக்கடத்தி துறையில் என்ன நடக்கிறது?']
  },
  hi: {
    label: 'EIRA से पूछें', title1: 'सबूतों से', title2: 'पूछें।', desc: 'दुनिया में हो रही घटनाओं के बारे में पूछें। EIRA मौजूदा रिपोर्टिंग पर शोध करता है और ज्ञात बातों को अनिश्चित बातों से अलग करता है।', question: 'आपका सवाल', placeholder: 'आप क्या समझना चाहते हैं?', note: 'EIRA मौजूदा रिपोर्टिंग का उपयोग करेगा और उसके स्रोत दिखाएगा।', tryAsking: 'यह पूछकर देखें', researching: 'शोध जारी है', researchingTitle: 'आपके सवाल के बारे में उपलब्ध जानकारी देखी जा रही है।', errorTitle: 'EIRA जवाब नहीं दे सका', yourQuestion: 'आपका सवाल', in20: '20 सेकंड में', whatChanged: 'क्या बदला', evidence: 'हम क्या जानते हैं — और क्या नहीं', supported: 'उपलब्ध रिपोर्टिंग से सीधे समर्थित', reported: 'रिपोर्ट किया गया, लेकिन स्वतंत्र रूप से स्थापित नहीं', unresolved: 'जो अभी स्पष्ट नहीं है', why: 'यह क्यों मायने रखता है', watch: 'क्या देखना है', sources: 'स्रोत', how: 'EIRA कैसे जवाब देता है', howDesc: 'EIRA समर्थित तथ्यों, रिपोर्ट किए गए दावों और अनसुलझे सवालों को अलग रखता है।', examples: ['अभी AI में क्या बदल रहा है?', 'भारत-अमेरिका व्यापार वार्ताओं में क्या हो रहा है?', 'तमिलनाडु में क्या हो रहा है?', 'सेमीकंडक्टर उद्योग में क्या हो रहा है?']
  },
} as const;

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

        <SectionLabel>{ui.label}</SectionLabel>



        <h1 className="serif max-w-3xl text-5xl leading-[.98] tracking-[-.05em] sm:text-7xl">

          {ui.title1}

          <br />

          <i>{ui.title2}</i>

        </h1>



        <p className="mt-6 max-w-xl text-lg leading-8 text-[#d5cdc1]">

          {ui.desc}

        </p>



        <form

          onSubmit={handleSubmit}

          className="mt-10 rounded-2xl border edge bg-[#20352b] p-3"

        >

          <label

            className="sr-only"

            htmlFor="question"

          >

            {ui.question}

          </label>



          <textarea

            id="question"

            value={question}

            onChange={(event) =>

              setQuestion(event.target.value)

            }

            placeholder={ui.placeholder}

            className="min-h-28 w-full resize-none bg-transparent p-3 text-lg leading-7 outline-none placeholder:text-[#8f9188]"

          />



          <div className="flex flex-col gap-3 border-t edge px-3 pt-3 sm:flex-row sm:items-center sm:justify-between">

            <span className="text-xs text-[#aaa398]">

              {ui.note}

            </span>



            <button

              type="submit"

              disabled={loading || !question.trim()}

              className="grid h-11 w-11 shrink-0 place-items-center self-end rounded-full bg-[#eedac0] text-[#1e3128] transition hover:bg-[#f3e3d0] disabled:cursor-not-allowed disabled:opacity-40 sm:self-auto"

              aria-label={ui.label}

            >

              <ArrowUp size={19} />

            </button>

          </div>

        </form>



        {!answer && !loading && !error && (

          <section className="mt-10">

            <SectionLabel>{ui.tryAsking}</SectionLabel>



            <div className="mt-4 flex flex-wrap gap-3">

              {[

                ...ui.examples,

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

              {ui.researching}

            </p>



            <h2 className="serif mt-3 text-3xl">

              {ui.researchingTitle}

            </h2>



            <div className="mt-6 h-2 overflow-hidden rounded-full bg-[#294137]">

              <div className="h-full w-1/2 animate-pulse rounded-full bg-[#dfaa70]" />

            </div>

          </section>

        )}



        {!loading && error && (

          <section className="reveal mt-10 rounded-2xl border border-[#a96f60]/50 bg-[#3a2925] p-7">

            <p className="mono text-[10px] uppercase tracking-widest text-[#e3aa72]">

              {ui.errorTitle}

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

                {ui.in20}

              </p>



              <p className="serif mt-4 text-2xl leading-9 sm:text-3xl sm:leading-10">

                {answer.shortVersion}

              </p>

            </div>



            {/* WHAT CHANGED */}

            {answer.whatChanged?.length > 0 && (

              <section className="mt-12">

                <SectionLabel>{ui.whatChanged}</SectionLabel>



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

                {ui.evidence}

              </SectionLabel>



              <div className="mt-4 overflow-hidden rounded-2xl border edge bg-[#1d3027]">

                {answer.confirmed?.length > 0 && (

                  <div className="p-6">

                    <div className="flex items-center gap-3">

                      <Status status="Confirmed" />



                      <span className="text-xs text-[#9f9a90]">

                        {ui.supported}

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

                        {ui.reported}

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

                        {ui.unresolved}

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

                <SectionLabel>{ui.why}</SectionLabel>



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

                <SectionLabel>{ui.watch}</SectionLabel>



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

                  {ui.sources} · {sources.length}

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