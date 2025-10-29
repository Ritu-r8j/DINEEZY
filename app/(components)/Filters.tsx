"use client";
import clsx from 'clsx';
import { CATEGORIES, MenuCategory } from '@/lib/menuData';

type Props = {
  active: MenuCategory;
  onChange: (category: MenuCategory) => void;
};

export function Filters({ active, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Menu categories">
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          role="tab"
          aria-selected={active === cat}
          onClick={() => onChange(cat)}
          className={clsx(
            'relative px-3 py-1.5 rounded-full text-sm font-medium border border-black/10 hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20',
            active === cat && 'bg-black text-white border-transparent'
          )}
        >
          {cat}
          <span
            className={clsx(
              'absolute left-2 -bottom-[2px] h-[2px] w-[calc(100%-1rem)] origin-left scale-x-0 bg-gradient-to-r from-[#87C6FE] to-[#BCAFFF] transition-transform',
              active === cat && 'scale-x-100'
            )}
            aria-hidden
          />
        </button>
      ))}
    </div>
  );
}

