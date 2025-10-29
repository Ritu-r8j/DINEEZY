import { Suspense } from 'react';
import { SignatureStrip } from '../(components)/SignatureStrip';
import { ReservationForm } from '../(components)/ReservationForm';
import { HowItWorks } from '../(components)/HowItWorks';
import { Testimonials } from '../(components)/Testimonials';
import { CTABanner } from '../(components)/CTABanner';
import { Footer } from '../(components)/Footer';
import { Hero } from '../(components)/Hero';
import { RestaurantListing } from '../(components)/RestaurantListing';

// Loading component for better UX
function SectionLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}

export default function Page() {
  return (
    <main className="overflow-hidden">
      {/* Hero Section - Compact */}
      <section className="relative min-h-[85vh] sm:min-h-[90vh] lg:min-h-screen">
        <Hero />
      </section>

      {/* Main Content - Optimized Spacing */}
      <div className="space-y-6 sm:space-y-10 lg:space-y-14">
        {/* Restaurant Listing - Reduced Padding */}
        <section className="scroll-mt-16 py-12 sm:py-16 lg:py-20">
          <Suspense fallback={<SectionLoader />}>
            <RestaurantListing />
          </Suspense>
        </section>

        {/* Signature Dish - Compact */}
        <section className="relative py-10 sm:py-14 lg:py-18">
          <Suspense fallback={<SectionLoader />}>
            <SignatureStrip />
          </Suspense>
        </section>

        {/* How It Works & Reservation - Side by Side on Desktop */}
        <section className="relative py-8 sm:py-12 lg:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 lg:gap-12 items-start">
              {/* How It Works */}
              <div className="order-2 xl:order-1">
                <div className="py-4 sm:py-6 lg:py-8">
                  <Suspense fallback={<SectionLoader />}>
                    <HowItWorks />
                  </Suspense>
                </div>
              </div>
              
              {/* Reservation Form - Sticky on Desktop */}
              <div className="order-1 xl:order-2 xl:sticky xl:top-8">
                <div className="py-4 sm:py-6 lg:py-8 bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 shadow-lg">
                  <Suspense fallback={<SectionLoader />}>
                    <ReservationForm />
                  </Suspense>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials - Compact with Background */}
        <section className="relative bg-muted/20 dark:bg-muted/5 backdrop-blur-sm">
          <div className="py-10 sm:py-14 lg:py-18">
            <Suspense fallback={<SectionLoader />}>
              <Testimonials />
            </Suspense>
          </div>
        </section>

        {/* CTA Banner - Compact */}
        <section className="relative">
          <div className="py-6 sm:py-10 lg:py-14">
            <Suspense fallback={<SectionLoader />}>
              <CTABanner />
            </Suspense>
          </div>
        </section>
      </div>

      {/* Footer - Reduced Top Spacing */}
      <div className="mt-8 sm:mt-12 lg:mt-16">
        <Footer />
      </div>
    </main>
  );
}

