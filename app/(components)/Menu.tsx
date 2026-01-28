"use client";
import Image from 'next/image';
import { useMemo, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { MENU, MenuItem, MenuCategory } from '@/lib/menuData';
import { Filters } from './Filters';
import { cardVariants, fadeIn, stagger } from '@/lib/motion';
import clsx from 'clsx';

export function Menu() {
  const [active, setActive] = useState<MenuCategory>('All');
  const items = useMemo(() => (active === 'All' ? MENU : MENU.filter((i) => i.category === active)), [active]);

  return (
    <section id="menu" className="scroll-mt-16 py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent"
          >
            Featured Menu
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            Discover our carefully curated selection of dishes, crafted with the finest ingredients and culinary expertise.
          </motion.p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
          <Filters active={active} onChange={setActive} />
        </div>

        <LayoutGroup>
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence mode="popLayout">
                {items.map((item) => (
                  <Card key={item.id} item={item} />)
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </LayoutGroup>
      </div>
    </section>
  );
}

function Card({ item }: { item: MenuItem }) {
  return (
    <motion.article
      layout
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      whileHover="hover"
      viewport={{ once: true }}
      className={clsx(
        'group rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 bg-card border border-border overflow-hidden focus-within:ring-2 focus-within:ring-primary/50 hover:scale-105'
      )}
    >
      <div className="relative h-48 sm:h-52 overflow-hidden">
        {item.video ? (
          <video
            src={item.video}
            poster={item.image}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={(e) => {
              const target = e.target as HTMLVideoElement;
              // Fallback to image if video fails
              const img = document.createElement('img');
              img.src = item.image;
              img.alt = item.title;
              img.className = "w-full h-full object-cover group-hover:scale-110 transition-transform duration-500";
              target.parentNode?.replaceChild(img, target);
            }}
          />
        ) : (
          <Image 
            src={item.image} 
            alt={item.title} 
            fill 
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw" 
            className="object-cover group-hover:scale-110 transition-transform duration-500" 
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {/* Video Badge */}
        {item.video && (
          <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            Video
          </div>
        )}
        <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
          ₹{item.price.toFixed(2)}
        </div>
      </div>
      <div className="p-6 space-y-3">
        <h3 className="text-xl font-bold text-card-foreground group-hover:text-primary transition-colors duration-300">
          {item.title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
          {item.description}
        </p>
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
            {item.nutrition}
          </span>
        </div>
        <div className="pt-3">
          <button
            className="w-full group/btn inline-flex justify-center items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
            aria-label={`Add ${item.title} to cart`}
          >
            <svg className="w-5 h-5 group-hover/btn:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add to Cart
          </button>
        </div>
      </div>
    </motion.article>
  );
}

