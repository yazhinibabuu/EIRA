'use client';

import { useEffect, useRef, useState } from 'react';

export type Language = 'en' | 'ta' | 'hi';

export const LANGUAGE_KEY = 'eira.language';

const languages: { value: Language; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'ta', label: 'தமிழ்' },
  { value: 'hi', label: 'हिन्दी' },
];

export function getStoredLanguage(): Language {
  if (typeof window === 'undefined') return 'en';
  const stored = window.localStorage.getItem(LANGUAGE_KEY);
  if (stored === 'ta' || stored === 'hi' || stored === 'en') return stored;
  return 'en';
}

export function LanguageSwitcher({ isHome = false }: { isHome?: boolean }) {
  const [language, setLanguage] = useState<Language>('en');
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLanguage(getStoredLanguage());
    function handleOutsideClick(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  function chooseLanguage(next: Language) {
    setLanguage(next);
    window.localStorage.setItem(LANGUAGE_KEY, next);
    document.cookie = `${LANGUAGE_KEY}=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
    window.dispatchEvent(new CustomEvent('eira:language-changed'));
    setOpen(false);
  }

  const current = languages.find((item) => item.value === language) || languages[0];

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`inline-flex h-9 items-center gap-2 rounded-full border px-3 text-xs transition ${
          isHome
            ? 'border-[#10233e]/15 bg-white/35 text-[#10233e] hover:bg-white/60'
            : 'border-white/20 bg-white/5 text-[#f1e8dc] hover:bg-white/10'
        }`}
      >
        <span>{current.label}</span>
        <span className={`text-[9px] transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-11 z-50 min-w-[130px] overflow-hidden rounded-2xl border border-[#10233e]/10 bg-[#fffaf4] p-1.5 shadow-[0_16px_45px_rgba(31,42,59,.18)]"
        >
          {languages.map((item) => (
            <button
              key={item.value}
              type="button"
              role="menuitem"
              onClick={() => chooseLanguage(item.value)}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs transition ${
                language === item.value
                  ? 'bg-[#efe3d6] !text-[#10233e]'
                  : '!text-[#40506a] hover:bg-[#f7efe7]'
              }`}
            >
              <span className={language === item.value ? 'text-[#10233e]' : 'text-[#40506a]'}>
                {item.label}
              </span>
              {language === item.value && <span className="text-[#ba7666]">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
