# DINEEZY COMPREHENSIVE DESIGN SYSTEM & STYLING GUIDE

## TABLE OF CONTENTS
1. [Technology Stack](#1-technology-stack)
2. [Color System](#2-color-system)
3. [Typography](#3-typography)
4. [Border Radius System](#4-border-radius-system)
5. [Spacing System](#5-spacing-system)
6. [Shadow System](#6-shadow-system)
7. [Visual Effects & Glassmorphism](#7-visual-effects--glassmorphism)
8. [Gradient System](#8-gradient-system)
9. [Animation Library](#9-animation-library)
10. [Interactive Component Patterns](#10-interactive-component-patterns)
11. [Icon & SVG System](#11-icon--svg-system)
12. [Responsive Design](#12-responsive-design)
13. [Accessibility Standards](#13-accessibility-standards)
14. [Component Patterns](#14-component-patterns)

---

## 1. TECHNOLOGY STACK

### Core Technologies
- **Framework**: Next.js 15 (App Router)
- **Styling Engine**: Tailwind CSS v4
- **UI Component Library**: Shadcn/UI (New York style)
- **Font Optimization**: `next/font/google`
- **Iconography**: Lucide React (v0.552.0) + Custom SVGs
- **Animation Libraries**: 
  - CSS Keyframes + `tailwindcss-animate`
  - Framer Motion (for complex animations)
  - GSAP (for scroll-triggered animations)
- **Form Handling**: React Hook Form (implied)
- **State Management**: React Context, useState hooks

### Development Tools
- **TypeScript**: Full type safety
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Git**: Version control

---

## 2. COLOR SYSTEM

### 2.1 CSS Variables (OKLCH Color Space)

The design system uses CSS variables with **OKLCH** color space for perceptible uniformity. It supports both **Light** and **Dark** modes.

#### Root Variables (`:root`)
```css
--radius: 0.625rem (10px)

/* Semantic Colors */
--background: oklch(1 0 0)              /* #FFFFFF - White */
--foreground: oklch(0.145 0 0)          /* #1F1F1F - Dark Gray */
--card: oklch(1 0 0)                   /* #FFFFFF */
--card-foreground: oklch(0.145 0 0)      /* #1F1F1F */
--popover: oklch(1 0 0)                 /* #FFFFFF */
--popover-foreground: oklch(0.145 0 0)    /* #1F1F1F */

/* Primary Colors */
--primary: oklch(0.205 0 0)              /* #3D3D3D - Dark Gray */
--primary-foreground: oklch(0.985 0 0)      /* #F9F9F9 - Off-White */
--secondary: oklch(0.97 0 0)             /* #F7F7F7 - Medium Gray */
--secondary-foreground: oklch(0.205 0 0)     /* #3D3D3D */

/* Muted Colors */
--muted: oklch(0.97 0 0)                /* #F7F7F7 */
--muted-foreground: oklch(0.556 0 0)       /* #8C8C8C - Medium Gray */
--accent: oklch(0.97 0 0)               /* #F7F7F7 */
--accent-foreground: oklch(0.205 0 0)      /* #3D3D3D */

/* Status Colors */
--destructive: oklch(0.577 0.245 27.325)  /* #EF4444 - Red */
--border: oklch(0.922 0 0)              /* #EBEBEB - Light Gray */
--input: oklch(0.922 0 0)               /* #EBEBEB */
--ring: oklch(0.708 0 0)                /* #B4B4B4 */

/* Chart Colors */
--chart-1: oklch(0.646 0.222 41.116)     /* Indigo-ish */
--chart-2: oklch(0.6 0.118 184.704)      /* Teal-ish */
--chart-3: oklch(0.398 0.07 227.392)      /* Blue-ish */
--chart-4: oklch(0.828 0.189 84.429)      /* Yellow-ish */
--chart-5: oklch(0.769 0.188 70.08)       /* Orange-ish */

/* Sidebar */
--sidebar: oklch(0.985 0 0)               /* #F9F9F9 */
--sidebar-foreground: oklch(0.145 0 0)       /* #1F1F1F */
--sidebar-primary: oklch(0.205 0 0)         /* #3D3D3D */
--sidebar-primary-foreground: oklch(0.985 0 0) /* #F9F9F9 */
--sidebar-accent: oklch(0.97 0 0)          /* #F7F7F7 */
--sidebar-accent-foreground: oklch(0.205 0 0)   /* #3D3D3D */
--sidebar-border: oklch(0.922 0 0)          /* #EBEBEB */
--sidebar-ring: oklch(0.708 0 0)            /* #B4B4B4 */
```

#### Dark Mode Variables (`.dark`)
```css
--background: oklch(0.145 0 0)            /* #1F1F1F - Dark Gray */
--foreground: oklch(0.985 0 0)            /* #F9F9F9 - Off-White */
--card: oklch(0.205 0 0)                 /* #3D3D3D */
--card-foreground: oklch(0.985 0 0)         /* #F9F9F9 */
--popover: oklch(0.205 0 0)               /* #3D3D3D */
--popover-foreground: oklch(0.985 0 0)       /* #F9F9F9 */

--primary: oklch(0.922 0 0)              /* #EBEBEB - Light Gray */
--primary-foreground: oklch(0.205 0 0)        /* #3D3D3D */
--secondary: oklch(0.269 0 0)             /* #454545 - Darker Gray */
--secondary-foreground: oklch(0.985 0 0)      /* #F9F9F9 */

--muted: oklch(0.269 0 0)                /* #454545 */
--muted-foreground: oklch(0.708 0 0)        /* #B4B4B4 */
--accent: oklch(0.269 0 0)               /* #454545 */
--accent-foreground: oklch(0.985 0 0)       /* #F9F9F9 */

--destructive: oklch(0.704 0.191 22.216)   /* #F87171 - Lighter Red */
--border: oklch(1 0 0 / 10%)               /* rgba(255,255,255,0.1) */
--input: oklch(1 0 0 / 15%)                /* rgba(255,255,255,0.15) */
--ring: oklch(0.556 0 0)                 /* #8E8E8E */

/* Chart Colors (Dark Mode) */
--chart-1: oklch(0.488 0.243 264.376)
--chart-2: oklch(0.696 0.17 162.48)
--chart-3: oklch(0.769 0.188 70.08)
--chart-4: oklch(0.627 0.265 303.9)
--chart-5: oklch(0.645 0.246 16.439)
```

### 2.2 Complete Color Palette

#### Semantic Color Map (Light Mode)
| Token | OKLCH | Hex | RGB | Usage |
|-------|---------|-----|-----|-------|
| `--background` | `1 0 0` | `#FFFFFF` | `rgb(255, 255, 255)` | Page backgrounds |
| `--foreground` | `0.145 0 0` | `#1F1F1F` | `rgb(31, 31, 31)` | Primary text |
| `--primary` | `0.205 0 0` | `#3D3D3D` | `rgb(61, 61, 61)` | Primary actions, buttons |
| `--primary-foreground` | `0.985 0 0` | `#F9F9F9` | `rgb(249, 249, 249)` | Text on primary |
| `--secondary` | `0.97 0 0` | `#F7F7F7` | `rgb(247, 127, 127)` | Secondary backgrounds |
| `--secondary-foreground` | `0.205 0 0` | `#3D3D3D` | `rgb(61, 61, 61)` | Text on secondary |
| `--muted` | `0.97 0 0` | `#F7F7F7` | `rgb(247, 127, 127)` | Muted backgrounds |
| `--muted-foreground` | `0.556 0 0` | `#8C8C8C` | `rgb(140, 140, 140)` | Secondary text |
| `--accent` | `0.97 0 0` | `#F7F7F7` | `rgb(247, 127, 127)` | Accent/Hover states |
| `--accent-foreground` | `0.205 0 0` | `#3D3D3D` | `rgb(61, 61, 61)` | Text on accent |
| `--destructive` | `0.577 0.245 27.325` | `#EF4444` | `rgb(239, 68, 68)` | Error/Danger actions |
| `--border` | `0.922 0 0` | `#EBEBEB` | `rgb(235, 235, 235)` | Borders, dividers |
| `--input` | `0.922 0 0` | `#EBEBEB` | `rgb(235, 235, 235)` | Input borders |
| `--ring` | `0.708 0 0` | `#B4B4B4` | `rgb(180, 180, 180)` | Focus rings |

#### Semantic Color Map (Dark Mode)
| Token | OKLCH | Hex | RGB | Usage |
|-------|---------|-----|-----|-------|
| `--background` | `0.145 0 0` | `#1F1F1F` | `rgb(31, 31, 31)` | Page backgrounds |
| `--foreground` | `0.985 0 0` | `#F9F9F9` | `rgb(249, 249, 249)` | Primary text |
| `--primary` | `0.922 0 0` | `#EBEBEB` | `rgb(235, 235, 235)` | Primary actions, buttons |
| `--primary-foreground` | `0.205 0 0` | `#3D3D3D` | `rgb(61, 61, 61)` | Text on primary |
| `--secondary` | `0.269 0 0` | `#454545` | `rgb(69, 69, 69)` | Secondary backgrounds |
| `--secondary-foreground` | `0.985 0 0` | `#F9F9F9` | `rgb(249, 249, 249)` | Text on secondary |
| `--muted` | `0.269 0 0` | `#454545` | `rgb(69, 69, 69)` | Muted backgrounds |
| `--muted-foreground` | `0.708 0 0` | `#B4B4B4` | `rgb(180, 180, 180)` | Secondary text |
| `--accent` | `0.269 0 0` | `#454545` | `rgb(69, 69, 69)` | Accent/Hover states |
| `--accent-foreground` | `0.985 0 0` | `#F9F9F9` | `rgb(249, 249, 249)` | Text on accent |
| `--destructive` | `0.704 0.191 22.216` | `#F87171` | `rgb(248, 113, 113)` | Error/Danger actions |
| `--border` | `1 0 0 / 10%` | `rgba(255,255,255,0.1)` | Transparent white | Borders, dividers |
| `--input` | `1 0 0 / 15%` | `rgba(255,255,255,0.15)` | Transparent white | Input borders |
| `--ring` | `0.556 0 0` | `#8E8E8E` | `rgb(142, 142, 142)` | Focus rings |

### 2.3 Tailwind Color Scale (Additional Colors)

#### Light Mode Extended Palette
| Color | Hex | RGB | Tailwind Classes | Usage |
|-------|-----|-----|----------------|-------|
| Black | `#000000` | `rgb(0, 0, 0)` | `text-black`, `bg-black` | High contrast, primary |
| Gray 50 | `#F9FAFB` | `rgb(249, 250, 251)` | `bg-gray-50` | Subtle backgrounds |
| Gray 100 | `#F3F4F6` | `rgb(243, 244, 246)` | `bg-gray-100` | Section backgrounds |
| Gray 200 | `#E5E7EB` | `rgb(229, 231, 235)` | `bg-gray-200`, `border-gray-200` | Borders, inputs |
| Gray 300 | `#D1D5DB` | `rgb(209, 213, 219)` | `text-gray-300`, `bg-gray-300` | Secondary text |
| Gray 400 | `#9CA3AF` | `rgb(156, 163, 175)` | `text-gray-400` | Muted text, icons |
| Gray 500 | `#6B7280` | `rgb(107, 114, 128)` | `text-gray-500` | Placeholder text |
| Gray 600 | `#4B5563` | `rgb(75, 85, 99)` | `text-gray-600` | Body text |
| Gray 700 | `#374151` | `rgb(55, 65, 81)` | `text-gray-700`, `bg-gray-700` | Emphasized text |
| Gray 800 | `#1F2937` | `rgb(31, 41, 55)` | `text-gray-800`, `bg-gray-800` | Cards, dark backgrounds |
| Gray 900 | `#111827` | `rgb(17, 24, 39)` | `text-gray-900`, `bg-gray-900` | High contrast text |

#### Dark Mode Extended Palette
| Color | Hex | RGB | Tailwind Classes | Usage |
|-------|-----|-----|----------------|-------|
| Black | `#000000` | `rgb(0, 0, 0)` | `text-black`, `bg-black` | High contrast |
| Gray 50 | `#F9FAFB` → `#1F2937` | Dark variant | `dark:bg-gray-900` | Backgrounds |
| Gray 100 | `#F3F4F6` → `#374151` | Dark variant | `dark:bg-gray-800` | Cards |
| Gray 200 | `#E5E7EB` → `#4B5563` | Dark variant | `dark:border-gray-600` | Borders |
| Gray 300 | `#D1D5DB` → `#6B7280` | Dark variant | `dark:text-gray-300` | Secondary text |
| Gray 400 | `#9CA3AF` → `#9CA3AF` | Same | `dark:text-gray-400` | Icons |
| Gray 500 | `#6B7280` → `#9CA3AF` | Dark variant | `dark:text-gray-500` | Placeholder |
| Gray 600 | `#4B5563` → `#D1D5DB` | Dark variant | `dark:text-gray-600` | Body text |
| Gray 700 | `#374151` → `#E5E7EB` | Dark variant | `dark:bg-gray-700` | Cards |
| Gray 800 | `#1F2937` → `#374151` | Dark variant | `dark:bg-gray-800` | Cards |
| Gray 900 | `#111827` → `#F3F4F6` | Dark variant | `dark:text-gray-900` | High contrast |

### 2.4 Status Color System

#### Order Status Colors (Light Mode)
| Status | Background | Text | Badge Classes |
|--------|-----------|------|---------------|
| Pending | `bg-yellow-100` | `text-yellow-800` | `bg-yellow-100 text-yellow-800` |
| Confirmed | `bg-blue-100` | `text-blue-800` | `bg-blue-100 text-blue-800` |
| Preparing | `bg-orange-100` | `text-orange-800` | `bg-orange-100 text-orange-800` |
| Ready | `bg-green-100` | `text-green-800` | `bg-green-100 text-green-800` |
| Delivered | `bg-green-100` | `text-green-800` | `bg-green-100 text-green-800` |
| Cancelled | `bg-red-100` | `text-red-800` | `bg-red-100 text-red-800` |

#### Order Status Colors (Dark Mode)
| Status | Background | Text | Badge Classes |
|--------|-----------|------|---------------|
| Pending | `dark:bg-yellow-900/20` | `dark:text-yellow-400` | `dark:bg-yellow-900/20 dark:text-yellow-400` |
| Confirmed | `dark:bg-blue-900/20` | `dark:text-blue-400` | `dark:bg-blue-900/20 dark:text-blue-400` |
| Preparing | `dark:bg-orange-900/20` | `dark:text-orange-400` | `dark:bg-orange-900/20 dark:text-orange-400` |
| Ready | `dark:bg-green-900/20` | `dark:text-green-400` | `dark:bg-green-900/20 dark:text-green-400` |
| Delivered | `dark:bg-green-900/20` | `dark:text-green-400` | `dark:bg-green-900/20 dark:text-green-400` |
| Cancelled | `dark:bg-red-900/20` | `dark:text-red-400` | `dark:bg-red-900/20 dark:text-red-400` |

### 2.5 Special Gradients

#### Accent Gradients
| Gradient | CSS | Usage |
|----------|-------|-------|
| Brand Gradient 1 | `bg-gradient-to-r from-[#87C6FE] to-[#BCAFFF]` | Navigation active indicator |
| Brand Gradient 2 | `bg-gradient-to-r from-foreground to-foreground/80` | Text overlays |
| Hero Background | `bg-gradient-to-br from-background via-background to-muted/20` | Page backgrounds |
| Card Shine | `bg-gradient-to-br from-primary/5 via-card to-secondary/10` | Card backgrounds |
| Button Shine | `bg-gradient-to-r from-primary to-primary/90` | Primary buttons |

#### Status Badge Gradients
| Badge | CSS | Usage |
|-------|-----|-------|
| Best Seller | `bg-gradient-to-r from-amber-500 to-yellow-500` | Featured badge |
| Recommended | `bg-gradient-to-r from-emerald-500 to-green-500` | Recommended badge |
| Featured | `bg-gradient-to-r from-blue-500 to-purple-600` | Featured items |

---

## 3. TYPOGRAPHY

### 3.1 Font Families

#### Geist (Primary Font)
```css
--font-geist-sans: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
```

#### Geist Mono (Code Font)
```css
--font-geist-mono: 'Geist Mono', ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', 'Courier New', monospace;
```

### 3.2 Font Size Scale

| Tailwind Class | Value | Pixels | Usage |
|--------------|-------|--------|-------|
| `text-xs` | `0.75rem` | `12px` | Labels, badges, meta info, small UI |
| `text-sm` | `0.875rem` | `14px` | Body text, secondary text, buttons |
| `text-base` | `1rem` | `16px` | Standard text, paragraphs |
| `text-lg` | `1.125rem` | `18px` | Emphasized text, subheadings |
| `text-xl` | `1.25rem` | `20px` | Subheadings, card titles |
| `text-2xl` | `1.5rem` | `24px` | Section headings |
| `text-3xl` | `1.875rem` | `30px` | Page headings |
| `text-4xl` | `2.25rem` | `36px` | Large headings |
| `text-5xl` | `3rem` | `48px` | Hero headings |
| `text-6xl` | `3.75rem` | `60px` | Extra large headings |
| `text-7xl` | `4.5rem` | `72px` | Display headings |

### 3.3 Font Weight Scale

| Tailwind Class | Value | Usage |
|--------------|-------|-------|
| `font-normal` | `400` | Body text, normal paragraphs |
| `font-medium` | `500` | Labels, secondary headings, buttons |
| `font-semibold` | `600` | Emphasized text, headings, interactive elements |
| `font-bold` | `700` | Main headings, important text |

### 3.4 Line Height Scale

| Tailwind Class | Value | Usage |
|--------------|-------|-------|
| `leading-none` | `1` | Compact headings, tight layouts |
| `leading-tight` | `1.25` | Headings, tight text |
| `leading-snug` | `1.375` | Subheadings, slightly tight |
| `leading-normal` | `1.5` | Body text, paragraphs |
| `leading-relaxed` | `1.625` | Readable paragraphs, long content |

### 3.5 Letter Spacing (Tracking)

| Tailwind Class | Value | Usage |
|--------------|-------|-------|
| `tracking-tight` | `-0.025em` | Tight headings, uppercase text |
| `tracking-normal` | `0` | Default text |
| `tracking-wide` | `0.025em` | Spaced text, links |
| `tracking-wider` | `0.05em` | Wide spacing, uppercase labels |
| `tracking-widest` | `0.1em` | Maximum spacing, decorative text |

### 3.6 Typography Usage Patterns

#### Hero Headings
```css
text-2xl font-semibold leading-tight        /* Mobile: 24px */
sm:text-3xl font-semibold leading-tight   /* Tablet: 30px */
lg:text-4xl font-semibold leading-tight   /* Desktop: 36px */
xl:text-5xl font-semibold leading-tight    /* Large Desktop: 48px */
```

#### Page Headings
```css
text-2xl sm:text-3xl lg:text-4xl font-bold
```

#### Card Titles
```css
text-xl font-semibold            /* 20px */
text-sm font-bold               /* 14px */
```

#### Body Text
```css
text-sm text-gray-600 dark:text-gray-400
text-base text-gray-700 dark:text-gray-300
```

#### Labels
```css
text-xs font-medium           /* 12px - Small labels */
text-sm font-semibold         /* 14px - Form labels */
```

#### Badges
```css
text-xs font-medium uppercase tracking-widest
```

---

## 4. BORDER RADIUS SYSTEM

| Tailwind Class | Value | Pixels | Usage |
|--------------|-------|--------|-------|
| `rounded-none` | `0` | `0px` | Square corners |
| `rounded-sm` | `calc(var(--radius) - 4px)` | `6px` | Small elements, tags |
| `rounded-md` | `calc(var(--radius) - 2px)` | `8px` | Medium elements, inputs |
| `rounded-lg` | `var(--radius)` | `10px` | Cards, buttons, inputs |
| `rounded-xl` | `calc(var(--radius) + 4px)` | `14px` | Larger cards, containers |
| `rounded-2xl` | `1rem` | `16px` | Modal cards, hero elements |
| `rounded-3xl` | `1.5rem` | `24px` | Large modals, special cards |
| `rounded-full` | `9999px` | Full circle | Avatars, badges, icons |

### Border Radius Usage Patterns

#### Cards
```css
rounded-lg           /* Standard cards: 10px */
rounded-2xl          /* Large cards, modals: 16px */
rounded-3xl          /* Hero elements, special cards: 24px */
```

#### Buttons
```css
rounded-lg           /* Primary buttons: 10px */
rounded-xl           /* Large buttons: 14px */
rounded-full          /* Icon buttons: circle */
```

#### Inputs
```css
rounded-lg           /* Form inputs: 10px */
rounded-xl           /* Large inputs: 14px */
```

#### Badges
```css
rounded-full          /* Status badges: circle */
rounded-md           /* Tag badges: 8px */
```

---

## 5. SPACING SYSTEM

### 5.1 Padding Scale

| Tailwind Class | Value | Pixels | Usage |
|--------------|-------|--------|-------|
| `p-0` | `0` | `0px` | No padding |
| `p-0.5` | `0.125rem` | `2px` | Minimal padding |
| `p-1` | `0.25rem` | `4px` | Tiny padding |
| `p-1.5` | `0.375rem` | `6px` | Small padding |
| `p-2` | `0.5rem` | `8px` | Small elements |
| `p-2.5` | `0.625rem` | `10px` | Medium padding |
| `p-3` | `0.75rem` | `12px` | Standard padding |
| `p-3.5` | `0.875rem` | `14px` | Slightly larger |
| `p-4` | `1rem` | `16px` | Large padding |
| `p-5` | `1.25rem` | `20px` | Extra large padding |
| `p-6` | `1.5rem` | `24px` | Very large padding |
| `p-7` | `1.75rem` | `28px` | Extra extra large |
| `p-8` | `2rem` | `32px` | Maximum padding |
| `p-10` | `2.5rem` | `40px` | Hero padding |
| `p-12` | `3rem` | `48px` | Special cases |
| `p-16` | `4rem` | `64px` | Maximum container padding |
| `p-20` | `5rem` | `80px` | Hero section padding |

### 5.2 Margin Scale

| Tailwind Class | Value | Pixels | Usage |
|--------------|-------|--------|-------|
| `m-0` | `0` | `0px` | No margin |
| `m-0.5` | `0.125rem` | `2px` | Tiny margin |
| `m-1` | `0.25rem` | `4px` | Tiny margin |
| `m-1.5` | `0.375rem` | `6px` | Small margin |
| `m-2` | `0.5rem` | `8px` | Small margin |
| `m-2.5` | `0.625rem` | `10px` | Medium margin |
| `m-3` | `0.75rem` | `12px` | Standard margin |
| `m-3.5` | `0.875rem` | `14px` | Slightly larger |
| `m-4` | `1rem` | `16px` | Large margin |
| `m-5` | `1.25rem` | `20px` | Extra large margin |
| `m-6` | `1.5rem` | `24px` | Section margins |
| `m-8` | `2rem` | `32px` | Large section margins |
| `m-10` | `2.5rem` | `40px` | Hero margins |
| `m-12` | `3rem` | `48px` | Special cases |
| `m-16` | `4rem` | `64px` | Maximum margins |
| `m-20` | `5rem` | `80px` | Hero section margins |
| `-m-px` | `-1px` | `-1px` | Negative margin |
| `-mx-4` | `-1rem` | `-16px` | Negative horizontal |

### 5.3 Gap Scale (Flex/Grid)

| Tailwind Class | Value | Pixels | Usage |
|--------------|-------|--------|-------|
| `gap-0` | `0` | `0px` | No gap |
| `gap-0.5` | `0.125rem` | `2px` | Tiny gap |
| `gap-1` | `0.25rem` | `4px` | Small gap |
| `gap-1.5` | `0.375rem` | `6px` | Small gap |
| `gap-2` | `0.5rem` | `8px` | Standard gap |
| `gap-2.5` | `0.625rem` | `10px` | Medium gap |
| `gap-3` | `0.75rem` | `12px` | Standard gap |
| `gap-3.5` | `0.875rem` | `14px` | Slightly larger |
| `gap-4` | `1rem` | `16px` | Large gap |
| `gap-5` | `1.25rem` | `20px` | Extra large gap |
| `gap-6` | `1.5rem` | `24px` | Section gaps |
| `gap-8` | `2rem` | `32px` | Large section gaps |
| `gap-10` | `2.5rem` | `40px` | Hero gaps |
| `gap-12` | `3rem` | `48px` | Maximum gaps |
| `gap-16` | `4rem` | `64px` | Maximum gaps |

### 5.4 Spacing Usage Patterns

#### Container Padding
```css
px-4 py-6           /* Mobile: 16px horizontal, 24px vertical */
sm:px-6 py-8        /* Tablet: 24px horizontal, 32px vertical */
lg:px-8 py-10       /* Desktop: 32px horizontal, 40px vertical */
```

#### Card Padding
```css
p-4                 /* Standard card: 16px */
p-6                 /* Large card: 24px */
p-8                 /* Extra large card: 32px */
```

#### Form Elements
```css
px-4 py-3            /* Standard input: 16px horizontal, 12px vertical */
```

#### Button Padding
```css
px-6 py-4            /* Large button: 24px horizontal, 16px vertical */
px-8 py-4            /* Extra large button: 32px horizontal, 16px vertical */
```

#### Section Margins
```css
mb-4                 /* Small margin: 16px */
mb-6                 /* Standard margin: 24px */
mb-8                 /* Large margin: 32px */
mb-12 sm:mb-16      /* Responsive margin: 48px/64px */
```

---

## 6. SHADOW SYSTEM

### 6.1 Shadow Scale

| Tailwind Class | CSS Value | Usage |
|--------------|------------|-------|
| `shadow-none` | `none` | No shadow |
| `shadow-sm` | `0 1px 2px 0 rgb(0 0 0 / 0.05)` | Subtle depth, small elements |
| `shadow` | `0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)` | Default depth |
| `shadow-md` | `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)` | Medium depth |
| `shadow-lg` | `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)` | Large depth, cards |
| `shadow-xl` | `0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)` | Extra large depth, elevated cards |
| `shadow-2xl` | `0 25px 50px -12px rgb(0 0 0 / 0.25)` | Maximum depth, modals |
| `shadow-inner` | `inset 0 2px 4px 0 rgb(0 0 0 / 0.05)` | Inset shadow |

### 6.2 Colored Shadows

#### Primary Shadows
```css
shadow-gray-900/20       /* Dark gray shadow: 20% opacity */
dark:shadow-gray-100/20  /* Light gray shadow in dark mode */
```

#### Status Shadows
```css
shadow-red-500/10         /* Red shadow: 10% opacity */
shadow-green-500/10       /* Green shadow: 10% opacity */
shadow-blue-500/10        /* Blue shadow: 10% opacity */
shadow-yellow-500/10      /* Yellow shadow: 10% opacity */
shadow-orange-500/10      /* Orange shadow: 10% opacity */
```

### 6.3 Custom Shadow Effects

#### Premium Shadow (Subtle)
```css
.premiumShadow {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
```

#### Premium Shadow Hover (Lift)
```css
.premiumShadowHover {
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}
```

#### Glass Shadow
```css
.glassShadow {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}
```

#### Glow Shadow (Animated)
```css
@keyframes pulseGlow {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
  }
}
```

### 6.4 Shadow Usage Patterns

#### Cards
```css
shadow-sm                       /* Default card */
hover:shadow-lg                  /* Card hover */
```

#### Buttons
```css
shadow-lg                        /* Primary button */
hover:shadow-xl                  /* Button hover */
```

#### Inputs
```css
focus:shadow-md                  /* Input focus */
```

#### Modals
```css
shadow-2xl                       /* Modal overlay */
```

---

## 7. VISUAL EFFECTS & GLASSMORPHISM

### 7.1 Glass Effects

#### Light Mode Glass
```css
.glassEffect {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
```

#### Dark Mode Glass
```css
.darkGlassEffect {
  background: rgba(31, 41, 55, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(75, 85, 99, 0.2);
}
```

### 7.2 Backdrop Blur Scale

| Tailwind Class | Blur Value | Usage |
|--------------|-----------|-------|
| `backdrop-blur-none` | `0` | No blur |
| `backdrop-blur-sm` | `4px` | Subtle blur, overlays |
| `backdrop-blur-md` | `12px` | Standard blur, headers |
| `backdrop-blur-lg` | `16px` | Large blur, modals |
| `backdrop-blur-xl` | `24px` | Extra large blur |
| `backdrop-blur-2xl` | `40px` | Maximum blur |
| `backdrop-blur-3xl` | `64px` | Hero blur |

### 7.3 Opacity Scale

| Tailwind Class | Value | Usage |
|--------------|-------|-------|
| `opacity-0` | `0` | Fully transparent |
| `opacity-5` | `0.05` | 5% opacity |
| `opacity-10` | `0.1` | 10% opacity |
| `opacity-20` | `0.2` | 20% opacity |
| `opacity-25` | `0.25` | 25% opacity |
| `opacity-30` | `0.3` | 30% opacity |
| `opacity-40` | `0.4` | 40% opacity |
| `opacity-50` | `0.5` | 50% opacity |
| `opacity-60` | `0.6` | 60% opacity |
| `opacity-70` | `0.7` | 70% opacity |
| `opacity-75` | `0.75` | 75% opacity |
| `opacity-80` | `0.8` | 80% opacity |
| `opacity-90` | `0.9` | 90% opacity |
| `opacity-95` | `0.95` | 95% opacity |
| `opacity-100` | `1` | Fully opaque |

### 7.4 Glassmorphism Usage Patterns

#### Header/Navigation
```css
bg-white/95 backdrop-blur-md        /* Light mode */
dark:bg-background/70 backdrop-blur-md   /* Dark mode */
```

#### Overlays
```css
bg-black/60 backdrop-blur-sm           /* Modal backdrop */
bg-black/20 backdrop-blur-sm           /* Light overlay */
```

#### Badges
```css
bg-black/70 backdrop-blur-sm           /* Video badge */
```

#### Cards
```css
bg-background/95 backdrop-blur-xl      /* Glass cards */
```

---

## 8. GRADIENT SYSTEM

### 8.1 Linear Gradients

#### Background Gradients
```css
/* Hero Background */
bg-gradient-to-br from-background via-background to-muted/20

/* Card Background */
bg-gradient-to-br from-primary/5 via-card to-secondary/10

/* Dark Mode Background */
dark:from-primary/10 dark:via-background dark:to-secondary/20
```

#### Text Gradients
```css
/* Gradient Text */
bg-gradient-to-r from-foreground to-foreground/80
```

#### Button Gradients
```css
/* Primary Button */
bg-gradient-to-r from-primary to-primary/90

/* Accent Button */
bg-gradient-to-r from-blue-600 to-purple-600

/* Status Badge Gradients */
from-amber-500 to-yellow-500       /* Best seller */
from-emerald-500 to-green-500      /* Recommended */
```

#### Overlay Gradients
```css
/* Image Overlay */
bg-gradient-to-t from-black/20 to-transparent
bg-gradient-to-t from-black/40 via-transparent to-black/80

/* Image Gradient */
bg-gradient-to-br from-gray-900/20 to-gray-900/10
```

### 8.2 Radial Gradients

```css
/* Step Indicator Active */
background: radial-gradient(circle, rgba(55, 65, 81, 0.2) 0%, transparent 70%);

/* Custom Radial */
background: radial-gradient(circle, rgba(0, 0, 0, 0.1) 0%, transparent 100%);
```

### 8.3 Custom Brand Gradients

```css
/* Brand Gradient 1 */
background: linear-gradient(90deg, #87C6FE, #BCAFFF);

/* Brand Gradient 2 */
background: linear-gradient(90deg, #b8dcff, #c9cbff, #e5c0ff);
```

### 8.4 Gradient Usage Patterns

#### Card Backgrounds
```css
bg-gradient-to-br from-primary/5 via-card to-secondary/10
```

#### Badge Gradients
```css
bg-gradient-to-r from-amber-500 to-yellow-500
bg-gradient-to-r from-emerald-500 to-green-500
```

#### Button Gradients
```css
bg-gradient-to-r from-primary to-primary/90
```

#### Overlay Gradients
```css
bg-gradient-to-t from-black/20 to-transparent
```

---

## 9. ANIMATION LIBRARY

### 9.1 CSS Animation Keyframes

#### Slide Up
```css
@keyframes slide-up {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
/* Duration: 0.3s | Timing: cubic-bezier(0.16, 1, 0.3, 1) */
```

#### Fade In
```css
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
/* Duration: 0.2-0.8s | Timing: ease-out */
```

#### Slide In From Top
```css
@keyframes slide-in-from-top {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
/* Duration: 0.6s | Timing: ease-out */
```

#### Slide In From Bottom
```css
@keyframes slide-in-from-bottom {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
/* Duration: 0.6s | Timing: ease-out */
```

#### Blob Animation
```css
@keyframes blob {
  0% {
    transform: translate(0px, 0px) scale(1);
  }
  33% {
    transform: translate(30px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
  100% {
    transform: translate(0px, 0px) scale(1);
  }
}
/* Duration: 7s | Infinite | Timing: Ease */
```

### 9.2 Component Animations

#### Fade In Up
```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
/* Duration: 0.6s | Timing: ease-out | Forwards: true */
```

#### Pulse
```css
@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}
/* Duration: 2s | Infinite */
```

#### Gentle Bounce
```css
@keyframes gentleBounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-2px);
  }
}
/* Duration: 2s | Infinite | Ease-in-out */
```

#### Pulse Glow
```css
@keyframes pulseGlow {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
  }
}
/* Duration: 2s | Infinite | Ease-in-out */
```

#### Scale In
```css
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
/* Duration: 0.4s | Timing: ease-out | Forwards: true */
```

#### Stagger In
```css
@keyframes staggerIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
/* Duration: 0.5s | Timing: ease-out | Forwards: true */
```

#### Slide In Right
```css
@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
/* Duration: 0.4s | Timing: ease-out | Forwards: true */
```

#### Slide Out Left
```css
@keyframes slideOutLeft {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(-20px);
  }
}
/* Duration: 0.3s | Timing: ease-out | Forwards: true */
```

#### Shimmer
```css
@keyframes shimmer {
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
}
/* Duration: 2s | Infinite | Background: linear-gradient */
```

#### Progress Shimmer
```css
@keyframes progressShimmer {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}
/* Duration: 2s | Infinite */
```

#### Subtle Pulse
```css
@keyframes subtlePulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.1);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(0, 0, 0, 0);
  }
}
/* Duration: 2s | Infinite */
```

### 9.3 Animation Duration Scale

| Duration | Value | Usage |
|----------|-------|-------|
| `duration-75` | `75ms` | Instant feedback |
| `duration-100` | `100ms` | Quick transitions |
| `duration-200` | `200ms` | Fast transitions, buttons |
| `duration-300` | `300ms` | Standard transitions, cards |
| `duration-400` | `400ms` | Slower transitions |
| `duration-500` | `500ms` | Slow transitions, modals |
| `duration-600` | `600ms` | Very slow transitions |
| `duration-800` | `800ms` | Very slow transitions |

### 9.4 Animation Timing Functions

| Timing Function | CSS Value | Usage |
|-----------------|-----------|-------|
| `ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Quick entry |
| `ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | Smooth entry and exit |
| `ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Smooth exit |
| `ease-linear` | `linear` | Constant speed |
| `cubic-bezier(0.16, 1, 0.3, 1)` | iOS-style ease |
| `cubic-bezier(0.4, 0, 0.2, 1)` | Standard ease |
| `sine.inOut` (GSAP) | `sine.inOut` | Smooth oscillation |

### 9.5 Built-in Tailwind Animations

#### Spin
```css
animate-spin
/* Continuous rotation, 1 second duration */
```

#### Ping
```css
animate-ping
/* Ripple effect, 1 second duration */
```

#### Pulse
```css
animate-pulse
/* Fade in/out, 2 second duration */
```

#### Bounce
```css
animate-bounce
/* Vertical bounce, 1 second duration */
```

---

## 10. INTERACTIVE COMPONENT PATTERNS

### 10.1 Cards

#### Menu Card Pattern
```css
.menuCard {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateY(0);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.menuCard:hover {
  transform: translateY(-4px);
  box-shadow: 
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04),
    0 0 1px rgba(0, 0, 0, 0.05);
  border-color: rgba(0, 0, 0, 0.1);
}

.menuCard:active {
  transform: translateY(-1px);
  transition: transform 0.1s ease-out;
}

/* Touch Optimization */
@media (hover: none) {
  .menuCard:hover {
    transform: none;
  }
}
```

#### Order Type Card Pattern
```css
.orderTypeCard {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.orderTypeCard:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.15);
}

.orderTypeCard:active {
  transform: translateY(0);
  transition: transform 0.1s ease-out;
}
```

#### Step Card Pattern
```css
.stepCard {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.stepCard:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.stepCard:active {
  transform: translateY(-1px);
  transition: transform 0.1s ease-out;
}
```

### 10.2 Buttons

#### Add to Cart Button Pattern
```css
.addToCartButton {
  position: relative;
  overflow: hidden;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.addToCartButton:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.addToCartButton:active {
  transform: scale(0.98);
  transition: transform 0.1s ease-out;
}

.addToCartButton:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Shine Effect Pseudo-element */
.addToCartButton::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease-out;
}

.addToCartButton:hover::before {
  left: 100%;
}
```

#### Place Order Button Pattern
```css
.placeOrderButton {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.placeOrderButton:hover {
  transform: translateY(-2px);
}

.placeOrderButton:active {
  transform: translateY(0);
  transition: transform 0.1s ease-out;
}
```

#### Step Button Pattern
```css
.stepButton {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.stepButton:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.stepButton:active {
  transform: translateY(-1px);
  transition: transform 0.1s ease-out;
}
```

### 10.3 Inputs

#### Form Input Pattern
```css
.formInput {
  transition: all 0.2s ease-in-out;
}

.formInput:focus {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.formInput:focus-visible {
  outline: 2px solid rgba(0, 0, 0, 0.3);
  outline-offset: 2px;
}

.formInput:invalid {
  border-color: #EF4444;
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
}

/* Error State */
.formInput.has-error {
  border-color: #EF4444;
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
}
```

#### Enhanced Input Pattern
```css
.enhancedInput {
  transition: all 0.3s ease-in-out;
}

.enhancedInput:focus {
  transform: translateY(-2px);
  box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.15);
}
```

### 10.4 Navigation Elements

#### Category Button Pattern
```css
.categoryButton {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.categoryButton:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.categoryButton:active {
  transform: translateY(0);
  transition: transform 0.1s ease-out;
}

/* Shine Effect */
.categoryButton::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease-out;
}

.categoryButton:hover::before {
  left: 100%;
}
```

### 10.5 Specialized Elements

#### Nutrition Badge
```css
.nutritionBadge {
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: transform 0.3s;
}

.nutritionBadge:hover {
  transform: scale(1.1);
}
```

#### Featured Badge
```css
.featuredBadge {
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  animation: pulse 2s infinite;
}
```

#### Loading Skeleton
```css
.loading {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

/* Dark Mode */
@media (prefers-color-scheme: dark) {
  .loading {
    background: linear-gradient(90deg, #374151 25%, #4b5563 50%, #374151 75%);
    background-size: 200% 100%;
  }
}
```

#### Video Badge Pulse
```css
.videoBadge {
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.videoBadge .pulse {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #EF4444;
  animation: pulse 2s infinite;
}
```

### 10.6 Navigation Stepper

#### Step Indicator
```css
.stepIndicator {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stepIndicator::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: radial-gradient(circle, rgba(55, 65, 81, 0.2) 0%, transparent 70%);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.stepIndicator.active::before {
  width: 70px;
  height: 70px;
}
```

#### Step Connector
```css
.stepConnector {
  position: relative;
  overflow: hidden;
}

.stepConnector::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, rgba(55, 65, 81, 0.2), rgba(55, 65, 81, 0.2) 50%, transparent 50%);
  background-size: 200% 100%;
  transition: left 0.5s ease-out;
}

.stepConnector.active::after {
  left: 100%;
}
```

---

## 11. ICON & SVG SYSTEM

### 11.1 Icon Sizing Standards

| Size | Tailwind Class | Pixels | Usage |
|------|--------------|--------|-------|
| Extra Small | `w-3 h-3` | `12px` | Tiny indicators |
| Small | `w-4 h-4` | `16px` | Standard icons |
| Medium | `w-5 h-5` | `20px` | Larger icons |
| Large | `w-6 h-6` | `24px` | Emphasized icons |
| Extra Large | `w-8 h-8` | `32px` | Large displays |
| XX Large | `w-12 h-12` | `48px` | Hero icons |
| XXX Large | `w-16 h-16` | `64px` | Empty state icons |

### 11.2 Stroke Width Standards

| Stroke | Value | Usage |
|--------|-------|-------|
| Thin | `strokeWidth="1"` | Filled icons with stroke overlay |
| Normal | `strokeWidth="1.5"` | Some nav icons |
| Standard | `strokeWidth="2"` | Most icons |
| Thick | `strokeWidth="2.5"` | Emphasized icons |

### 11.3 Complete Lucide Icon Inventory

| Icon | Component | Typical Size | Use Case |
|------|-----------|--------------|----------|
| **X** | `X` | `w-3 h-3` to `w-5 h-5` | Close buttons, dismissals |
| **Plus** | `Plus` | `w-3 h-3` to `w-4 h-4` | Add items, increase quantity |
| **Minus** | `Minus` | `w-3 h-3` to `w-4 h-4` | Decrease quantity |
| **ShoppingCart** | `ShoppingCart` | `w-4 h-4` to `w-5 h-5` | Cart button |
| **Trash** | `Trash` | `w-3 h-3` to `w-4 h-4` | Remove item |
| **Check** | `Check` | `w-3 h-3` to `w-4 h-4` | Selected states |
| **Globe** | `Globe` | `w-4 h-4` | Size selection |
| **Moon** | `Moon` | `w-4 h-4` to `w-6 h-6` | Dark mode toggle |
| **Sun** | `Sun` | `w-4 h-4` to `w-6 h-6` | Light mode toggle |
| **User** | `User` | `w-4 h-4` | Profile, user |
| **LogOut** | `LogOut` | `w-4 h-4` | Sign out button |
| **ShoppingBag** | `ShoppingBag` | `w-4 h-4` | Orders navigation |
| **Calendar** | `Calendar` | `w-4 h-4` to `w-5 h-5` | Date, reservations |
| **Clock** | `Clock` | `w-3 w-3` to `w-5 h-5` | Time, delivery |
| **Settings** | `Settings` | `w-4 h-4` to `w-6 h-6` | Settings, theme |
| **UserLock** | `UserLock` | `w-4 h-4` | Admin access |
| **IndianRupee** | `IndianRupee` | `w-4 h-4` | Cashback, pricing |
| **ChevronLeft** | `ChevronLeft` | `h-3 w-3` to `h-4 w-4` | Back, previous |
| **ChevronRight** | `ChevronRight` | `h-3 w-3` to `h-4 w-4` | Forward, next |
| **ChevronDown** | `ChevronDown` | `h-3 w-3` | Dropdowns |
| **ChevronUp** | `ChevronUp` | `h-3 w-3` | Dropdowns |
| **CircleCheck** | `CircleCheck` | `size-5` | Toast success |
| **MapPin** | `MapPin` | `h-3 w-3` to `h-5 w-5` | Location |
| **SortAsc** | `SortAsc` | `h-3 w-3` | Sorting |
| **Filter** | `Filter` | `h-3 w-3` | Filters |
| **Heart** | `Heart` | `h-3 w-3` | Favorites |
| **Share2** | `Share2` | `h-3 w-3` | Sharing |
| **Info** | `Info` | `h-5 w-5` to `h-8 w-8` | Info, help |
| **Shield** | `Shield` | `h-3 w-3` | Security |
| **Leaf** | `Leaf` | `h-3 w-3` | Vegetarian |
| **Zap** | `Zap` | `h-3 w-3` | Quick prep |
| **Flame** | `Flame` | `h-3 w-3` | Spicy |
| **Award** | `Award` | `w-3 h-3` | Best seller |
| **Edit** | `Edit` | `h-3 w-3` | Edit |
| **Loader2** | `Loader2` | `h-8 w-8` to `h-12 w-12` | Loading spinner |
| **TrendingUp** | `TrendingUp` | `h-3 w-3` to `h-4 w-4` | Growth indicators |
| **DollarSign** | `DollarSign` | `h-4 w-4` to `h-6 w-6` | Pricing |
| **AlertCircle** | `AlertCircle` | `h-3 w-3` to `h-5 w-5` | Warnings, pending |
| **CheckCircle** | `CheckCircle` | `h-3 w-3` to `h-5 w-5` | Success, confirmed |
| **XCircle** | `XCircle` | `h-3 w-3` to `h-5 w-5` | Cancelled, errors |
| **BarChart3** | `BarChart3` | `h-5 w-5` | Analytics |

### 11.4 Custom SVG Catalog

#### Navigation Icons

##### Hamburger Menu Icon
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
  <path d="M4 6h16M4 12h16M4 18h16" />
</svg>
```

##### X Close Icon
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
  <path d="M6 18L18 6M6 6l12 12" />
</svg>
```

##### Shopping Cart Icon (Custom)
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="#141414" strokeWidth="1.8">
  <path d="M6 6h14l-1.5 9h-11L5 3H2" />
</svg>
```

##### Profile Icon (Custom)
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="#141414" strokeWidth="1.8">
  <circle cx="12" cy="8" r="3.5" />
  <path d="M5 20c1.5-4 12.5-4 14 0" />
</svg>
```

#### Action Icons

##### Arrow Right Icon
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
  <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
</svg>
```

##### Calendar Badge Icon
```svg
<svg viewBox="0 0 20 20" fill="currentColor">
  <path d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" />
</svg>
```

##### Check Icon (Animated)
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
  <path d="M4 12l5 5L20 6" />
</svg>
```

#### Brand Gradient Star

```svg
<svg viewBox="0 0 24 24">
  <defs>
    <linearGradient id="starGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#b8dcff" stopOpacity="0.5" />
      <stop offset="50%" stopColor="#c9cbff" stopOpacity="0.5" />
      <stop offset="100%" stopColor="#e5c0ff" stopOpacity="0.5" />
    </linearGradient>
  </defs>
  <path
    d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
    fill="url(#starGradient)"
    stroke="url(#starGradient)"
    strokeWidth="1"
  />
</svg>
```

### 11.5 Filter Badge Icons

#### Vegetarian Icon
```svg
<svg viewBox="0 0 24 24" fill="currentColor" opacity="0.8" stroke="currentColor" strokeWidth="2">
  <path d="M12 2L2 7l10 5v10l-10-5z" />
  <path d="M2 17l5 5-5 5v10" />
</svg>
```

#### Vegan Icon
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
  <path d="M12 3a1 1 0 011 1v1h1a1 1 0 011-1V3a1 1 0 00-1-1H7V3a1 1 0 000 2h8a1 1 0 110 2H6z" />
  <path d="M9 12l3 3-3 3" />
</svg>
```

#### Gluten Free Icon
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
  <circle cx="12" cy="12" r="9" />
  <path d="M12 3v18" />
  <path d="M3 12h18" />
</svg>
```

#### Low Calorie Icon
```svg
<svg viewBox="0 0 24 24" fill="currentColor" opacity="0.8" stroke="currentColor" strokeWidth="2">
  <rect x="6" y="10" width="12" height="10" rx="2" />
  <path d="M8 7v2" />
</svg>
```

#### Quick Prep Icon
```svg
<svg viewBox="0 0 24 24" fill="currentColor">
  <path d="M13 2L3 14h7l7 12V2z" />
</svg>
```

#### Spicy Icon
```svg
<svg viewBox="0 0 24 24" fill="currentColor" opacity="0.8" stroke="currentColor" strokeWidth="2">
  <path d="M12 2c-1 0-2 1-2 2v2c0 4 2.5 6 4.5 1 4.5s.5-1.5 1-4.5 1-4.5c-.5 0-1.5.5-2 1-2.5 0-1-.5-2-1.5-1-1.5-1-1.5V4c0-1.5-1-2.5-1-2.5-.5-2.5 0-2-2.5-2.5-1 1-4.5-2 0 0 3.5 0 1.5-1.5 1-3.5 3.5-5.5 2-1.5-4 0-4.5-4.5-2.5 0-4-5.5-4.5-2.5 0-4.5-4.5-2.5 0-3.5-3-3.5-2-5.5-4 0-5-5-5.5-2.5z" />
</svg>
```

### 11.6 Icon Color Standards

| Context | Light Mode | Dark Mode | Tailwind Classes |
|---------|-----------|----------|----------------|
| Primary Text | `#1F1F1F` | `#F9F9F9` | `text-foreground` |
| Secondary Text | `#8C8C8C` | `#B4B4B4` | `text-muted-foreground` |
| Muted | `#9CA3AF` | `#9CA3AF` | `text-gray-400` |
| On White | `#1F1F1F` | `#1F1F1F` | `text-black dark:text-white` |
| Success | `#22C55E` | `#4ADE80` | `text-green-500 dark:text-green-400` |
| Warning | `#F59E0B` | `#FCD34D` | `text-yellow-500 dark:text-yellow-400` |
| Error | `#EF4444` | `#F87171` | `text-red-500 dark:text-red-400` |
| Info | `#3B82F6` | `#60A5FA` | `text-blue-500 dark:text-blue-400` |
| Current Color | `currentColor` | `currentColor` | `stroke="currentColor" fill="currentColor"` |

---

## 12. RESPONSIVE DESIGN

### 12.1 Breakpoint Scale

| Breakpoint | Value | Pixels | Usage |
|-----------|-------|--------|-------|
| `xs` | `480px` | Extra small mobile |
| `sm` | `640px` | Small mobile/tablet |
| `md` | `768px` | Tablet portrait |
| `lg` | `1024px` | Tablet landscape/desktop |
| `xl` | `1280px` | Desktop |
| `2xl` | `1536px` | Large desktop |

### 12.2 Responsive Patterns

#### Mobile First Approach
```css
/* Base styles for mobile */
px-4 py-6 grid-cols-1

/* Tablet */
sm:px-6 sm:py-8 sm:grid-cols-2

/* Desktop */
lg:px-8 lg:py-10 lg:grid-cols-3

/* Large Desktop */
xl:px-12 xl:py-12 xl:grid-cols-4
```

#### Responsive Grid Systems

```css
/* Menu Grid */
grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5

/* Restaurant Grid */
grid-cols-1 sm:grid-cols-2 lg:grid-cols-3

/* Filter Bar */
grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6

/* Stats Grid */
grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7
```

#### Responsive Typography

```css
/* Hero Heading */
text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl

/* Card Title */
text-base sm:text-lg lg:text-xl

/* Body Text */
text-sm sm:text-base
```

#### Responsive Spacing

```css
/* Container Padding */
px-4 sm:px-6 lg:px-8

/* Card Padding */
p-4 sm:p-5 lg:p-6

/* Section Margins */
mb-6 sm:mb-8 lg:mb-12
```

#### Responsive Icons

```css
/* Icon Sizes */
w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6

/* Avatar Sizes */
w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12
```

### 12.3 Touch Optimizations

#### Disable Hover on Touch Devices
```css
@media (hover: none) and (pointer: coarse) {
  .menuCard:hover,
  .addToCartButton:hover,
  .categoryButton:hover,
  .stepButton:hover {
    transform: none;
    box-shadow: none;
  }
}
```

#### Tap Highlight Removal
```css
.menuCard,
.addToCartButton,
.categoryButton {
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}
```

#### Touch Target Sizes
```css
/* Minimum touch target: 44x44px */
touch-action: manipulation;
min-height: 44px;
min-width: 44px;
```

### 12.4 Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 13. ACCESSIBILITY STANDARDS

### 13.1 Focus States

#### Standard Focus Ring
```css
*:focus-visible {
  outline: 2px solid rgba(0, 0, 0, 0.3);
  outline-offset: 2px;
  border-radius: var(--radius);
}
```

#### Focus Ring by Element Type

| Element | Focus Ring Color | Focus Ring Width | Focus Offset |
|----------|------------------|------------------|--------------|
| Input | `rgba(0, 0, 0, 0.3)` | `2px` | `2px` |
| Button | `rgba(0, 0, 0, 0.3)` | `2px` | `2px` |
| Link | `rgba(0, 0, 0, 0.3)` | `2px` | `2px` |

#### Focus State Classes
```css
/* Primary Focus */
focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-500 dark:focus:ring-gray-400

/* Error Focus */
focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500 focus:border-red-500 dark:focus:ring-red-400 dark:focus:border-red-400

/* Success Focus */
focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500 dark:focus:ring-green-400
```

### 13.2 ARIA Attributes

#### Interactive Elements
```html
<button aria-label="Add to cart">Add</button>
<button aria-expanded="false">Menu</button>
<button aria-pressed="false">Like</button>
<div role="button" tabindex="0">Custom Button</div>
```

#### Loading States
```html
<div role="status" aria-live="polite" aria-busy="true">
  Loading...
</div>
<div aria-label="Loading content">
  <svg aria-hidden="true" className="animate-spin">...</svg>
</div>
```

#### Error Messages
```html
<div role="alert" aria-live="assertive">
  <span aria-label="Error: Invalid email">Invalid email address</span>
</div>
<div role="alert" aria-live="polite" aria-atomic="true">
  Your changes have been saved
</div>
```

#### Modal Accessibility
```html
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
  aria-hidden="false"
>
  <h2 id="modal-title">Modal Title</h2>
  <p id="modal-description">Modal description</p>
</div>
```

### 13.3 Semantic HTML

#### Document Structure
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <header role="banner">
    <nav aria-label="Main navigation">...</nav>
  </header>
  <main role="main">
    <h1>Page Title</h1>
    <section aria-labelledby="section-title">...</section>
  </main>
  <footer role="contentinfo">...</footer>
</body>
</html>
```

#### Form Structure
```html
<form aria-label="Contact form">
  <div class="form-group">
    <label for="email" class="form-label">
      Email Address
      <span aria-hidden="true" class="required">*</span>
    </label>
    <input
      id="email"
      type="email"
      name="email"
      aria-required="true"
      aria-invalid="false"
      aria-describedby="email-error"
      placeholder="your@email.com"
    />
    <p id="email-error" role="alert" class="error-message">
      Please enter a valid email address
    </p>
  </div>
</form>
```

### 13.4 Color Contrast Requirements

#### WCAG AA Standards
- Normal text (14px+): 4.5:1 contrast ratio
- Large text (18px+): 3:1 contrast ratio
- Graphical objects: 3:1 contrast ratio

#### Color Combinations Validated

| Foreground | Background | Light Contrast | Dark Contrast | WCAG Level |
|-----------|------------|----------------|----------------|------------|
| `#1F1F1F` | `#FFFFFF` | 16.1:1 | 16.1:1 | AAA |
| `#1F1F1F` | `#EBEBEB` | 10.3:1 | 10.3:1 | AA |
| `#8C8C8C` | `#FFFFFF` | 5.4:1 | 5.4:1 | Fail |
| `#8C8C8C` | `#F7F7F7` | 1.8:1 | 1.8:1 | Fail |
| `#4B5563` | `#FFFFFF` | 8.9:1 | 8.9:1 | AA |
| `#EF4444` | `#FEF2F2` | 4.5:1 | 4.5:1 | Fail |
| `#EF4444` | `#FFFFFF` | 3.9:1 | 3.9:1 | Fail |

### 13.5 Keyboard Navigation

#### Tab Order
```css
/* Logical tab order */
button[tabindex="0"],
input[tabindex="1"],
button[tabindex="2"],
```

#### Keyboard Shortcuts
```javascript
// ESC to close modals
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
  }
});

// Enter to submit forms
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.tagName === 'BUTTON') {
    e.target.click();
  }
});
```

---

## 14. COMPONENT PATTERNS

### 14.1 Card Pattern

```tsx
interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className, hover = true }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-card rounded-xl shadow-lg border-border transition-all duration-300',
        hover && 'hover:shadow-xl hover:scale-105 cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}
```

### 14.2 Button Pattern

#### Primary Button
```tsx
interface PrimaryButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function PrimaryButton({ children, onClick, disabled, loading, className }: PrimaryButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={clsx(
        'px-8 py-4 rounded-xl bg-primary text-primary-foreground',
        'font-semibold shadow-lg transition-all duration-300',
        'hover:bg-primary/90 hover:shadow-xl hover:scale-105',
        'active:scale-95',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'focus:ring-primary dark:focus:ring-gray-400',
        'disabled:opacity-70 disabled:cursor-not-allowed',
        'dark:bg-gray-100 dark:text-gray-900',
        'dark:hover:bg-gray-200',
        className
      )}
    >
      {loading ? (
        <svg className="animate-spin h-5 w-5 mx-2" aria-hidden="true">
          <path d="..." />
        </svg>
      ) : children}
    </button>
  );
}
```

#### Secondary Button
```tsx
export function SecondaryButton({ children, onClick, className }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'px-6 py-3 rounded-xl border-2 border-border bg-card',
        'font-medium transition-colors duration-200',
        'hover:bg-muted hover:border-primary/50',
        'active:bg-muted/50',
        'focus:outline-none focus:ring-2 focus:ring-offset-1',
        'focus:ring-primary dark:focus:ring-gray-400',
        'dark:bg-gray-800 dark:border-gray-700',
        'dark:hover:bg-gray-700 dark:hover:border-gray-600',
        className
      )}
    >
      {children}
    </button>
  );
}
```

### 14.3 Input Pattern

```tsx
interface InputProps {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  type?: 'text' | 'email' | 'password' | 'tel' | 'number';
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
}

export function Input({
  label,
  error,
  icon,
  type = 'text',
  placeholder,
  value,
  onChange,
  required = false,
}: InputProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={type}
          className="text-sm font-semibold text-foreground"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground z-10">
            {icon}
          </span>
        )}
        <input
          id={type}
          type={type}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          required={required}
          className={clsx(
            'w-full px-4 py-3 text-sm font-medium rounded-lg',
            'border border-input bg-card text-foreground',
            'placeholder:text-muted-foreground',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-offset-1',
            'focus:ring-primary dark:focus:ring-gray-400',
            'focus:ring-offset-2',
            error && 'border-destructive focus:ring-destructive',
            'focus:translate-y-[-1px]',
            'dark:bg-gray-800 dark:border-gray-700',
            icon && 'pl-11',
            !error && 'focus:border-primary'
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${type}-error` : undefined}
        />
        {error && (
          <p id={`${type}-error`} className="text-xs font-medium text-destructive mt-1">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
```

### 14.4 Badge Pattern

```tsx
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default';
  size?: 'sm' | 'md' | 'lg';
}

const badgeVariants = {
  success: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  error: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  default: 'bg-muted text-muted-foreground dark:bg-gray-800 dark:text-gray-200',
};

const badgeSizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
};

export function Badge({ children, variant = 'default', size = 'md' }: BadgeProps) {
  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 rounded-full font-medium',
      badgeVariants[variant],
      badgeSizes[size]
    )}>
      {children}
    </span>
  );
}
```

### 14.5 Modal Pattern

```tsx
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const modalSizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={clsx(
          'relative bg-card rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-hidden',
          'animate-slide-up',
          modalSizes[size]
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 id="modal-title" className="text-xl font-bold text-foreground">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {children}
        </div>
      </div>
    </div>
  );
}
```

### 14.6 Status Pattern

```tsx
interface StatusProps {
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig = {
  pending: {
    label: 'Pending',
    bg: 'bg-yellow-100 dark:bg-yellow-900/20',
    text: 'text-yellow-800 dark:text-yellow-400',
    icon: Clock,
  },
  confirmed: {
    label: 'Confirmed',
    bg: 'bg-blue-100 dark:bg-blue-900/20',
    text: 'text-blue-800 dark:text-blue-400',
    icon: CheckCircle,
  },
  preparing: {
    label: 'Preparing',
    bg: 'bg-orange-100 dark:bg-orange-900/20',
    text: 'text-orange-800 dark:text-orange-400',
    icon: Clock,
  },
  ready: {
    label: 'Ready',
    bg: 'bg-green-100 dark:bg-green-900/20',
    text: 'text-green-800 dark:text-green-400',
    icon: CheckCircle,
  },
  delivered: {
    label: 'Delivered',
    bg: 'bg-green-100 dark:bg-green-900/20',
    text: 'text-green-800 dark:text-green-400',
    icon: CheckCircle,
  },
  cancelled: {
    label: 'Cancelled',
    bg: 'bg-red-100 dark:bg-red-900/20',
    text: 'text-red-800 dark:text-red-400',
    icon: XCircle,
  },
};

export function StatusBadge({ status, size = 'md' }: StatusProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  const sizeClasses = size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';

  return (
    <span className={clsx(
      'inline-flex items-center gap-2 rounded-full font-medium px-3 py-1',
      config.bg,
      config.text,
      'text-xs' === size ? 'text-xs' : size === 'lg' ? 'text-sm' : 'text-sm'
    )}>
      <Icon className={sizeClasses} />
      <span>{config.label}</span>
    </span>
  );
}
```

---

## APPENDIX: QUICK REFERENCE

### A. Common Tailwind Classes

#### Spacing
```css
p-4           /* 16px padding */
m-4           /* 16px margin */
gap-4         /* 16px gap */
space-y-4      /* 16px vertical gap */
space-x-4      /* 16px horizontal gap */
```

#### Typography
```css
text-sm        /* 14px */
text-base       /* 16px */
text-lg        /* 18px */
font-semibold  /* 600 weight */
font-bold      /* 700 weight */
```

#### Colors
```css
bg-card        /* Card background */
text-foreground  /* Primary text */
text-muted-foreground  /* Secondary text */
border-border   /* Border color */
```

#### Effects
```css
shadow-lg      /* Large shadow */
rounded-xl     /* 14px radius */
transition-all  /* All properties transition */
duration-300  /* 300ms duration */
```

### B. CSS Custom Properties

```css
/* Animation timing */
:root {
  --duration-fast: 150ms;
  --duration-base: 200ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;
}

/* Border radius */
:root {
  --radius-sm: calc(var(--radius) - 4px);  /* 6px */
  --radius-md: calc(var(--radius) - 2px);  /* 8px */
  --radius-lg: var(--radius);              /* 10px */
  --radius-xl: calc(var(--radius) + 4px);  /* 14px */
  --radius-2xl: 1rem;                      /* 16px */
}

/* Spacing */
:root {
  --spacing-xs: 0.25rem;   /* 4px */
  --spacing-sm: 0.5rem;    /* 8px */
  --spacing-md: 1rem;       /* 16px */
  --spacing-lg: 1.5rem;     /* 24px */
  --spacing-xl: 2rem;       /* 32px */
  --spacing-2xl: 2.5rem;   /* 40px */
}
```

### C. Animation Classes Reference

```css
/* Entry animations */
.animate-fade-in          /* Fade from opacity 0 to 1 */
.animate-slide-up          /* Slide from Y 100% to 0 */
.animate-fade-in-up       /* Combined fade + slide up */
.animate-scale-in         /* Scale from 0.95 to 1 */
.animate-stagger-in        /* Staggered entry with delay */

/* Continuous animations */
.animate-spin             /* Rotate 360deg continuously */
.animate-pulse            /* Scale 1 to 1.05 repeatedly */
.animate-bounce           /* Bounce up and down */

/* Custom animations */
.animate-shimmer          /* Loading shimmer effect */
.animate-gentle-bounce     /* Subtle vertical bounce */
.animate-pulse-glow       /* Glow effect */
```

---

## END OF DOCUMENT

This design system provides comprehensive guidelines for building consistent, accessible, and visually appealing interfaces across the Dineezy application. All values are exact and can be directly implemented in code.
