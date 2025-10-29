"use client";
import Image from 'next/image';
import { motion } from 'framer-motion';
import { fadeInUp, stagger } from '@/lib/motion';
import { useEffect, useRef } from 'react';
import { gsapRegister, gsap, ScrollTrigger } from '@/lib/gsap';
import Link from 'next/link';
import { Magnetic } from './Magnetic';

export function Hero() {
  const garnishRef = useRef<HTMLDivElement | null>(null);
  const plateRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    gsapRegister();
    if (!garnishRef.current) return;
    const ctx = gsap.context(() => {
      const reduces = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduces) return;
      const chips = gsap.utils.toArray<HTMLElement>('.garnish-chip');
      chips.forEach((chip, i) => {
        gsap.fromTo(
          chip,
          { y: gsap.utils.random(-10, 10), x: gsap.utils.random(-6, 6), rotate: gsap.utils.random(-4, 4) },
          {
            y: `+=${gsap.utils.random(12, 22)}`,
            x: `+=${gsap.utils.random(-10, 10)}`,
            rotate: gsap.utils.random(-8, 8),
            duration: gsap.utils.random(2, 4),
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut'
          }
        );
      });
      if (plateRef.current) {
        gsap.to(plateRef.current, {
          yPercent: -8,
          ease: 'none',
          scrollTrigger: { trigger: plateRef.current, start: 'top bottom', scrub: 0.6 }
        });
      }
    }, garnishRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="home" className="relative pt-8 sm:pt-12 lg:pt-20 min-h-screen flex items-center">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20 dark:from-background dark:via-background dark:to-muted/10" />
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div 
            variants={stagger} 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true }} 
            className="space-y-8 text-center lg:text-left"
          >
            <motion.h1 
              variants={fadeInUp} 
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent"
            >
              Delicious food, delivered fresh.
            </motion.h1>
            <motion.p 
              variants={fadeInUp} 
              className="text-lg sm:text-xl text-muted-foreground max-w-prose mx-auto lg:mx-0 leading-relaxed"
            >
              Premium ingredients, cooked to perfection and served with love. Dine in or order for a delightful experience at home.
            </motion.p>
            <motion.div 
              variants={fadeInUp} 
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Magnetic>
                <Link
                  href="/user/menu"
                  className="group px-8 py-4 rounded-2xl bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 will-change-transform inline-flex items-center justify-center gap-2 font-semibold"
                  aria-label="Order now"
                >
                  <span>Order Now</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </Magnetic>
              <Magnetic>
                <Link
                  href="#reservations"
                  className="group px-8 py-4 rounded-2xl border-2 border-primary/20 text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 will-change-transform inline-flex items-center justify-center gap-2 font-semibold"
                  aria-label="Reserve a table"
                >
                  <span>Reserve Table</span>
                  <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </Link>
              </Magnetic>
            </motion.div>
          </motion.div>

          <div ref={garnishRef} className="relative flex justify-center lg:justify-end">
            <div className="relative">
              <div ref={plateRef} className="relative mx-auto size-[280px] sm:size-[350px] lg:size-[420px] xl:size-[480px] rounded-full overflow-hidden shadow-2xl ring-4 ring-primary/10 dark:ring-primary/20">
                <Image
                  src="https://images.unsplash.com/photo-1543353071-10c8ba85a904?q=80&w=1400&auto=format&fit=crop"
                  alt="Hero dish on a plate"
                  fill
                  sizes="(max-width: 640px) 280px, (max-width: 1024px) 350px, (max-width: 1280px) 420px, 480px"
                  className="object-cover"
                  priority
                />
              </div>
              {/* floating garnish chips */}
              <div className="pointer-events-none absolute inset-0" aria-hidden>
                <span className="garnish-chip absolute -top-2 left-6 size-6 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 blur-[1px] opacity-80" />
                <span className="garnish-chip absolute top-8 -left-2 size-3 rounded-full bg-purple-300 dark:bg-purple-400 opacity-90" />
                <span className="garnish-chip absolute bottom-6 -right-2 size-4 rounded-full bg-blue-300 dark:bg-blue-400" />
                <span className="garnish-chip absolute -bottom-2 right-14 size-5 rounded-full bg-gradient-to-r from-blue-400 to-purple-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
