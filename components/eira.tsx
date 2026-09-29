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
import { useState } from 'react';
import type { Status } from '@/data/content';
import { statusStyle } from '@/data/content';

const nav = [
  ['Home', '/'],
  ['Explore', '/explore'],
  ['Ask', '/ask'],
  ['Library', '/library'],
];

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
  const isHome = path === '/';
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

        <div className="hidden items-center gap-4 md:flex">
          <Link
            href="/catch-up"
            className={`rounded-full border px-4 py-2 text-xs font-medium ${
              isHome ? 'border-[#10233e]/20 hover:bg-[#10233e]/5' : 'border-white/30 hover:bg-white/10'
            }`}
          >
            Catch me up
          </Link>
          <Link
            href="/explore"
            aria-label="Search EIRA"
            className={`grid h-9 w-9 place-items-center rounded-full ${
              isHome ? 'border border-[#10233e]/20' : 'bg-[#f4ede2] text-[#20342b]'
            }`}
          >
            <Search size={17} />
          </Link>
        </div>

        <button
          className="grid h-11 w-11 place-items-center md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle navigation"
          aria-expanded={open}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <nav
          className={`mx-auto mt-4 flex max-w-md flex-col rounded-2xl p-3 ${
            isHome ? 'bg-[#f8f2eb] shadow-lg' : 'glass'
          }`}
          aria-label="Mobile navigation"
        >
          {nav.map(([label, href]) => (
            <Link
              onClick={() => setOpen(false)}
              href={href}
              className="rounded-xl px-4 py-4"
              key={href}
            >
              {label}
            </Link>
          ))}
          <Link href="/catch-up" className="rounded-xl bg-[#f3eadc] px-4 py-4 text-[#20342b]">
            Catch me up
          </Link>
        </nav>
      )}
    </header>
  );
}

export function Status({ status }: { status: Status }) {
  return (
    <span className={`mono inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-wide ${statusStyle[status]}`}>
      <i className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

export function DemoNote() {
  return null;
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="mono mb-3 text-[10px] uppercase tracking-[.18em] text-[#dca268]">{children}</p>;
}

export function ArrowLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-2 border-b border-[#e9bb85] pb-1 text-sm font-medium text-[#f8e3c4]">
      {children}
      <ArrowUpRight size={16} className="transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
    </Link>
  );
}

export function Footer() {
  return (
    <footer className="border-t edge px-6 py-8 text-xs text-[#b9b2a5]">
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 sm:flex-row">
        <Wordmark />
        <p>Made to make the world more understandable.</p>
      </div>
    </footer>
  );
}

export function EvidenceButton() {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShow(!show)}
        className="flex min-h-11 items-center gap-2 rounded-full border border-white/25 px-4 text-sm hover:bg-white/10"
        aria-expanded={show}
      >
        <CircleHelp size={16} />
        Evidence &amp; status
        <ChevronRight size={15} />
      </button>
      {show && (
        <div className="glass absolute z-20 mt-3 max-w-xs rounded-xl p-4 text-sm leading-6 text-[#ded5c8]">
          <b>Confirmed</b> means the available reporting directly establishes the fact. <b>Developing</b> means the reporting supports a pattern that may still change.
        </div>
      )}
    </div>
  );
}

export function SaveButton() {
  const [saved, setSaved] = useState(false);

  return (
    <button
      onClick={() => setSaved(!saved)}
      className="flex min-h-11 items-center gap-2 rounded-full border border-white/25 px-4 text-sm hover:bg-white/10"
      aria-pressed={saved}
    >
      <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />
      {saved ? 'Saved' : 'Save story'}
    </button>
  );
}
