"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';

export function ReservationForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!(form as HTMLFormElement).checkValidity()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    setSubmitted(true);
    setLoading(false);
  }

  return (
    <section id="reservations" className="scroll-mt-16 py-16 sm:py-20 lg:py-24 relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/10 dark:from-primary/10 dark:via-background dark:to-secondary/20" />
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-semibold text-sm mb-6">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              Book Your Table
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Reservations
            </h2>
            <p className="text-lg text-muted-foreground max-w-prose leading-relaxed">
              Book a table for a special night out. We'll confirm your reservation instantly and ensure you have the perfect dining experience.
            </p>
            <div className="mt-8 flex flex-wrap gap-4 justify-center lg:justify-start">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Instant Confirmation
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Flexible Timing
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Special Requests
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-card/80 backdrop-blur-sm rounded-3xl p-8 sm:p-10 shadow-2xl border border-border"
          >
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center text-center space-y-6"
                role="status"
                aria-live="polite"
              >
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <motion.path
                      d="M4 12l5 5L20 6"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.8, ease: 'easeInOut' }}
                      className="text-primary"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-card-foreground mb-2">Reservation Confirmed!</h3>
                  <p className="text-muted-foreground">We look forward to hosting you for an amazing dining experience.</p>
                </div>
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-6 py-3 rounded-xl border-2 border-primary/20 text-foreground hover:border-primary/40 hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all duration-300 font-semibold"
                >
                  Make Another Reservation
                </button>
              </motion.div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-6" aria-label="Reservation form">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="date" className="block text-sm font-semibold text-card-foreground mb-2">
                      Date
                    </label>
                    <input 
                      id="date" 
                      name="date" 
                      type="date" 
                      required 
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300" 
                    />
                  </div>
                  <div>
                    <label htmlFor="time" className="block text-sm font-semibold text-card-foreground mb-2">
                      Time
                    </label>
                    <input 
                      id="time" 
                      name="time" 
                      type="time" 
                      required 
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300" 
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="guests" className="block text-sm font-semibold text-card-foreground mb-2">
                    Number of Guests
                  </label>
                  <select 
                    id="guests" 
                    name="guests" 
                    required 
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? 'Guest' : 'Guests'}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="requests" className="block text-sm font-semibold text-card-foreground mb-2">
                    Special Requests
                  </label>
                  <textarea 
                    id="requests" 
                    name="requests" 
                    rows={4} 
                    placeholder="Allergies, celebrations, seating preferences, dietary requirements..." 
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300 resize-none" 
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full group inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
                  aria-label="Submit reservation"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path d="M12 3a9 9 0 1 1-9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <span>Reserve Table</span>
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

