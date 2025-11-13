"use client";
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { TESTIMONIALS } from '@/lib/testimonialsData';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';
import GradientStar from '@/components/ui/GradientStar';

export function Testimonials() {
  const reduced = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (reduced) return; // respect reduced motion
    if (paused) return;
    intervalRef.current && window.clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(() => {
      setIndex((i) => (i + 1) % TESTIMONIALS.length);
    }, 4000);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [paused, reduced]);

  return (
    <section className="py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-semibold text-sm mb-6"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L3 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
            Customer Reviews
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent"
          >
            What People Say
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            Don't just take our word for it. Here's what our satisfied customers have to say about their dining experience.
          </motion.p>
        </div>

        <div className="relative">
          <div
            className="relative rounded-3xl border border-border bg-card/80 backdrop-blur-sm p-8 sm:p-12 shadow-2xl overflow-hidden"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <div className="relative min-h-[400px] sm:min-h-[450px]">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={TESTIMONIALS[index].id}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="absolute inset-0 grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 items-center"
                  drag="x"
                  dragElastic={0.2}
                  dragMomentum={!reduced}
                  onDragEnd={(_, info) => {
                    if (info.offset.x < -60) setIndex((i) => (i + 1) % TESTIMONIALS.length);
                    if (info.offset.x > 60) setIndex((i) => (i - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
                  }}
                >
                  {/* Customer Info */}
                  <div className="flex flex-col items-center lg:items-start gap-6">
                    <div className="relative size-24 rounded-full overflow-hidden ring-4 ring-primary/20 shadow-lg">
                      <Image 
                        src={TESTIMONIALS[index].avatar} 
                        alt={TESTIMONIALS[index].name} 
                        fill 
                        className="object-cover" 
                      />
                    </div>
                    <div className="text-center lg:text-left">
                      <h3 className="text-xl font-bold text-card-foreground mb-1">
                        {TESTIMONIALS[index].name}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-3">
                        {TESTIMONIALS[index].role}
                      </p>
                      <div className="flex justify-center lg:justify-start gap-1" aria-label={`${TESTIMONIALS[index].rating} out of 5 stars`}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <GradientStar
                            key={i}
                            size={20}
                            className={i < TESTIMONIALS[index].rating ? 'opacity-100' : 'opacity-30'}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Quote */}
                  <div className="flex flex-col justify-center">
                    <div className="relative">
                      <svg 
                        className="absolute -top-4 -left-4 w-12 h-12 text-primary/20" 
                        fill="currentColor" 
                        viewBox="0 0 24 24"
                        aria-hidden
                      >
                        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
                      </svg>
                      <blockquote className="text-xl sm:text-2xl leading-relaxed text-card-foreground font-medium italic pl-8">
                        "{TESTIMONIALS[index].quote}"
                      </blockquote>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
            
            {/* Navigation */}
            <div className="flex items-center justify-between mt-8">
              <div className="flex gap-2">
                {TESTIMONIALS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIndex(i)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      i === index ? 'bg-primary scale-125' : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                    }`}
                    aria-label={`Go to testimonial ${i + 1}`}
                  />
                ))}
              </div>
              
              <div className="flex gap-3">
                <button
                  className="group p-3 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all duration-300"
                  onClick={() => setIndex((i) => (i - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)}
                  aria-label="Previous testimonial"
                >
                  <svg className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  className="group p-3 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all duration-300"
                  onClick={() => setIndex((i) => (i + 1) % TESTIMONIALS.length)}
                  aria-label="Next testimonial"
                >
                  <svg className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
