'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowUpRight,
  Bookmark,
  ChevronRight,
  CircleHelp,
  Menu,
  Search,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import type { Status as StatusType } from '@/data/content';
import { statusStyle } from '@/data/content';
import {
  getStoredLanguage,
  type Language,
} from '@/components/language-switcher';
import { LanguageSwitcher } from '@/components/language-switcher';

const labels: Record<Language, {
  home: string;
  explore: string;
  ask: string;
  library: string;
  catchUp: string;
  search: string;
  footer: string;
  demo: string;
  evidence: string;
  confirmed: string;
  developing: string;
  evidenceText: string;
  save: string;
  saved: string;
  story: string;
  toggle: string;
}> = {
  en: {
    home: 'Home', explore: 'Explore', ask: 'Ask', library: 'Library',
    catchUp: 'Catch me up', search: 'Search EIRA',
    footer: 'Made to make the world more understandable. Demo prototype.',
    demo: 'EIRA demo · illustrative content, sources & status',
    evidence: 'Evidence & status', confirmed: 'Confirmed', developing: 'Developing',
    evidenceText: 'Confirmed means the available reporting directly establishes the fact. Developing means the reporting supports a pattern that may still change.',
    save: 'Save story', saved: 'Saved', story: 'EIRA · STORY', toggle: 'Toggle navigation',
  },
  ta: {
    home: 'முகப்பு', explore: 'ஆராயுங்கள்', ask: 'கேளுங்கள்', library: 'நூலகம்',
    catchUp: 'விரைவாகத் தெரிந்துகொள்ளுங்கள்', search: 'EIRA-வைத் தேடுங்கள்',
    footer: 'உலகை மேலும் புரிந்துகொள்ளக்கூடியதாக மாற்ற உருவாக்கப்பட்டது. டெமோ முன்மாதிரி.',
    demo: 'EIRA டெமோ · எடுத்துக்காட்டு உள்ளடக்கம், ஆதாரங்கள் மற்றும் நிலை',
    evidence: 'ஆதாரமும் நிலையும்', confirmed: 'உறுதிப்படுத்தப்பட்டது', developing: 'வளர்ந்து வருகிறது',
    evidenceText: 'உறுதிப்படுத்தப்பட்டது என்பது கிடைத்த செய்திகளால் உண்மை நேரடியாக நிறுவப்பட்டுள்ளது என்பதாகும். வளர்ந்து வருகிறது என்பது செய்திகளால் ஒரு போக்கு ஆதரிக்கப்படுகிறது, ஆனால் அது இன்னும் மாறக்கூடும் என்பதாகும்.',
    save: 'செய்தியைச் சேமிக்கவும்', saved: 'சேமிக்கப்பட்டது', story: 'EIRA · செய்தி', toggle: 'வழிசெலுத்தலைத் திறக்கவும்',
  },
  hi: {
    home: 'होम', explore: 'एक्सप्लोर करें', ask: 'पूछें', library: 'लाइब्रेरी',
    catchUp: 'जल्दी से अपडेट हों', search: 'EIRA खोजें',
    footer: 'दुनिया को और समझने योग्य बनाने के लिए बनाया गया। डेमो प्रोटोटाइप।',
    demo: 'EIRA डेमो · उदाहरण सामग्री, स्रोत और स्थिति',
    evidence: 'साक्ष्य और स्थिति', confirmed: 'पुष्टि की गई', developing: 'विकसित हो रही',
    evidenceText: 'पुष्टि की गई का अर्थ है कि उपलब्ध रिपोर्टिंग तथ्य को सीधे स्थापित करती है। विकसित हो रही का अर्थ है कि रिपोर्टिंग किसी पैटर्न का समर्थन करती है, लेकिन वह अभी बदल सकता है।',
    save: 'स्टोरी सेव करें', saved: 'सेव किया गया', story: 'EIRA · खबर', toggle: 'नेविगेशन खोलें',
  },
};

export function Wordmark() {
  return (
    <Link href="/" className="serif text-3xl tracking-[-.08em]" aria-label="EIRA home">
      EIRA<span className="text-[#ca806d]">.</span>
    </Link>
  );
}

export function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  const isHome = path === '/';
  const ui = labels[language];

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

  const nav = [
    [ui.home, '/'],
    [ui.explore, '/explore'],
    [ui.ask, '/ask'],
    [ui.library, '/library'],
  ];

  const ink = isHome ? 'text-[#10233e]' : 'text-[#f6f0e8]';

  return (
    <header className={`absolute top-0 z-30 w-full px-5 py-5 sm:px-8 ${ink}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Wordmark />

        <nav className={`hidden items-center gap-8 text-sm md:flex ${isHome ? 'text-[#10233e]/75' : 'text-[#ede4d8]/80'}`} aria-label="Main navigation">
          {nav.map(([label, href]) => (
            <Link
              className={path === href ? ink : isHome ? 'hover:text-[#10233e]' : 'hover:text-white'}
              href={href}
              key={href}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher isHome={isHome} />
          <Link href="/catch-up" className={`rounded-full border px-4 py-2 text-xs font-medium ${isHome ? 'border-[#10233e]/20 hover:bg-[#10233e]/5' : 'border-white/30 hover:bg-white/10'}`}>
            {ui.catchUp}
          </Link>
          <Link href="/explore" aria-label={ui.search} className={`grid h-9 w-9 place-items-center rounded-full ${isHome ? 'border border-[#10233e]/20' : 'bg-[#f4ede2] text-[#20342b]'}`}>
            <Search size={17} />
          </Link>
        </div>

        <button className="grid h-11 w-11 place-items-center md:hidden" onClick={() => setOpen(!open)} aria-label={ui.toggle} aria-expanded={open}>
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <nav className={`mx-auto mt-4 flex max-w-md flex-col rounded-2xl p-3 ${isHome ? 'bg-[#f8f2eb] shadow-lg' : 'glass'}`} aria-label="Mobile navigation">
          {nav.map(([label, href]) => (
            <Link onClick={() => setOpen(false)} href={href} className="rounded-xl px-4 py-4" key={href}>
              {label}
            </Link>
          ))}
          <Link onClick={() => setOpen(false)} href="/catch-up" className="rounded-xl bg-[#f3eadc] px-4 py-4 text-[#20342b]">
            {ui.catchUp}
          </Link>
          <div className="px-4 py-3"><LanguageSwitcher isHome={isHome} /></div>
        </nav>
      )}
    </header>
  );
}

export function Status({ status }: { status: StatusType }) {
  const [language, setLanguage] = useState<Language>('en');
  useEffect(() => {
    const sync = () => setLanguage(getStoredLanguage());
    sync();
    window.addEventListener('eira:language-changed', sync);
    return () => window.removeEventListener('eira:language-changed', sync);
  }, []);
  const ui = labels[language];
  const statusLabel = status === 'Confirmed' ? ui.confirmed : status === 'Developing' ? ui.developing : status;
  return (
    <span className={`mono inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-wide ${statusStyle[status]}`}>
      <i className="h-1.5 w-1.5 rounded-full bg-current" />
      {statusLabel}
    </span>
  );
}

export function DemoNote() {
  const [language, setLanguage] = useState<Language>('en');
  useEffect(() => {
    const sync = () => setLanguage(getStoredLanguage());
    sync();
    window.addEventListener('eira:language-changed', sync);
    return () => window.removeEventListener('eira:language-changed', sync);
  }, []);
  return <p className="mono text-[10px] uppercase tracking-[.12em] text-[#c8bdac]">{labels[language].demo}</p>;
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="mono mb-3 text-[10px] uppercase tracking-[.18em] text-[#dca268]">{children}</p>;
}

export function ArrowLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="group inline-flex items-center gap-2 border-b border-[#e9bb85] pb-1 text-sm font-medium text-[#f8e3c4]">{children}<ArrowUpRight size={16} className="transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" /></Link>;
}

export function Footer() {
  const [language, setLanguage] = useState<Language>('en');
  useEffect(() => {
    const sync = () => setLanguage(getStoredLanguage());
    sync();
    window.addEventListener('eira:language-changed', sync);
    return () => window.removeEventListener('eira:language-changed', sync);
  }, []);
  return (
    <footer className="border-t edge px-6 py-8 text-xs text-[#b9b2a5]">
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 sm:flex-row">
        <Wordmark />
        <p>{labels[language].footer}</p>
      </div>
    </footer>
  );
}

export function EvidenceButton() {
  const [show, setShow] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  useEffect(() => {
    const sync = () => setLanguage(getStoredLanguage());
    sync();
    window.addEventListener('eira:language-changed', sync);
    return () => window.removeEventListener('eira:language-changed', sync);
  }, []);
  const ui = labels[language];
  return (
    <div className="relative">
      <button onClick={() => setShow(!show)} className="flex min-h-11 items-center gap-2 rounded-full border border-white/25 px-4 text-sm hover:bg-white/10" aria-expanded={show}>
        <CircleHelp size={16} />{ui.evidence}<ChevronRight size={15} />
      </button>
      {show && <div className="glass absolute z-20 mt-3 max-w-xs rounded-xl p-4 text-sm leading-6 text-[#ded5c8]">{ui.evidenceText}</div>}
    </div>
  );
}

export function SaveButton() {
  const [saved, setSaved] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  useEffect(() => {
    const sync = () => setLanguage(getStoredLanguage());
    sync();
    window.addEventListener('eira:language-changed', sync);
    return () => window.removeEventListener('eira:language-changed', sync);
  }, []);
  const ui = labels[language];
  return (
    <button onClick={() => setSaved(!saved)} className="flex min-h-11 items-center gap-2 rounded-full border border-white/25 px-4 text-sm hover:bg-white/10" aria-pressed={saved}>
      <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />
      {saved ? ui.saved : ui.save}
    </button>
  );
}
