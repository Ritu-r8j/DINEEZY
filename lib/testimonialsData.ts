export type Testimonial = {
  id: string;
  name: string;
  quote: string;
  role: string;
  avatar: string;
  rating: number; // 1-5
};

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 't1',
    name: 'Ava Martinez',
    role: 'Food Critic',
    quote:
      'Every bite bursts with flavor. The textures, the balance — extraordinary. My go-to spot.',
    rating: 5,
    avatar:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=300&auto=format&fit=crop'
  },
  {
    id: 't2',
    name: 'Noah Patel',
    role: 'Designer',
    quote: 'Beautiful presentation, fast delivery, and the pizzas are out of this world.',
    rating: 5,
    avatar:
      'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=300&auto=format&fit=crop'
  },
  {
    id: 't3',
    name: 'Sophia Lee',
    role: 'Entrepreneur',
    quote: 'Healthy options that actually taste amazing. The green bowl is my favorite!',
    rating: 4,
    avatar:
      'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=300&auto=format&fit=crop'
  }
];

