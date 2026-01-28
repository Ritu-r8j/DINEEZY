export type MenuCategory = 'All' | 'Salads' | 'Pizza' | 'Beverages' | 'Snacks' | 'Desserts';

export type MenuItem = {
  id: string;
  title: string;
  description: string;
  nutrition: string;
  price: number;
  category: MenuCategory;
  image: string;
  video?: string;
};

export const CATEGORIES: MenuCategory[] = ['All', 'Salads', 'Pizza', 'Beverages', 'Snacks', 'Desserts'];

export const MENU: MenuItem[] = [
  {
    id: 'caprese-salad',
    title: 'Caprese Salad',
    description: 'Heirloom tomatoes, fresh mozzarella, basil, balsamic glaze.',
    nutrition: '320 kcal • 12g protein',
    price: 12.5,
    category: 'Salads',
    image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?q=80&w=1200&auto=format&fit=crop'
  },
  {
    id: 'margherita',
    title: 'Margherita Pizza',
    description: 'San Marzano tomatoes, buffalo mozzarella, basil, olive oil.',
    nutrition: '680 kcal • 24g protein',
    price: 17,
    category: 'Pizza',
    image: 'https://images.unsplash.com/photo-1548366086-7a7b4b108d73?q=80&w=1200&auto=format&fit=crop'
  },
  {
    id: 'pepperoni',
    title: 'Pepperoni Pizza',
    description: 'Crisp pepperoni, mozzarella, tomato sauce, oregano.',
    nutrition: '740 kcal • 30g protein',
    price: 18.5,
    category: 'Pizza',
    image: 'https://images.unsplash.com/photo-1601924629557-3c30f8b5c41f?q=80&w=1200&auto=format&fit=crop'
  },
  {
    id: 'cold-brew',
    title: 'Vanilla Cold Brew',
    description: 'Slow-steeped coffee, vanilla syrup, creamy finish.',
    nutrition: '120 kcal • 2g protein',
    price: 5.5,
    category: 'Beverages',
    image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=1200&auto=format&fit=crop'
  },
  {
    id: 'fries',
    title: 'Truffle Fries',
    description: 'Hand-cut fries, truffle oil, parmesan, parsley.',
    nutrition: '520 kcal • 8g protein',
    price: 8,
    category: 'Snacks',
    image: 'https://images.unsplash.com/photo-1541592553160-82008b127ccb?q=80&w=1200&auto=format&fit=crop'
  },
  {
    id: 'cheesecake',
    title: 'Berry Cheesecake',
    description: 'Creamy cheesecake, berry compote, graham crust.',
    nutrition: '430 kcal • 7g protein',
    price: 9.5,
    category: 'Desserts',
    image: 'https://images.unsplash.com/photo-1511911063754-3e96cc2e0f59?q=80&w=1200&auto=format&fit=crop'
  },
  {
    id: 'green-bowl',
    title: 'Super Green Bowl',
    description: 'Kale, quinoa, avocado, edamame, lemon vinaigrette.',
    nutrition: '410 kcal • 19g protein',
    price: 13,
    category: 'Salads',
    image: 'https://images.unsplash.com/photo-1546539782-6fc531453083?q=80&w=1200&auto=format&fit=crop'
  },
  {
    id: 'tiramisu',
    title: 'Classic Tiramisu',
    description: 'Espresso-soaked ladyfingers, mascarpone, cocoa.',
    nutrition: '480 kcal • 8g protein',
    price: 10,
    category: 'Desserts',
    image: 'https://images.unsplash.com/photo-1612208695882-c59f1553e94c?q=80&w=1200&auto=format&fit=crop'
  }
];

