"use client";
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { gsapRegister, gsap } from '@/lib/gsap';
import { motion } from 'framer-motion';
import clsx from 'clsx';

const LINKS = [
  { href: '#home', label: 'Home' },
  { href: '#menu', label: 'Menu' },
  { href: '#reservations', label: 'Reservations' },
  { href: '#how-it-works', label: 'About' },
  { href: '#contact', label: 'Contact' }
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('#home');
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    gsapRegister();
  }, []);

  // Mobile overlay animation
  useEffect(() => {
    if (!overlayRef.current) return;
    const el = overlayRef.current;
    tlRef.current?.kill();
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(
      el,
      { yPercent: -100, opacity: 0 },
      { yPercent: 0, opacity: 1, duration: 0.5, ease: 'power3.out' }
    );
    tlRef.current = tl;
    if (open) tl.play();
    else tl.reverse(0);
  }, [open]);

  // Active link highlight via IntersectionObserver
  useEffect(() => {
    const sections = LINKS.map((l) => document.querySelector(l.href) as HTMLElement).filter(Boolean);
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive('#' + visible.target.id);
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    sections.forEach((s) => s && io.observe(s));
    return () => io.disconnect();
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur border-b border-black/5"
      aria-label="Primary"
    >
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between" role="navigation">
        <Link href="#home" className="flex items-center gap-2" aria-label="Dineezy home">
          <div className="w-10 h-10 bg-gray-900 dark:bg-white rounded-lg flex items-center justify-center">
            <span className="text-white dark:text-gray-900 font-bold text-lg">D</span>
          </div>
          <span className="font-semibold">Dineezy</span>
        </Link>

        <div className="hidden md:flex items-center gap-6" aria-label="Primary navigation links">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={clsx(
                'relative text-sm font-medium text-muted hover:text-text transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 rounded-lg px-1 py-1',
                active === l.href && 'text-text'
              )}
            >
              {l.label}
              <span
                className={clsx(
                  'absolute left-0 -bottom-1 h-[2px] w-full origin-left scale-x-0 bg-gradient-to-r from-[#87C6FE] to-[#BCAFFF] transition-transform',
                  active === l.href && 'scale-x-100'
                )}
                aria-hidden
              />
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <button
            className="relative rounded-full p-2 hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
            aria-label="Cart"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M6 6h14l-1.5 9h-11L5 3H2" stroke="#141414" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <span className="absolute -top-0.5 -right-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-black text-white">0</span>
          </button>
          <button
            className="rounded-full p-2 hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
            aria-label="Profile"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="8" r="3.5" stroke="#141414" strokeWidth="1.8" />
              <path d="M5 20c1.5-4 12.5-4 14 0" stroke="#141414" strokeWidth="1.8" />
            </svg>
          </button>
        </div>

        <button
          className="md:hidden inline-flex items-center justify-center p-2 rounded-lg hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M4 7h16M4 12h16M4 17h16" stroke="#141414" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </nav>

      {/* Mobile overlay */}
      <div
        ref={overlayRef}
        className={clsx('nav-overlay md:hidden pointer-events-auto', !open && 'pointer-events-none')}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
        hidden={!open}
      >
        <div className="flex items-center justify-between h-20 px-4">
          <Link href="#home" aria-label="Dineezy home" onClick={() => setOpen(false)} className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gray-900 dark:bg-white rounded-lg flex items-center justify-center">
              <span className="text-white dark:text-gray-900 font-bold text-lg">D</span>
            </div>
            <span className="font-semibold">Dineezy</span>
          </Link>
          <button
            className="inline-flex items-center justify-center p-2 rounded-lg hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" stroke="#141414" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <ul className="px-6 py-4 space-y-4 text-lg">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                onClick={() => setOpen(false)}
                className="block py-2 font-medium text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 rounded-lg"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </motion.header>
  );
}

