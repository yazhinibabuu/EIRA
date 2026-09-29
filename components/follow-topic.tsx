'use client';

import { Check, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

export const FOLLOWED_TOPICS_KEY = 'eira.followedTopics';

function readFollowedTopics(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(FOLLOWED_TOPICS_KEY) || '[]');
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function writeFollowedTopics(topics: string[]) {
  window.localStorage.setItem(FOLLOWED_TOPICS_KEY, JSON.stringify([...new Set(topics.map((topic) => topic.trim()).filter(Boolean))]));
  window.dispatchEvent(new Event('eira:followed-topics-changed'));
}

export function isTopicFollowed(topic: string) {
  return readFollowedTopics().some((item) => item.toLowerCase() === topic.trim().toLowerCase());
}

export function toggleFollowedTopic(topic: string) {
  const trimmed = topic.trim();
  if (!trimmed || typeof window === 'undefined') return;

  const current = readFollowedTopics();
  const index = current.findIndex((item) => item.toLowerCase() === trimmed.toLowerCase());

  if (index >= 0) current.splice(index, 1);
  else current.unshift(trimmed);

  writeFollowedTopics(current);
}

export default function FollowTopicButton({ topic }: { topic: string }) {
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    const sync = () => setFollowing(isTopicFollowed(topic));
    sync();
    window.addEventListener('storage', sync);
    window.addEventListener('eira:followed-topics-changed', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('eira:followed-topics-changed', sync);
    };
  }, [topic]);

  function handleClick() {
    toggleFollowedTopic(topic);
    setFollowing(isTopicFollowed(topic));
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={following}
      className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm transition ${
        following
          ? 'border-[#dfaa70]/60 bg-[#dfaa70]/10 text-[#f3d3a8]'
          : 'border-white/25 text-[#e8dfd3] hover:bg-white/10'
      }`}
    >
      {following ? <Check size={15} /> : <Plus size={15} />}
      {following ? 'Following' : 'Follow'}
    </button>
  );
}
