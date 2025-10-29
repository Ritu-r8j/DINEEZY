"use client";
import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { gsapRegister, gsap } from '@/lib/gsap';

export function SignatureStrip() {
  const imgRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    gsapRegister();
    if (!imgRef.current) return;
    const reduces = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduces) return;
    const ctx = gsap.context(() => {
      gsap.set(imgRef.current, { transformPerspective: 800, transformStyle: 'preserve-3d' });
      gsap.to(imgRef.current, {
        rotateY: 8,
        rotateX: -6,
        yPercent: -5,
        scrollTrigger: { trigger: imgRef.current, start: 'top bottom', scrub: 0.6 }
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <section className="relative py-16 sm:py-20 lg:py-24">
      {/* Background with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/10 dark:from-primary/10 dark:via-background dark:to-secondary/20" />
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="rounded-3xl bg-card/80 backdrop-blur-sm border border-border shadow-2xl p-8 sm:p-12 lg:p-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-6 text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-semibold text-sm mb-4">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" clipRule="evenodd" />
              </svg>
              Chef's Special
            </div>
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Signature Dish
            </h3>
            <p className="text-lg text-muted-foreground max-w-prose leading-relaxed">
              Our chef's masterpiece blends seasonal ingredients with time-honored techniques for a dish you won't forget. 
              Each bite tells a story of culinary excellence and passion.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <a
                href="#menu"
                className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
                aria-label="Try our signature dish"
              >
                <span>Try Now</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
              <a
                href="#reservations"
                className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl border-2 border-primary/20 text-foreground hover:border-primary/40 hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all duration-300 font-semibold"
                aria-label="Reserve a table"
              >
                <span>Reserve Table</span>
                <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </a>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative flex justify-center lg:justify-end"
          >
            <div ref={imgRef} className="relative h-80 sm:h-96 lg:h-[500px] w-full max-w-md rounded-3xl overflow-hidden shadow-2xl ring-4 ring-primary/10 dark:ring-primary/20">
              <Image
                src="https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1600&auto=format&fit=crop"
                alt="Signature dish"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

