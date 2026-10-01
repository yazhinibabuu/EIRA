'use client';

import Link from 'next/link';
import { Bookmark, Check, Plus, X } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { Nav, SectionLabel, Footer } from '@/components/eira';
import { getStoredLanguage, type Language } from '@/components/language-switcher';
import { FOLLOWED_TOPICS_KEY, toggleFollowedTopic } from '@/components/follow-topic';

function readFollowedTopics(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(FOLLOWED_TOPICS_KEY) || '[]');
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

const copy = {
  en: { label: 'Your library', title1: 'Keep what you’re', title2: 'following.', desc: 'A quiet place for the stories and subjects you want to return to.', following: 'Following', close: 'Close', followTopic: 'Follow a topic', placeholder: 'Try K-pop, AI, semiconductors…', topicLabel: 'Topic to follow', follow: 'Follow', unfollow: 'Unfollow', emptyTitle: 'You’re not following anything yet.', emptyDesc: 'Follow a topic you care about and it will stay here for easy access.', saved: 'Saved stories', nothing: 'Nothing saved yet.', nothingDesc: 'Save a story when you want to come back to that specific explanation later.' },
  ta: { label: 'உங்கள் நூலகம்', title1: 'நீங்கள்', title2: 'பின்தொடர்பவற்றை வைத்திருங்கள்.', desc: 'மீண்டும் பார்க்க விரும்பும் செய்திகள் மற்றும் தலைப்புகளுக்கான அமைதியான இடம்.', following: 'பின்தொடர்பவை', close: 'மூடுக', followTopic: 'ஒரு தலைப்பைப் பின்தொடருங்கள்', placeholder: 'K-pop, AI, semiconductor… முயற்சிக்கவும்', topicLabel: 'பின்தொடர வேண்டிய தலைப்பு', follow: 'பின்தொடருங்கள்', unfollow: 'பின்தொடர்வை நிறுத்துங்கள்', emptyTitle: 'நீங்கள் இன்னும் எதையும் பின்தொடரவில்லை.', emptyDesc: 'உங்களுக்கு முக்கியமான ஒரு தலைப்பைப் பின்தொடருங்கள்; எளிதாக அணுக அது இங்கே இருக்கும்.', saved: 'சேமித்த செய்திகள்', nothing: 'இன்னும் எதுவும் சேமிக்கப்படவில்லை.', nothingDesc: 'ஒரு குறிப்பிட்ட விளக்கத்தை பின்னர் பார்க்க விரும்பும்போது அந்த செய்தியைச் சேமிக்கவும்.' },
  hi: { label: 'आपकी लाइब्रेरी', title1: 'जो आप', title2: 'फ़ॉलो कर रहे हैं उसे रखें।', desc: 'उन खबरों और विषयों के लिए एक शांत जगह, जिन्हें आप फिर से देखना चाहते हैं।', following: 'फ़ॉलो किए गए', close: 'बंद करें', followTopic: 'कोई विषय फ़ॉलो करें', placeholder: 'K-pop, AI, semiconductor… आज़माएँ', topicLabel: 'फ़ॉलो करने वाला विषय', follow: 'फ़ॉलो करें', unfollow: 'अनफ़ॉलो करें', emptyTitle: 'आप अभी कुछ भी फ़ॉलो नहीं कर रहे हैं।', emptyDesc: 'जिस विषय की परवाह है उसे फ़ॉलो करें और वह आसान पहुँच के लिए यहाँ रहेगा।', saved: 'सहेजी गई खबरें', nothing: 'अभी कुछ भी सहेजा नहीं गया है।', nothingDesc: 'किसी खास व्याख्या पर बाद में लौटना हो तो उस खबर को सेव करें।' },
} as const;

export default function Library() {
  const [topics, setTopics] = useState<string[]>([]);
  const [showFollowForm, setShowFollowForm] = useState(false);
  const [newTopic, setNewTopic] = useState('');
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
    const sync = () => setTopics(readFollowedTopics());
    sync();
    window.addEventListener('storage', sync);
    window.addEventListener('eira:followed-topics-changed', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('eira:followed-topics-changed', sync);
    };
  }, []);

  function addTopic(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = newTopic.trim();
    if (!trimmed) return;
    toggleFollowedTopic(trimmed);
    setNewTopic('');
    setShowFollowForm(false);
    setTopics(readFollowedTopics());
  }

  function removeTopic(topic: string) {
    const current = readFollowedTopics().filter(
      (item) => item.toLowerCase() !== topic.toLowerCase()
    );
    window.localStorage.setItem(FOLLOWED_TOPICS_KEY, JSON.stringify(current));
    window.dispatchEvent(new Event('eira:followed-topics-changed'));
    setTopics(current);
  }

  return (
    <main className="page">
      <Nav />
      <div className="mx-auto max-w-5xl px-6 pb-20 pt-36 sm:px-10">
        <SectionLabel>{ui.label}</SectionLabel>
        <h1 className="serif text-5xl tracking-[-.05em] sm:text-7xl">
          {ui.title1} <i>{ui.title2}</i>
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-[#d4ccc0]">
          {ui.desc}
        </p>

        <section className="mt-16">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="serif text-3xl">{ui.following}</h2>
            <button
              type="button"
              onClick={() => setShowFollowForm((value) => !value)}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border edge px-4 text-sm transition hover:bg-white/10"
            >
              {showFollowForm ? <X size={16} /> : <Plus size={16} />}
              {showFollowForm ? ui.close : ui.followTopic}
            </button>
          </div>

          {showFollowForm && (
            <form onSubmit={addTopic} className="mt-5 flex flex-col gap-3 rounded-2xl border edge bg-[#20352b] p-4 sm:flex-row">
              <input
                autoFocus
                value={newTopic}
                onChange={(event) => setNewTopic(event.target.value)}
                placeholder={ui.placeholder}
                aria-label={ui.topicLabel}
                className="min-h-11 flex-1 rounded-xl bg-[#182d24] px-4 outline-none placeholder:text-[#8f988f]"
              />
              <button
                type="submit"
                disabled={!newTopic.trim()}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#f3eadc] px-5 text-sm font-medium text-[#20342b] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Check size={16} />
                {ui.follow}
              </button>
            </form>
          )}

          {topics.length > 0 ? (
            <div className="mt-6 flex flex-wrap gap-3">
              {topics.map((topic) => (
                <div key={topic} className="inline-flex items-center gap-1 rounded-full border edge bg-[#20352b] pl-5 pr-2">
                  <Link href={`/catch-up?topic=${encodeURIComponent(topic)}`} className="py-3 text-sm hover:text-[#f3d3a8]">
                    {topic}
                  </Link>
                  <button
                    type="button"
                    onClick={() => removeTopic(topic)}
                    aria-label={`${ui.unfollow} ${topic}`}
                    className="grid h-8 w-8 place-items-center rounded-full text-[#aaa195] hover:bg-white/10 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border edge bg-[#20352b] px-6 py-12 text-center">
              <Bookmark size={28} className="mx-auto text-[#f1d5ae]" />
              <h3 className="serif mt-5 text-2xl">{ui.emptyTitle}</h3>
              <p className="mx-auto mt-3 max-w-md leading-7 text-[#cbc3b7]">
                {ui.emptyDesc}
              </p>
            </div>
          )}
        </section>

        <section className="mt-16">
          <h2 className="serif text-3xl">{ui.saved}</h2>
          <div className="mt-6 rounded-2xl border edge bg-[#20352b] px-6 py-12 text-center">
            <Bookmark size={24} className="mx-auto text-[#f1d5ae]" />
            <h3 className="serif mt-4 text-2xl">{ui.nothing}</h3>
            <p className="mx-auto mt-3 max-w-md leading-7 text-[#cbc3b7]">
              {ui.nothingDesc}
            </p>
          </div>
        </section>
      </div>
      <Footer />
    </main>
  );
}
