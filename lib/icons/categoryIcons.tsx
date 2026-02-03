import { Utensils, Beef, GlassWater, Cake, Pizza, Hamburger, Leaf, Fish, Egg, Cookie, Package, Flame, Apple } from 'lucide-react';

// Category Icons - Monochromatic
export const AppetizersIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <Utensils className={className} />
);

export const MainCourseIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <Beef className={className} />
);

export const BeveragesIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <GlassWater className={className} />
);

export const DessertsIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <Cake className={className} />
);

export const PizzaIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <Pizza className={className} />
);

export const BurgersIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <Hamburger className={className} />
);

export const SaladsIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <Leaf className={className} />
);

// Custom SVG for Pasta (Bowl with pasta)
export const PastaIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M4 8c0 0 0-4 8-4s8 4 8 4" />
    <path d="M5 8v9c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4V8" />
    <path d="M4 12h16" />
    <path d="M4 8c4-1 8-1 12 0" />
  </svg>
);

// Custom SVG for Rice & Biryani (Bowl)
export const RiceBiryaniIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M4 8c0 0 0-4 8-4s8 4 8 4" />
    <path d="M5 8v9c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4V8" />
    <path d="M4 10c4 0 8 0 12 0" />
  </svg>
);

// Custom SVG for Breads (Roti/Bread slice)
export const BreadsIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <ellipse cx="12" cy="12" rx="10" ry="6" />
    <path d="M4 12c0 0 2-2 8-2s8 2 8 2" />
    <path d="M4 12c0 0 2 2 8 2s8-2 8-2" />
  </svg>
);

// Custom SVG for Chinese (Chopsticks)
export const ChineseIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <line x1="10" y1="4" x2="8" y2="20" />
    <line x1="16" y1="4" x2="14" y2="20" />
  </svg>
);

export const SeafoodIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <Fish className={className} />
);

export const BreakfastIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <Egg className={className} />
);

export const SnacksIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <Cookie className={className} />
);

export const CombosIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <Package className={className} />
);

// Default Category Icon (Utensils/Dining)
export const DefaultCategoryIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <Utensils className={className} />
);

// Spice Level Icons
export const SpiceLevelIcon = ({ level = 1 }: { level?: number }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: level }).map((_, i) => (
      <Flame key={i} className="h-3 w-3 text-gray-900 dark:text-white" />
    ))}
  </div>
);

// Dietary Icons
export const VegetarianIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <Leaf className={className} />
);

export const VeganIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M7 20h10" />
    <path d="M10 20c5.5-2.5.8-6.4 3-10" />
    <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z" />
    <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z" />
  </svg>
);

export const GlutenFreeIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M3 3h18v18H3z" />
    <path d="m9 9 6 6" />
    <path d="m15 9-6 6" />
  </svg>
);

// Nutrition Icon
export const NutritionIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <Apple className={className} />
);

// Export all category icons as a map
export const CategoryIcons: Record<string, React.FC<{ className?: string }>> = {
  appetizers: AppetizersIcon,
  'main-course': MainCourseIcon,
  beverages: BeveragesIcon,
  desserts: DessertsIcon,
  pizza: PizzaIcon,
  burgers: BurgersIcon,
  salads: SaladsIcon,
  pasta: PastaIcon,
  'rice-biryani': RiceBiryaniIcon,
  breads: BreadsIcon,
  chinese: ChineseIcon,
  seafood: SeafoodIcon,
  breakfast: BreakfastIcon,
  snacks: SnacksIcon,
  combos: CombosIcon,
  default: DefaultCategoryIcon,
};
