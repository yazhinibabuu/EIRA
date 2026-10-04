'use client';







import Link from 'next/link';



import { ArrowRight, ChevronRight } from 'lucide-react';



import { useEffect, useState } from 'react';







import { Nav, Footer, SectionLabel } from '@/components/eira';



import {



  getStoredLanguage,



  type Language,



} from '@/components/language-switcher';







type HomeStory = {



  title: string;



  source: string;



  publishedAt: string;



  description: string;



  url: string;



  image: string;



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







const copy = {



  en: {



    kicker: 'Understand what’s happening',







    headline1: 'Know what happened.',



    headline2: 'Understand why it matters.',







    description:



      'EIRA brings together the developments that matter, explains the context, and shows what’s confirmed—so you don’t have to sort through endless headlines.',







    region: 'Your region',



    current: 'Current reporting',



    startHere: 'Start here',



    understand: 'Understand this story',







    changed: 'What changed while you were away',



    startWith: 'Start with what matters.',



    seeMore: 'See more',







    catchUp: 'Catch me up',



    catchUpDesc:



      'Get up to speed in seconds.',







    explain: 'Explain simply',



    explainDesc:



      'Make a complex story easier to grasp.',







    views: 'Show different views',



    viewsDesc:



      'See how different sources are reporting it.',







    deeper: 'Go deeper',



    deeperDesc:



      'Get the context behind the headline.',







    moreRegion: 'More from your region.',



    national: 'What matters nationally.',



    world: 'What matters beyond India.',







    loading: 'Loading what matters',



    noStories: 'No current stories are available right now.',



    retry: 'Try again',







    understandArrow: 'Understand',
    brighterTomorrow: 'A brighter\ntomorrow together',



  },







  ta: {



    kicker: 'என்ன நடக்கிறது என்பதைப் புரிந்துகொள்ளுங்கள்',







    headline1: 'என்ன நடந்தது என்பதை அறியுங்கள்.',



    headline2: 'அது ஏன் முக்கியம் என்பதைப் புரிந்துகொள்ளுங்கள்.',







    description:



      'முக்கியமான நிகழ்வுகளை EIRA ஒன்றாகக் கொண்டு வந்து, அதன் பின்னணியை விளக்குகிறது மற்றும் எது உறுதிப்படுத்தப்பட்டுள்ளது என்பதை காட்டுகிறது—நீங்கள் எண்ணற்ற செய்தித் தலைப்புகளைத் தேட வேண்டியதில்லை.',







    region: 'உங்கள் பகுதி',



    current: 'தற்போதைய செய்தி',



    startHere: 'இங்கிருந்து தொடங்குங்கள்',



    understand: 'இந்த செய்தியைப் புரிந்துகொள்ளுங்கள்',







    changed: 'நீங்கள் இல்லாத நேரத்தில் என்ன மாறியது',



    startWith: 'முக்கியமானவற்றிலிருந்து தொடங்குங்கள்.',



    seeMore: 'மேலும்',







    catchUp: 'விரைவாகத் தெரிந்துகொள்ளுங்கள்',



    catchUpDesc:



      'சில வினாடிகளில் முக்கியமான விஷயங்களைத் தெரிந்துகொள்ளுங்கள்.',







    explain: 'எளிமையாக விளக்குங்கள்',



    explainDesc:



      'சிக்கலான செய்தியை எளிதாகப் புரிந்துகொள்ளுங்கள்.',







    views: 'வேறுபட்ட பார்வைகளைப் பாருங்கள்',



    viewsDesc:



      'வேறு செய்தி ஆதாரங்கள் இதை எப்படி தெரிவிக்கின்றன என்பதைப் பாருங்கள்.',







    deeper: 'மேலும் அறியுங்கள்',



    deeperDesc:



      'தலைப்புக்குப் பின்னால் இருக்கும் பின்னணியைப் புரிந்துகொள்ளுங்கள்.',







    moreRegion: 'உங்கள் பகுதியின் மேலும் செய்திகள்.',



    national: 'இந்திய அளவில் முக்கியமானவை.',



    world: 'இந்தியாவுக்கு அப்பால் முக்கியமானவை.',







    loading: 'முக்கியமான செய்திகளை ஏற்றுகிறது',



    noStories: 'இப்போது தற்போதைய செய்திகள் கிடைக்கவில்லை.',



    retry: 'மீண்டும் முயற்சிக்கவும்',







    understandArrow: 'புரிந்துகொள்ளுங்கள்',
    brighterTomorrow: 'ஒன்றாக\nஒரு சிறந்த நாளையை நோக்கி',



  },







  hi: {



    kicker: 'जो हो रहा है उसे समझिए',







    headline1: 'क्या हुआ, जानिए।',



    headline2: 'समझिए कि यह क्यों मायने रखता है।',







    description:



      'EIRA महत्वपूर्ण घटनाओं को एक जगह लाता है, उनका संदर्भ समझाता है और बताता है कि क्या पुष्टि हो चुकी है—ताकि आपको अंतहीन सुर्खियों में खोजने की जरूरत न पड़े।',







    region: 'आपका क्षेत्र',



    current: 'ताज़ा रिपोर्टिंग',



    startHere: 'यहाँ से शुरू करें',



    understand: 'इस खबर को समझें',







    changed: 'जब आप दूर थे तब क्या बदला',



    startWith: 'जो मायने रखता है, उससे शुरू करें।',



    seeMore: 'और देखें',







    catchUp: 'जल्दी से अपडेट हों',



    catchUpDesc:



      'कुछ ही सेकंड में जरूरी बातें जानें।',







    explain: 'आसान भाषा में समझें',



    explainDesc:



      'जटिल खबर को आसानी से समझें।',







    views: 'अलग-अलग नजरिए देखें',



    viewsDesc:



      'अलग स्रोत इस खबर को कैसे रिपोर्ट कर रहे हैं, देखें।',







    deeper: 'और गहराई से जानें',



    deeperDesc:



      'सुर्खियों के पीछे का संदर्भ समझें।',







    moreRegion: 'आपके क्षेत्र से और खबरें।',



    national: 'भारत में क्या महत्वपूर्ण है।',



    world: 'भारत के बाहर क्या महत्वपूर्ण है।',







    loading: 'महत्वपूर्ण खबरें लोड हो रही हैं',



    noStories: 'अभी कोई ताज़ा खबर उपलब्ध नहीं है।',



    retry: 'फिर से कोशिश करें',







    understandArrow: 'समझें',
    brighterTomorrow: 'मिलकर\nएक बेहतर कल की ओर',



  },



};







function formatSyncedAgo(timestamp: number | null) {

  if (!timestamp) return '';

  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));

  if (seconds < 5) return 'Synced just now';

  if (seconds < 60) return `Synced ${seconds} sec ago`;

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) return `Synced ${minutes} min ago`;

  const hours = Math.floor(minutes / 60);

  return `Synced ${hours} hr ago`;
}



function formatDate(value: string) {



  const date = new Date(value);







  if (Number.isNaN(date.getTime())) {



    return '';



  }







  return date.toLocaleDateString('en-IN', {



    day: 'numeric',



    month: 'short',



    year: 'numeric',



  });



}

function formatTodayDate() {
  return new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}







function storyLink(



  story: HomeStory,



  topic: string



) {



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







function storyKey(story: HomeStory) {



  return story.title



    .toLowerCase()



    .replace(/\s\|\s.*$/g, '')



    .replace(/[^a-z0-9]+/g, ' ')



    .trim();



}







function isSameStory(



  a: HomeStory,



  b: HomeStory



) {



  if (a.url && b.url && a.url === b.url) {



    return true;



  }







  const aKey = storyKey(a);



  const bKey = storyKey(b);







  return Boolean(



    aKey &&



      bKey &&



      aKey === bKey



  );



}







function removeStory(



  stories: HomeStory[],



  excluded: HomeStory[]



) {



  return stories.filter(



    (story) =>



      !excluded.some((candidate) =>



        isSameStory(story, candidate)



      )



  );



}







function StoryCard({



  story,



  topic,



  ui,



}: {



  story: HomeStory;



  topic: string;



  ui: (typeof copy)['en'];



}) {



  return (



    <Link



      href={storyLink(story, topic)}



      className="group block overflow-hidden rounded-[24px] border border-white/10 bg-[#19372d]/95 p-4 transition duration-300 hover:-translate-y-1 hover:bg-[#1d4035]"



    >



      <div className="relative mb-5 h-28 overflow-hidden rounded-[18px] bg-[linear-gradient(135deg,#24483d_0%,#31584f_48%,#586a72_100%)]">

        {story.image ? (

          <img
            src={story.image}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            loading="lazy"
            referrerPolicy="no-referrer"
          />

        ) : (

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_20%,rgba(224,173,115,.22),transparent_32%),linear-gradient(135deg,rgba(36,72,61,.95),rgba(49,88,79,.95)_48%,rgba(88,106,114,.95))]" />

        )}

        <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(255,255,255,.08),transparent_42%,rgba(7,28,24,.48)_100%)]" />

        <span className="absolute bottom-3 left-3 rounded-full border border-white/25 bg-black/20 px-2.5 py-1 mono text-[8px] uppercase tracking-[.16em] text-white/90 backdrop-blur-sm">

          EIRA · STORY

        </span>

      </div>







      <p className="mono text-[9px] uppercase tracking-[.16em] text-[#e4ad73]">



        {story.source || ui.current}



      </p>







      <h3 className="serif mt-2 text-[22px] leading-[1.12] text-[#f5efe5]">



        {story.title}



      </h3>







      {story.description && (



        <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#c9c2b8]">



          {story.description}



        </p>



      )}







      <div className="mt-4 flex items-center justify-between gap-3">



        <span className="mono text-[9px] uppercase tracking-wider text-[#9faaa3]">



          {formatDate(story.publishedAt)}



        </span>







        <span className="inline-flex items-center gap-1 text-xs text-[#ead9c5]">



          {ui.understandArrow}



          <ArrowRight size={13} />



        </span>



      </div>



    </Link>



  );



}







export default function Home() {



  const [data, setData] =



    useState<HomeResponse | null>(null);







  const [loading, setLoading] =



    useState(true);







  const [error, setError] =



    useState('');

  const [syncedAt, setSyncedAt] = useState<number | null>(null);

  const [, setSyncTick] = useState(0);







  const [language, setLanguage] =



    useState<Language>('en');







  useEffect(() => {



    const syncLanguage = () => {



      setLanguage(getStoredLanguage());



    };







    syncLanguage();







    window.addEventListener(



      'storage',



      syncLanguage



    );







    window.addEventListener(



      'eira:language-changed',



      syncLanguage



    );







    return () => {



      window.removeEventListener(



        'storage',



        syncLanguage



      );







      window.removeEventListener(



        'eira:language-changed',



        syncLanguage



      );



    };



  }, []);







  async function detectUserRegion() {

    const stateCodes: Record<string, string> = {

      AP: 'Andhra Pradesh', AR: 'Arunachal Pradesh', AS: 'Assam', BR: 'Bihar', CT: 'Chhattisgarh',

      GA: 'Goa', GJ: 'Gujarat', HR: 'Haryana', HP: 'Himachal Pradesh', JH: 'Jharkhand',

      KA: 'Karnataka', KL: 'Kerala', MP: 'Madhya Pradesh', MH: 'Maharashtra', MN: 'Manipur',

      ML: 'Meghalaya', MZ: 'Mizoram', NL: 'Nagaland', OD: 'Odisha', PB: 'Punjab',

      RJ: 'Rajasthan', SK: 'Sikkim', TN: 'Tamil Nadu', TG: 'Telangana', TR: 'Tripura',

      UP: 'Uttar Pradesh', UK: 'Uttarakhand', WB: 'West Bengal', DL: 'Delhi', PY: 'Puducherry',

    };



    try {

      const cached = window.sessionStorage.getItem('eira:region');

      if (cached) return cached;

    } catch {}



    try {

      // Coarse IP-based location only. This never requests browser GPS permission.

      const response = await fetch(

        'https://free.freeipapi.com/api/v1/json',

        { cache: 'no-store' }

      );



      if (response.ok) {

        const location = (await response.json()) as {

          countryCode?: string;

          regionCode?: string;

          regionName?: string;

        };



        if (location.countryCode === 'IN') {

          const code = (location.regionCode || '').toUpperCase();

          const region =

            stateCodes[code] ||

            Object.values(stateCodes).find(

              (name) =>

                name.toLowerCase() ===

                (location.regionName || '').toLowerCase()

            ) ||

            'India';



          try {

            window.sessionStorage.setItem('eira:region', region);

          } catch {}



          return region;

        }

      }

    } catch {}



    return 'India';

  }



  async function loadHome() {



    setLoading(true);



    setError('');







    try {



      const detectedRegion = await detectUserRegion();

      const params = new URLSearchParams();

      if (detectedRegion && detectedRegion !== 'India') {

        params.set('region', detectedRegion);

      }



      
      // Send the selected language explicitly so the API translates every Home story.
      params.set('lang', language);

      const response = await fetch(

        params.toString()

          ? `/api/home?${params.toString()}`

          : '/api/home',

        {

          cache: 'no-store',

        }

      );







      const result =



        (await response.json()) as HomeResponse;







      if (!response.ok) {



        throw new Error(



          result.error ||



            'EIRA could not load current stories.'



        );



      }







      setData(result);
      const retrievedTime = new Date(result.retrievedAt).getTime();
      setSyncedAt(Number.isNaN(retrievedTime) ? Date.now() : retrievedTime);



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
    const syncTimer = window.setInterval(() => {
      setSyncTick((value) => value + 1);
    }, 1000);

    return () => {
      window.clearInterval(syncTimer);
    };
  }, []);



  useEffect(() => {
    void loadHome();

    const refreshTimer = window.setInterval(() => {
      void loadHome();
    }, 60_000);

    return () => {
      window.clearInterval(refreshTimer);
    };
  }, [language]);







  const ui = copy[language];







  const region =



    data?.region || 'India';







  const regional =



    data?.regional ?? [];







  const india =



    data?.india ?? [];







  const world =



    data?.world ?? [];







  /*



   * IMPORTANT:



   * Regional reporting remains first.



   * We are NOT replacing it with India.



   */



  const hero =



    regional[0] ||



    india[0] ||



    world[0];







  const remainingRegional =



    removeStory(



      regional.slice(1),



      hero ? [hero] : []



    ).slice(0, 2);







  const usedAfterRegional =



    hero



      ? [hero, ...remainingRegional]



      : remainingRegional;







  const indiaStories =



    removeStory(



      india,



      usedAfterRegional



    ).slice(0, 2);







  const worldStories =



    removeStory(



      world,



      [



        ...usedAfterRegional,



        ...indiaStories,



      ]



    ).slice(0, 2);







  return (



    <main className="min-h-screen bg-[#10261d]">



      {/* =====================================================



          HERO



          ===================================================== */}



      <section className="relative isolate overflow-hidden px-5 pb-8 pt-5 sm:px-8 lg:px-10">

        <div

          className="absolute inset-0 -z-30 bg-cover bg-center"

          style={{ backgroundImage: "url('/eira-hero-bg.png')" }}

        />

        <div className="absolute inset-0 -z-20 bg-[#071b18]/35 mix-blend-multiply" />

        <div className="absolute inset-0 -z-20 bg-gradient-to-r from-[#071b18]/55 via-transparent to-[#071b18]/15" />

        <div className="absolute inset-x-0 bottom-0 -z-10 h-56 bg-[linear-gradient(to_bottom,rgba(16,38,29,0)_0%,rgba(16,38,29,.10)_28%,rgba(16,38,29,.42)_58%,#10261d_100%)]" />

        <div className="pointer-events-none absolute right-[12%] top-[12%] -z-10 h-64 w-64 rounded-full bg-[#f6c48f]/15 blur-3xl" />

<div className="relative z-10">

          <div className="[&_a]:!text-white [&_button]:!text-white [&_svg]:!text-white">

            <Nav />

          </div>



          <div className="mx-auto max-w-7xl pt-12 sm:pt-16">

            <div className="grid items-start gap-8 lg:grid-cols-[.95fr_1.05fr] lg:gap-12">

              <div className="max-w-[680px] pb-4 lg:pb-8">

                <p className="inline-block rounded-full border border-white/15 bg-[#10261d]/25 px-3 py-1 mono text-[10px] uppercase tracking-[.22em] text-[#ead9c9] backdrop-blur-[2px]">

                  {ui.kicker}

                </p>



                <h1 className="serif mt-5 max-w-[680px] text-[48px] leading-[.94] tracking-[-.055em] text-white drop-shadow-[0_3px_18px_rgba(0,0,0,.22)] sm:text-[68px] lg:text-[78px]">

                  {ui.headline1}

                  <br />

                  <i>{ui.headline2}</i>

                </h1>



                <p className="mt-6 max-w-lg text-base leading-7 text-white/85 drop-shadow-[0_2px_10px_rgba(0,0,0,.2)] sm:text-lg">

                  {ui.description}

                </p>



                <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/30 bg-black/20 px-4 py-2 text-xs text-white shadow-[0_8px_30px_rgba(0,0,0,.12)] backdrop-blur-md">

                  <span className="h-2 w-2 rounded-full bg-[#bb7664]" />

                  {ui.region} · <b>{region}</b>

                </div>

              </div>



              {error ? (

                <div className="rounded-[30px] border border-white/80 bg-white/80 p-8 text-[#10233e] shadow-[0_28px_90px_rgba(31,42,59,.18)] backdrop-blur-xl">

                  <p className="font-medium">{error}</p>

                  <button onClick={loadHome} className="mt-5 rounded-full bg-[#10233e] px-5 py-3 text-sm text-white">

                    {ui.retry}

                  </button>

                </div>

              ) : loading ? (

                <div className="relative mt-8 flex min-h-[300px] items-center overflow-hidden rounded-[28px] border border-white/30 bg-white/70 p-8 text-[#10233e] shadow-[0_30px_90px_rgba(0,0,0,.18)] backdrop-blur-xl lg:mt-10">
                  {ui.loading} {region}…
                </div>

              ) : hero ? (

                <article className="relative mt-8 overflow-hidden rounded-[28px] border border-white/30 bg-[#071f1a]/62 shadow-[0_30px_90px_rgba(0,0,0,.38)] backdrop-blur-xl lg:mt-10">

                  <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#e8ad83]/18 blur-3xl" />

                  <div className="relative grid min-w-0 gap-0 md:grid-cols-[minmax(0,1.15fr)_minmax(0,.72fr)]">

                    <div className="p-6 sm:p-8 lg:p-9">

                      <div className="flex flex-wrap items-center gap-3">

                        <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 mono text-[9px] uppercase tracking-wider text-white backdrop-blur-md">

                          {ui.startHere}

                        </span>

                        <span className="mono text-[9px] uppercase tracking-wider text-white/60">

                          {hero.source} · {formatTodayDate()}

                        </span>

                      </div>



                      <p className="mono mt-7 text-[10px] uppercase tracking-[.18em] text-[#e8b07d]">

                        {region} · {ui.current}

                      </p>



                      <h2 className="serif mt-3 max-w-2xl text-[30px] leading-[1.06] tracking-[-.035em] text-white drop-shadow-[0_2px_12px_rgba(0,0,0,.18)] sm:text-[39px]">

                        {hero.title}

                      </h2>



                      {hero.description && (

                        <p className="mt-5 max-w-xl text-sm leading-6 text-white/72">

                          {hero.description}

                        </p>

                      )}



                      <div className="mt-7 flex flex-wrap items-center gap-4">

                        <Link

                          href={storyLink(hero, region)}

                          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-medium text-[#10233e] shadow-[0_10px_25px_rgba(0,0,0,.18)] transition hover:-translate-y-0.5"

                        >

                          {ui.understand}

                          <ArrowRight size={16} />

                        </Link>

                        <span className="mono text-[9px] uppercase tracking-[.16em] text-white/55">

                          Live editorial selection · {formatSyncedAgo(syncedAt)}

                        </span>

                      </div>

                    </div>



                    <div

                      className="relative min-h-[230px] overflow-hidden bg-cover bg-center"

                      style={{ backgroundImage: "url('/eira-hero-bg.png')" }}

                    >

                      <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(7,28,27,.12),rgba(7,28,27,.58))]" />

                      <div className="absolute left-5 top-5 rounded-full border border-white/25 bg-black/15 px-3 py-1.5 text-[9px] uppercase tracking-[.18em] text-white backdrop-blur-md">

                        EIRA · NOW

                      </div>

                      <div className="absolute left-5 right-5 top-[58px] min-w-0 rounded-2xl border border-white/20 bg-[#10261d]/55 px-3.5 py-2.5 shadow-[0_8px_30px_rgba(0,0,0,.16)] backdrop-blur-md">

                        <div className="flex min-w-0 items-start gap-2">

                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#d98970]" />

                          <span className="mono min-w-0 break-words whitespace-pre-line text-[8px] font-medium uppercase leading-[1.4] tracking-[.12em] text-[#e6b19b]">

                            {ui.brighterTomorrow}

                          </span>

                        </div>

                      </div>

                      <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/20 bg-[#071f1a]/65 p-4 text-white backdrop-blur-md">

                        <p className="mono text-[9px] uppercase tracking-[.16em] text-[#f0c39b]">{ui.startHere}</p>

                        <p className="serif mt-1 text-xl leading-tight">{region}</p>

                        <p className="mt-1 text-xs text-white/75">{ui.changed}</p>

                      </div>

                    </div>

                  </div>

                </article>

              ) : (

                <div className="rounded-[30px] border border-white/80 bg-white/70 p-8 text-[#10233e] shadow-[0_28px_90px_rgba(31,42,59,.18)] backdrop-blur-xl">

                  {ui.noStories}

                </div>

              )}

            </div>



            <div className="mt-5 flex items-center justify-between text-white/80">

              <p className="mono text-[9px] uppercase tracking-[.2em]">Less noise. More clarity.</p>

              <div className="hidden items-center gap-2 sm:flex">

                <span className="h-px w-8 bg-white/30" />

                <span className="mono text-[9px] uppercase tracking-[.18em]">EIRA</span>

              </div>

            </div>

          </div>

        </div>

      </section>



'''

      {/* =====================================================



          REGIONAL STORIES



          ===================================================== */}



      {remainingRegional.length > 0 && (



        <section className="px-5 pb-12 sm:px-8 lg:px-10">



          <div className="mx-auto max-w-7xl">



            <SectionLabel>



              {region}



            </SectionLabel>







            <h2 className="serif text-4xl tracking-[-.04em] text-[#f5eee4]">



              {ui.moreRegion}



            </h2>







            <div className="mt-7 grid gap-5 md:grid-cols-2">



              {remainingRegional.map(



                (story) => (



                  <StoryCard



                    key={



                      story.url ||



                      story.title



                    }



                    story={story}



                    topic={region}



                    ui={ui}



                  />



                )



              )}



            </div>



          </div>



        </section>



      )}







      {/* =====================================================



          INDIA



          ===================================================== */}



      {indiaStories.length > 0 && (



        <section className="px-5 py-12 sm:px-8 lg:px-10">



          <div className="mx-auto max-w-7xl">



            <SectionLabel>



              India



            </SectionLabel>







            <h2 className="serif text-4xl tracking-[-.04em] text-[#f5eee4]">



              {ui.national}



            </h2>







            <div className="mt-7 grid gap-5 md:grid-cols-2">



              {indiaStories.map(



                (story) => (



                  <StoryCard



                    key={



                      story.url ||



                      story.title



                    }



                    story={story}



                    topic="India"



                    ui={ui}



                  />



                )



              )}



            </div>



          </div>



        </section>



      )}







      {/* =====================================================



          WORLD



          ===================================================== */}



      {worldStories.length > 0 && (



        <section className="px-5 py-12 sm:px-8 lg:px-10">



          <div className="mx-auto max-w-7xl">



            <SectionLabel>



              World



            </SectionLabel>







            <h2 className="serif text-4xl tracking-[-.04em] text-[#f5eee4]">



              {ui.world}



            </h2>







            <div className="mt-7 grid gap-5 md:grid-cols-2">



              {worldStories.map(



                (story) => (



                  <StoryCard



                    key={



                      story.url ||



                      story.title



                    }



                    story={story}



                    topic="World"



                    ui={ui}



                  />



                )



              )}



            </div>



          </div>



        </section>



      )}







      <Footer />



    </main>



  );



}