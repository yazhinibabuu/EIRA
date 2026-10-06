'use client';







import Link from 'next/link';



import { ArrowRight } from 'lucide-react';



import { useEffect, useRef, useState } from 'react';







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
  topic?: string;



};







type HomeResponse = {



  region: string;



  regionCode: string;



  regional: HomeStory[];



  india: HomeStory[];



  world: HomeStory[];



  retrievedAt: string;



  error?: string;
  currentPool?: { regional: HomeStory[]; india: HomeStory[]; world: HomeStory[] };



};







const copy = {



  en: {



    kicker: 'Understand what’s happening',

    greeting: 'Good morning.',
    subtitle: 'Here’s what changed while you were away.',
    topics: ['All', 'Tamil Nadu', 'India', 'World', 'Business', 'Technology', 'Health'],







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
    whatHappened: 'What happened',
    brighterTomorrow: 'A brighter\ntomorrow together',



  },







  ta: {



    kicker: 'என்ன நடக்கிறது என்பதைப் புரிந்துகொள்ளுங்கள்',

    greeting: 'காலை வணக்கம்.',
    subtitle: 'நீங்கள் இல்லாத நேரத்தில் என்ன மாறியது என்பதைப் பாருங்கள்.',
    topics: ['அனைத்தும்', 'தமிழ்நாடு', 'இந்தியா', 'உலகம்', 'வணிகம்', 'தொழில்நுட்பம்', 'சுகாதாரம்'],







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
    whatHappened: 'என்ன நடந்தது',
    brighterTomorrow: 'ஒன்றாக\nஒரு சிறந்த நாளையை நோக்கி',



  },







  hi: {



    kicker: 'जो हो रहा है उसे समझिए',

    greeting: 'सुप्रभात।',
    subtitle: 'जब आप दूर थे तब क्या बदला, जानिए।',
    topics: ['सभी', 'तमिलनाडु', 'भारत', 'दुनिया', 'बिज़नेस', 'टेक्नोलॉजी', 'स्वास्थ्य'],







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
    whatHappened: 'क्या हुआ',
    brighterTomorrow: 'मिलकर\nएक बेहतर कल की ओर',



  },



};







function formatFreshness(timestamp: number | null) {
  if (!timestamp) return '';
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  if (minutes < 1) return 'Updated just now';
  if (minutes < 60) return `Updated ${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  return `Updated ${hours} hr ago`;
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







function topicLabel(topic: string) {
  const labels: Record<string, string> = {
    'public-safety': 'Public safety',
    'courts': 'Courts',
    'infrastructure': 'Infrastructure',
    'technology': 'Technology',
    'health': 'Health',
    'business': 'Business',
    'economy': 'Economy',
    'government': 'Government',
    'education': 'Education',
    'disaster': 'Disaster',
    'weather': 'Weather',
    'general': 'EIRA story',
  };
  return labels[topic] || topic.replace(/-/g, ' ');
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
      className="group block rounded-[20px] border border-white/10 bg-[#17352c] p-6 shadow-[0_14px_40px_rgba(0,0,0,.14)] transition duration-300 hover:-translate-y-1 hover:border-white/20"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="mono text-[9px] uppercase tracking-[.16em] text-[#d9a071]">{topicLabel(story.topic || 'general')}</span>
        <span className="mono text-[8px] uppercase tracking-[.14em] text-[#8f9b94]">{formatDate(story.publishedAt)}</span>
      </div>
      <h3 className="serif mt-3 line-clamp-2 text-[23px] leading-[1.08] tracking-[-.025em] text-[#f5efe5]">{story.title}</h3>
      {story.description && (
        <p className="mt-4 line-clamp-2 text-[14px] leading-6 text-[#c9c1b5]">{story.description}</p>
      )}
      <div className="mt-5 flex items-center justify-between border-t border-white/8 pt-4">
        <span className="mono text-[8px] uppercase tracking-[.14em] text-[#8f9b94]">{story.source || ui.current}</span>
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#f5efe5] group-hover:text-[#d98970]">{ui.understandArrow} <ArrowRight size={14} /></span>
      </div>
    </Link>
  );
}


export default function Home() {



  const [data, setData] =



    useState<HomeResponse | null>(null);







  const [loading, setLoading] =



    useState(true);

  const [refreshing, setRefreshing] = useState(false);
  const hasLoadedRef = useRef(false);







  const [error, setError] =



    useState('');

  const [syncedAt, setSyncedAt] = useState<number | null>(null);

  const [, setSyncTick] = useState(0);







  const [language, setLanguage] =



    useState<Language>('en');

  const [activeTopic, setActiveTopic] = useState('All');







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



    if (hasLoadedRef.current) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }



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
      hasLoadedRef.current = true;
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
      setRefreshing(false);



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







  const region = data?.region || 'India';

  const allRegional = data?.currentPool?.regional ?? data?.regional ?? [];
  const allIndia = data?.currentPool?.india ?? data?.india ?? [];
  const allWorld = data?.currentPool?.world ?? data?.world ?? [];

  const topicKey = activeTopic.toLowerCase();
  const topicStories = (stories: HomeStory[]) => stories.filter((story) => story.topic === topicKey);

  const filteredRegional = activeTopic === 'All' || activeTopic === region
    ? allRegional
    : activeTopic === 'India' || activeTopic === 'World'
      ? []
      : topicStories(allRegional);

  const filteredIndia = activeTopic === 'All' || activeTopic === 'India'
    ? allIndia
    : activeTopic === 'World'
      ? []
      : topicStories(allIndia);

  const filteredWorld = activeTopic === 'All' || activeTopic === 'World'
    ? allWorld
    : topicStories(allWorld);

  const hasTopicResults = filteredRegional.length + filteredIndia.length + filteredWorld.length > 0;
  const regional = filteredRegional;
  const india = filteredIndia;
  const world = filteredWorld;

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



  const storyScope = (story: HomeStory) =>
    regional.includes(story) ? region : india.includes(story) ? 'India' : 'World';

  const heroScope = hero ? storyScope(hero) : region;



  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_78%_0%,rgba(217,137,112,.10),transparent_28%),linear-gradient(180deg,#102a23_0%,#0e241d_52%,#102a23_100%)] text-[#f5efe5]">
      <section className="pb-12 pt-5">
        <Nav />

        <div className="px-5 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <div className="pt-20 sm:pt-24">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="mono text-[10px] uppercase tracking-[.2em] text-[#d9a071]">{ui.kicker}</p>
                <h1 className="serif mt-2 text-[38px] leading-none tracking-[-.045em] text-[#f5efe5] sm:text-[50px]">{ui.greeting}</h1>
                <p className="mt-3 text-base text-[#c9c1b5] sm:text-lg">{ui.subtitle}</p>
              </div>
              <div className="mono mt-4 text-[10px] uppercase tracking-[.14em] text-[#a9aaa2] sm:mt-0">
                {region} · {formatTodayDate()}
              </div>
            </div>

            {refreshing && data && (
              <div className="mt-3 flex items-center gap-2 mono text-[9px] uppercase tracking-[.16em] text-[#a9aaa2]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#d98970]" />
                Updating today’s briefing
              </div>
            )}

            <div className="mt-7 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">
              {(() => {
                const topicItems = [
                  { key: 'All', label: ui.topics[0] },
                  ...(region !== 'India' ? [{ key: region, label: region }] : []),
                  { key: 'India', label: ui.topics[2] },
                  { key: 'World', label: ui.topics[3] },
                  { key: 'Business', label: ui.topics[4] },
                  { key: 'Technology', label: ui.topics[5] },
                  { key: 'Health', label: ui.topics[6] },
                ];
                return topicItems.map((topic) => {
                  const isActive = activeTopic === topic.key;
                  return (
                    <button
                      key={topic.key}
                      type="button"
                      onClick={() => setActiveTopic(topic.key)}
                      className={`shrink-0 rounded-full border px-5 py-2.5 text-sm transition ${isActive ? 'border-[#d98970] bg-[#d98970] text-white shadow-[0_8px_20px_rgba(0,0,0,.20)]' : 'border-white/10 bg-[#17352c]/90 text-[#d8d0c4] shadow-[0_5px_18px_rgba(31,42,59,.05)] hover:-translate-y-0.5 hover:border-white/25'}`}
                    >
                      {topic.label}
                    </button>
                  );
                });
              })()}
            </div>

            {error ? (
              <div className="mt-8 rounded-[24px] border border-white/10 bg-[#17352c] p-8 shadow-sm">
                <p className="font-medium text-[#f5efe5]">{error}</p>
                <button onClick={loadHome} className="mt-5 rounded-full bg-[#10233e] px-5 py-3 text-sm text-white">{ui.retry}</button>
              </div>
            ) : loading && !data ? (
              <div className="mt-8 flex min-h-[340px] items-center justify-center rounded-[24px] border border-white/10 bg-[#17352c] p-8 text-[#c9c1b5] shadow-[0_10px_30px_rgba(31,42,59,.06)]">
                {ui.loading} {region}…
              </div>
            ) : activeTopic !== 'All' && !hasTopicResults ? (
              <div className="mt-8 rounded-[24px] border border-white/10 bg-[#17352c] p-8 sm:p-10">
                <p className="mono text-[9px] uppercase tracking-[.18em] text-[#d9a071]">{activeTopic}</p>
                <h2 className="serif mt-2 text-3xl text-[#f5efe5]">Nothing strong enough for today’s briefing.</h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-[#c9c1b5]">EIRA would rather show you fewer useful stories than fill this topic with weak or unrelated reporting.</p>
                <button type="button" onClick={() => setActiveTopic('All')} className="mt-5 rounded-full bg-[#d98970] px-5 py-3 text-sm font-medium text-white">See today’s briefing</button>
              </div>
            ) : hero ? (
              <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1.85fr)_minmax(300px,.72fr)]">
                <Link href={storyLink(hero, heroScope)} className="group relative overflow-hidden rounded-[24px] border border-white/10 bg-[#17352c] p-7 shadow-[0_24px_65px_rgba(0,0,0,.16)] transition hover:-translate-y-0.5 sm:p-9">
                  <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-[#d98970]/10 blur-3xl" />
                  <div className="relative">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#d98970] px-3 py-1 mono text-[9px] uppercase tracking-[.16em] text-white">{ui.startHere}</span>
                      <span className="mono text-[9px] uppercase tracking-[.14em] text-[#a9aaa2]">{hero.source} · {formatDate(hero.publishedAt)}</span>
                    </div>
                    <p className="mono mt-7 text-[9px] uppercase tracking-[.18em] text-[#d9a071]">{topicLabel(hero.topic || 'general')}</p>
                    <h2 className="serif mt-2 max-w-3xl text-[30px] leading-[1.06] tracking-[-.035em] text-[#f5efe5] sm:max-w-[92%] sm:text-[46px]">{hero.title}</h2>
                    {hero.description && (
                      <div className="mt-6 max-w-2xl border-l border-[#d98970]/50 pl-4">
                        <p className="mono text-[8px] uppercase tracking-[.18em] text-[#d9a071]">{ui.whatHappened}</p>
                        <p className="mt-2 text-[15px] leading-7 text-[#c9c1b5]">{hero.description}</p>
                      </div>
                    )}
                    <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-[#d98970]/40 px-4 py-2.5 text-sm font-medium text-[#f5efe5] transition group-hover:bg-[#d98970] group-hover:border-[#d98970]">{ui.understandArrow}<ArrowRight size={15} /></div>
                  </div>
                </Link>

                <div className="rounded-[24px] border border-white/8 bg-[#17352c] p-3 shadow-[0_10px_30px_rgba(31,42,59,.07)]">
                  {[...remainingRegional, ...indiaStories, ...worldStories].slice(0, 3).map((story) => (
                    <Link key={story.url || story.title} href={storyLink(story, storyScope(story))} className="group flex gap-3 border-b border-white/8 p-3 last:border-b-0">
                      <div className="flex h-[58px] w-[92px] shrink-0 items-center justify-center rounded-[12px] border border-[#d98970]/20 bg-[#102a23] p-2 text-center">
                        <span className="mono text-[7px] uppercase tracking-[.14em] text-[#d9a071]">{topicLabel(story.topic || 'general')}</span>
                      </div>
                      <div className="min-w-0 py-1">
                        <p className="mono text-[8px] uppercase tracking-[.14em] text-[#d9a071]">{story.source || ui.current}</p>
                        <h3 className="serif mt-1 line-clamp-2 text-[16px] leading-[1.08] text-[#f5efe5]">{story.title}</h3>
                        {story.description && <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-[#aeb8b1]">{story.description}</p>}
                        <p className="mono mt-2 text-[8px] uppercase tracking-wider text-[#a9aaa2]">{formatDate(story.publishedAt)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-8 rounded-[24px] border border-white/10 bg-[#17352c] p-8 text-[#c9c1b5] shadow-sm">{ui.noStories}</div>
            )}

            <div className="mt-10 flex items-center justify-between">
              <p className="mono text-[9px] uppercase tracking-[.18em] text-[#a9aaa2]">{ui.startWith}</p>
              <p className="mono text-[9px] uppercase tracking-[.14em] text-[#d9a071]">{formatFreshness(syncedAt)}</p>
            </div>
            </div>
          </div>
        </div>
      </section>

      {remainingRegional.length > 0 && (
        <section className="border-t border-white/8 bg-[#0d211b] px-5 py-12 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <SectionLabel>{region}</SectionLabel>
            <h2 className="serif mt-1 text-4xl tracking-[-.04em] text-[#f5efe5]">{ui.moreRegion}</h2>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {remainingRegional.map((story) => <StoryCard key={story.url || story.title} story={story} topic={region} ui={ui} />)}
            </div>
          </div>
        </section>
      )}

      {indiaStories.length > 0 && (
        <section className="border-t border-white/8 px-5 py-12 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <SectionLabel>India</SectionLabel>
            <h2 className="serif mt-1 text-4xl tracking-[-.04em] text-[#f5efe5]">{ui.national}</h2>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {indiaStories.map((story) => <StoryCard key={story.url || story.title} story={story} topic="India" ui={ui} />)}
            </div>
          </div>
        </section>
      )}

      {worldStories.length > 0 && (
        <section className="border-t border-white/8 px-5 py-12 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <SectionLabel>World</SectionLabel>
            <h2 className="serif mt-1 text-4xl tracking-[-.04em] text-[#f5efe5]">{ui.world}</h2>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {worldStories.map((story) => <StoryCard key={story.url || story.title} story={story} topic="World" ui={ui} />)}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </main>
  );




}