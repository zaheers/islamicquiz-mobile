---
name: Midnight Sanctuary
colors:
  surface: '#0a141f'
  surface-dim: '#0a141f'
  surface-bright: '#303a46'
  surface-container-lowest: '#050f1a'
  surface-container-low: '#131c28'
  surface-container: '#17202c'
  surface-container-high: '#212b37'
  surface-container-highest: '#2c3642'
  on-surface: '#d9e3f3'
  on-surface-variant: '#d0c5af'
  inverse-surface: '#d9e3f3'
  inverse-on-surface: '#27313d'
  outline: '#99907c'
  outline-variant: '#4d4635'
  surface-tint: '#e9c349'
  primary: '#f2ca50'
  on-primary: '#3c2f00'
  primary-container: '#d4af37'
  on-primary-container: '#554300'
  inverse-primary: '#735c00'
  secondary: '#68dbb3'
  on-secondary: '#003829'
  secondary-container: '#25a37f'
  on-secondary-container: '#003123'
  tertiary: '#a2d7ea'
  on-tertiary: '#003542'
  tertiary-container: '#87bbce'
  on-tertiary-container: '#0f4c5b'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffe088'
  primary-fixed-dim: '#e9c349'
  on-primary-fixed: '#241a00'
  on-primary-fixed-variant: '#574500'
  secondary-fixed: '#86f7ce'
  secondary-fixed-dim: '#68dbb3'
  on-secondary-fixed: '#002116'
  on-secondary-fixed-variant: '#00513d'
  tertiary-fixed: '#b6ebfe'
  tertiary-fixed-dim: '#9acee1'
  on-tertiary-fixed: '#001f28'
  on-tertiary-fixed-variant: '#124d5d'
  background: '#0a141f'
  on-background: '#d9e3f3'
  surface-variant: '#2c3642'
typography:
  display-lg:
    fontFamily: Libre Caslon Text
    fontSize: 42px
    fontWeight: '700'
    lineHeight: 52px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Libre Caslon Text
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Libre Caslon Text
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  headline-md:
    fontFamily: Libre Caslon Text
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
  body-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-caps:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.1em
  label-sm:
    fontFamily: Manrope
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-margin-mobile: 20px
  container-margin-desktop: 80px
  gutter: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style
The brand personality is serene, institutional, and profoundly premium. It targets an audience seeking a digital space for reflection and discipline, evoking an emotional response of "reverent focus."

The design style is a sophisticated blend of **Modern Glassmorphism** and **Editorial Elegance**. It utilizes deep, atmospheric depth through gradients to simulate a night sky, contrasted with sharp, high-fidelity typography and shimmering accents. The UI feels like a high-end physical artifact—tactile yet ethereal—achieved through translucent layers, microscopic borders, and a rigorous adherence to classical proportions.

## Colors
The palette is rooted in a "Midnight" foundation, using a deep navy (`#08121D`) as the base canvas. 

- **Primary (Gold/Champagne):** Used sparingly for high-level branding, active states, and ornamentation to signify value and sacredness.
- **Secondary (Forest Green):** Reserved exclusively for progression, success states, and growth indicators. It should have high luminosity to pop against the dark backgrounds.
- **Tertiary (Teal):** Used for structural gradients and secondary interactive elements, bridging the gap between the background and the content.
- **Atmospheric Gradients:** Backgrounds should utilize radial gradients transitioning from `#133E54` (Teal-Navy) to `#08121D` (Deep Navy) to create a sense of infinite depth.

## Typography
This design system employs a dual-font strategy to balance tradition with utility. **Libre Caslon Text** is used for all "Editorial" moments—headers, titles, and quote blocks—to provide an authoritative and timeless feel.

**Manrope** serves as the functional workhorse. Its modern, geometric construction ensures legibility for data-heavy sections, progress stats, and navigation labels. 

Capitalization is a key stylistic tool: use `label-caps` for secondary headers above main titles to create an institutional hierarchy. Ensure a minimum 1.5x line-height for serif body text to maintain an airy, premium reading experience.

## Layout & Spacing
The layout uses a **fluid grid** model with generous safe areas to maintain a "sanctuary" feel—never crowded, always intentional.

- **Mobile:** 4-column grid with 20px outside margins.
- **Desktop:** 12-column grid with a max-width of 1200px, centered.
- **Rhythm:** An 8px baseline grid governs all vertical spacing. Components should prefer `stack-lg` (32px) separation for major sections to allow the background gradients to "breathe."

Elements should reflow into single-column stacks on mobile, with cards expanding to full width minus the container margins.

## Elevation & Depth
Depth is conveyed through **Tonal Layers** and **Glassmorphism** rather than traditional drop shadows.

1.  **Base Layer:** The deepest navy gradient.
2.  **Surface Layer:** Semi-transparent navy (`rgba(11, 21, 38, 0.6)`) with a 12px backdrop blur and a `0.5px` inner border of teal or champagne at 20% opacity.
3.  **Accent Layer:** Elements that need to pop (like the active "Home" button) use a solid fill of the secondary green or tertiary teal, with a subtle outer glow of the same color (spread: 10px, opacity: 0.15) to simulate light emission.

Avoid heavy black shadows; instead, use slightly darker or more saturated versions of the background color for "depth" shadows.

## Shapes
The shape language is "Soft-Modern." Use **Level 2** roundedness (0.5rem base) for most UI elements to feel approachable and organic. 

- **Cards & Primary Containers:** Use `rounded-lg` (1rem) to create a clear container-within-container hierarchy.
- **Icons:** Should be housed within rounded squares or circles with a subtle 1px stroke.
- **Ornamentation:** Incorporate subtle geometric patterns (e.g., Islamic geometric patterns or thin-line flourishes) at extremely low opacity (3-5%) as background fills for large containers.

## Components
- **Buttons:** Primary buttons use a solid Forest Green fill with white or very dark navy text. Secondary buttons are "Ghost" style—transparent with a 1px Champagne border and Serif type.
- **Progress Indicators:** Use circular rings with a "glow" effect. The track should be a dark teal, and the active progress should be Forest Green with a slight outer bloom.
- **Cards:** Must feature the backdrop blur effect. Titles within cards should use the Serif font, while the data/labels use the Sans font.
- **Navigation (Bottom Bar):** A translucent dark glass pane with gold indicators for the active state. Icons should be thin-stroke (1.5px) and paired with `label-sm` text.
- **Selection Chips:** Use a pill shape (`rounded-xl`). The active state is signaled by a Teal background and a 1px border.
- **Input Fields:** Darker than the surface layer, with an inset shadow and a Champagne focus border.