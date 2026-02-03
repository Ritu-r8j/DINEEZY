// Default category system with SEO-friendly structure
export interface DefaultCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  iconKey: string;
  sortOrder: number;
}

export interface CustomCategoryMapping {
  customName: string;
  defaultCategoryId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  iconKey?: string;
  isCustom: true;
  createdAt: Date;
  updatedAt: Date;
}

// Production-grade default categories (like Zomato/Swiggy)
export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  {
    id: 'appetizers',
    name: 'Appetizers',
    description: 'Starters and small bites',
    icon: 'appetizers',
    iconKey: 'appetizers',
    sortOrder: 1
  },
  {
    id: 'main-course',
    name: 'Main Course',
    description: 'Primary dishes and entrees',
    icon: 'main-course',
    iconKey: 'main-course',
    sortOrder: 2
  },
  {
    id: 'beverages',
    name: 'Beverages',
    description: 'Drinks and refreshments',
    icon: 'beverages',
    iconKey: 'beverages',
    sortOrder: 3
  },
  {
    id: 'desserts',
    name: 'Desserts',
    description: 'Sweet treats and desserts',
    icon: 'desserts',
    iconKey: 'desserts',
    sortOrder: 4
  },
  {
    id: 'pizza',
    name: 'Pizza',
    description: 'Pizza varieties',
    icon: 'pizza',
    iconKey: 'pizza',
    sortOrder: 5
  },
  {
    id: 'burgers',
    name: 'Burgers',
    description: 'Burgers and sandwiches',
    icon: 'burgers',
    iconKey: 'burgers',
    sortOrder: 6
  },
  {
    id: 'salads',
    name: 'Salads',
    description: 'Fresh salads and bowls',
    icon: 'salads',
    iconKey: 'salads',
    sortOrder: 7
  },
  {
    id: 'pasta',
    name: 'Pasta',
    description: 'Pasta dishes',
    icon: 'pasta',
    iconKey: 'pasta',
    sortOrder: 8
  },
  {
    id: 'rice-biryani',
    name: 'Rice & Biryani',
    description: 'Rice dishes and biryani',
    icon: 'rice-biryani',
    iconKey: 'rice-biryani',
    sortOrder: 9
  },
  {
    id: 'breads',
    name: 'Breads',
    description: 'Breads and rotis',
    icon: 'breads',
    iconKey: 'breads',
    sortOrder: 10
  },
  {
    id: 'chinese',
    name: 'Chinese',
    description: 'Chinese cuisine',
    icon: 'chinese',
    iconKey: 'chinese',
    sortOrder: 11
  },
  {
    id: 'seafood',
    name: 'Seafood',
    description: 'Fish and seafood dishes',
    icon: 'seafood',
    iconKey: 'seafood',
    sortOrder: 12
  },
  {
    id: 'breakfast',
    name: 'Breakfast',
    description: 'Breakfast items',
    icon: 'breakfast',
    iconKey: 'breakfast',
    sortOrder: 13
  },
  {
    id: 'snacks',
    name: 'Snacks',
    description: 'Quick bites and snacks',
    icon: 'snacks',
    iconKey: 'snacks',
    sortOrder: 14
  },
  {
    id: 'combos',
    name: 'Combos',
    description: 'Meal combos and deals',
    icon: 'combos',
    iconKey: 'combos',
    sortOrder: 15
  }
];

// Helper function to get default category by ID
export const getDefaultCategoryById = (id: string): DefaultCategory | undefined => {
  return DEFAULT_CATEGORIES.find(cat => cat.id === id);
};

// Helper function to get display name (custom or default)
export const getCategoryDisplayName = (
  defaultCategoryId: string,
  customMappings: Record<string, CustomCategoryMapping>,
  customCategories?: CustomCategory[]
): string => {
  // Check if it's a custom category
  if (customCategories) {
    const customCat = customCategories.find(cat => cat.id === defaultCategoryId);
    if (customCat) {
      return customCat.name;
    }
  }
  
  // Check for custom mapping
  const mapping = customMappings[defaultCategoryId];
  if (mapping && mapping.isActive) {
    return mapping.customName;
  }
  
  // Fall back to default
  const defaultCat = getDefaultCategoryById(defaultCategoryId);
  return defaultCat?.name || defaultCategoryId;
};
