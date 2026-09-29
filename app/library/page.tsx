'use client';

import Link from 'next/link';
import { Bookmark, Check, Plus, X } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { Nav, SectionLabel, Footer } from '@/components/eira';
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

export default function Library() {
  const [topics, setTopics] = useState<string[]>([]);
  const [showFollowForm, setShowFollowForm] = useState(false);
  const [newTopic, setNewTopic] = useState('');

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
        <SectionLabel>Your library</SectionLabel>
        <h1 className="serif text-5xl tracking-[-.05em] sm:text-7xl">
          Keep what you&apos;re <i>following.</i>
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-[#d4ccc0]">
          A quiet place for the stories and subjects you want to return to.
        </p>

        <section className="mt-16">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="serif text-3xl">Following</h2>
            <button
              type="button"
              onClick={() => setShowFollowForm((value) => !value)}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border edge px-4 text-sm transition hover:bg-white/10"
            >
              {showFollowForm ? <X size={16} /> : <Plus size={16} />}
              {showFollowForm ? 'Close' : 'Follow a topic'}
            </button>
          </div>

          {showFollowForm && (
            <form onSubmit={addTopic} className="mt-5 flex flex-col gap-3 rounded-2xl border edge bg-[#20352b] p-4 sm:flex-row">
              <input
                autoFocus
                value={newTopic}
                onChange={(event) => setNewTopic(event.target.value)}
                placeholder="Try K-pop, AI, semiconductors…"
                aria-label="Topic to follow"
                className="min-h-11 flex-1 rounded-xl bg-[#182d24] px-4 outline-none placeholder:text-[#8f988f]"
              />
              <button
                type="submit"
                disabled={!newTopic.trim()}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#f3eadc] px-5 text-sm font-medium text-[#20342b] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Check size={16} />
                Follow
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
                    aria-label={`Unfollow ${topic}`}
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
              <h3 className="serif mt-5 text-2xl">You&apos;re not following anything yet.</h3>
              <p className="mx-auto mt-3 max-w-md leading-7 text-[#cbc3b7]">
                Follow a topic you care about and it will stay here for easy access.
              </p>
            </div>
          )}
        </section>

        <section className="mt-16">
          <h2 className="serif text-3xl">Saved stories</h2>
          <div className="mt-6 rounded-2xl border edge bg-[#20352b] px-6 py-12 text-center">
            <Bookmark size={24} className="mx-auto text-[#f1d5ae]" />
            <h3 className="serif mt-4 text-2xl">Nothing saved yet.</h3>
            <p className="mx-auto mt-3 max-w-md leading-7 text-[#cbc3b7]">
              Save a story when you want to come back to that specific explanation later.
            </p>
          </div>
        </section>
      </div>
      <Footer />
    </main>
  );
}
