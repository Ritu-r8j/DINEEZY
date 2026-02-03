# Dineezy Design System & Styling Guide

This document provides a comprehensive breakdown of the client-side styling, design tokens, animations, and UI patterns used in the Dineezy application. It is derived from the project's codebase, specifically `globals.css`, `menu.module.css`, and `checkout.module.css`.

## 1. Technology Stack
- **Framework**: Next.js 15 (App Router)
- **Styling Engine**: Tailwind CSS v4
- **UI Component Library**: Shadcn/UI (New York style)
- **Font Optimization**: `next/font/google`
- **Iconography**: Lucide React
- **Animation**: CSS Keyframes + `tailwindcss-animate`

## 2. Typography
The application uses the **Geist** font family, optimized for legibility and modern aesthetics.

- **Sans Serif**: `var(--font-geist-sans)` (Main UI text)
- **Monospace**: `var(--font-geist-mono)` (Code, technical data)

## 3. Color Palette (Theming)
The design system uses CSS variables with the **OKLCH** color space for perceptible uniformity. It supports both **Light** and **Dark** modes.

### Semantic Colors
| Token | Description | Light Mode (OKLCH) | Dark Mode (OKLCH) |
|-------|-------------|-------------------|-------------------|
| `--background` | Page background | `1 0 0` (White) | `0.145 0 0` (Deep Black) |
| `--foreground` | Main text color | `0.145 0 0` | `0.985 0 0` |
| `--primary` | Primary brand action | `0.205 0 0` | `0.922 0 0` |
| `--primary-foreground` | Text on primary | `0.985 0 0` | `0.205 0 0` |
| `--secondary` | Secondary backgrounds | `0.97 0 0` | `0.269 0 0` |
| `--secondary-foreground` | Text on secondary | `0.205 0 0` | `0.985 0 0` |
| `--muted` | Muted backgrounds | `0.97 0 0` | `0.269 0 0` |
| `--muted-foreground` | Muted text | `0.556 0 0` | `0.708 0 0` |
| `--accent` | Accent/Hover states | `0.97 0 0` | `0.269 0 0` |
| `--accent-foreground` | Text on accent | `0.205 0 0` | `0.985 0 0` |
| `--destructive` | Error/Danger actions | `0.577 0.245 27.325` | `0.704 0.191 22.216` |
| `--border` | Borders | `0.922 0 0` | `1 0 0 / 10%` |
| `--input` | Input borders | `0.922 0 0` | `1 0 0 / 15%` |
| `--ring` | Focus rings | `0.708 0 0` | `0.556 0 0` |

### Charting Colors
A specific palette is defined for data visualization:
- Chart 1: `0.646 0.222 41.116` (Indigo-ish)
- Chart 2: `0.6 0.118 184.704` (Teal-ish)
- Chart 3: `0.398 0.07 227.392` (Blue-ish)
- Chart 4: `0.828 0.189 84.429` (Yellow-ish)
- Chart 5: `0.769 0.188 70.08` (Orange-ish)

### Border Radius
- Base Radius: `0.625rem` (~10px)
- `sm`: `calc(var(--radius) - 4px)`
- `md`: `calc(var(--radius) - 2px)`
- `lg`: `var(--radius)`
- `xl`: `calc(var(--radius) + 4px)`

## 4. Visual Effects & Glassmorphism
The design heavily utilizes glassmorphism and premium shadow effects to create depth.

### Glass Effects
- **`.glassEffect`**:
  - Background: `rgba(255, 255, 255, 0.95)`
  - Blur: `20px`
  - Border: `1px solid rgba(255, 255, 255, 0.2)`
- **`.darkGlassEffect`**:
  - Background: `rgba(31, 41, 55, 0.95)`
  - Blur: `20px`
  - Border: `1px solid rgba(75, 85, 99, 0.2)`

### Premium Shadows
- **`.premiumShadow`**: subtle depth (`0 1px 3px rgba(0,0,0,0.1)`)
- **`.premiumShadowHover`**: significant lift (`0 10px 25px rgba(0,0,0,0.1)`)

## 5. Animation Library
The application features a rich set of custom keyframe animations for smooth micro-interactions.

### Global Animations (`globals.css`)
- **`slide-up`**: Slides element up from 100% Y to 0.
- **`fade-in`**: Simple opacity transition from 0 to 1.
- **`slide-in-from-top` / `bottom`**: Smooth entry with vertical translation (-20px/20px).
- **`blob`**: Complex 7-second infinite organic movement (translate + scale) for background elements.

### Component Animations (Module CSS)
- **`shimmer`**: Linear gradient background movement (used for loading states and button shines).
- **`pulse`**: Scale transform (1 -> 1.05 -> 1).
- **`gentleBounce`**: Subtle vertical float (-2px).
- **`pulseGlow`**: Box-shadow expansion for attention.
- **`fadeInUp`**: Combined opacity and upward translation (20px -> 0).
- **`staggerIn`**: Similar to fadeInUp but often used with delays.
- **`scaleIn`**: Opacity + Scale (0.95 -> 1).
- **`slideInRight` / `slideOutLeft`**: Horizontal sliding transitions for tab content.

## 6. Interactive Component Patterns
The design features highly interactive components with complex hover and active states.

### Cards (`.menuCard`, `.orderTypeCard`, `.stepCard`)
- **Default**: Smooth transition (0.3s/0.4s), subtle border.
- **Hover**:
  - Transform: `translateY(-2px)` to `translateY(-4px)`
  - Shadow: Large diffuse shadow (`0 20px 25px`)
  - Border: Darkens slightly.
  - **Shine Effect**: Many cards use a pseudo-element (`::before`) with a linear gradient that slides across (`left: -100%` to `100%`) on hover.
- **Active**: Slight depression (`translateY(-1px)`).
- **Touch Optimization**: Hover effects are disabled on touch devices (`@media (hover: none)`).

### Buttons (`.addToCartButton`, `.placeOrderButton`, `.stepButton`)
- **Structure**: Relative positioning with `overflow: hidden`.
- **Hover**:
  - Transform: `scale(1.02)` or `translateY(-2px)`.
  - Shadow: Elevation.
  - **Shine**: Similar sliding gradient shine effect as cards.
- **Active**: `scale(0.98)` or return to original Y position.
- **Disabled**: Reduced opacity (0.6), no cursor, no shine.

### Inputs (`.formInput`, `.enhancedInput`)
- **Focus**:
  - Transform: `translateY(-1px)`.
  - Shadow: Soft colored shadow (`rgba(55, 65, 81, 0.15)`).
  - Ring: Standard outline focus ring.
- **Error**: Red border and red-tinted shadow.

### Navigation Stepper (`.stepIndicator`, `.stepConnector`)
- **Indicator**: Radial gradient expansion on active state (`width: 0` -> `70px`).
- **Connector**: Linear gradient sliding effect (`left: -100%` -> `100%`) to show progress.

### Specialized Elements
- **`.categoryButton`**: Sliding gradient shine on hover.
- **`.nutritionBadge`**: `backdrop-filter: blur(10px)` with scale on hover.
- **`.featuredBadge`**: Gradient background with infinite pulse.
- **`.loading`**: Shimmering gradient background (Skeleton loader style).

## 7. Responsiveness & Layout
The design is mobile-first but includes specific optimizations for many breakpoints.

### Breakpoints
- **Mobile Portrait** (<480px): Compact padding, smaller fonts, stacked layouts.
- **Mobile Landscape** (480px - 639px): Slightly increased padding.
- **Tablet** (640px - 1024px): Grid layouts begin, moderate padding.
- **Desktop** (1024px - 1440px): Standard desktop spacing.
- **Large Desktop** (>1440px): Enhanced padding, larger buttons.
- **Extra Large** (>1920px): Max container width constraints (1600px).

### Touch Optimizations
Crucial for a dining app, touch interactions are specifically handled:
- Hover effects are **disabled** on coarse pointer devices.
- Tap highlight color is transparent.
- User selection is disabled on interactive elements to prevent accidental text selection.
- Active states (tap feedback) are explicitly defined.

## 8. Custom Utilities
- **`.scrollbar-hide`**: Hides scrollbars while maintaining scroll functionality.
- **`.line-clamp-3`**: Truncates text after 3 lines.
- **Video Controls**: All default video controls are aggressively hidden via CSS for a custom video player experience.

## 9. Implementation Guide
To reproduce this style:

1.  **Setup**: Install `tailwindcss-animate`, `clsx`, and `tailwind-merge`.
2.  **Config**: Add the OKLCH variables to your CSS root/layer base.
3.  **Animation**: Add the keyframes to your CSS or `tailwind.config.js`.
4.  **Components**: Wrap standard UI elements in the container classes (`.menuCard`, `.glassEffect`) to inherit the interactions.
5.  **Shine Effects**: Add `overflow-hidden relative` to containers and use the `::before` pseudo-element pattern with a transition on the `left` property for the sliding shine effect.

```css
/* Example Shine Pattern */
.shiny-element {
  position: relative;
  overflow: hidden;
}
.shiny-element::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s ease-out;
}
.shiny-element:hover::before {
  left: 100%;
}
```
