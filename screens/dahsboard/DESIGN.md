---
name: Serene Guidance
colors:
  surface: '#f8f9ff'
  surface-dim: '#d0dbed'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e6eeff'
  surface-container-high: '#dee9fc'
  surface-container-highest: '#d9e3f6'
  on-surface: '#121c2a'
  on-surface-variant: '#404944'
  inverse-surface: '#27313f'
  inverse-on-surface: '#eaf1ff'
  outline: '#707974'
  outline-variant: '#bfc9c3'
  surface-tint: '#2b6954'
  primary: '#003527'
  on-primary: '#ffffff'
  primary-container: '#064e3b'
  on-primary-container: '#80bea6'
  inverse-primary: '#95d3ba'
  secondary: '#735c00'
  on-secondary: '#ffffff'
  secondary-container: '#fed65b'
  on-secondary-container: '#745c00'
  tertiary: '#2e2e2b'
  on-tertiary: '#ffffff'
  tertiary-container: '#454441'
  on-tertiary-container: '#b3b1ad'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b0f0d6'
  primary-fixed-dim: '#95d3ba'
  on-primary-fixed: '#002117'
  on-primary-fixed-variant: '#0b513d'
  secondary-fixed: '#ffe088'
  secondary-fixed-dim: '#e9c349'
  on-secondary-fixed: '#241a00'
  on-secondary-fixed-variant: '#574500'
  tertiary-fixed: '#e5e2dd'
  tertiary-fixed-dim: '#c9c6c2'
  on-tertiary-fixed: '#1c1c19'
  on-tertiary-fixed-variant: '#474743'
  background: '#f8f9ff'
  on-background: '#121c2a'
  surface-variant: '#d9e3f6'
typography:
  display-lg:
    fontFamily: Libre Caslon Text
    fontSize: 48px
    fontWeight: '400'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Libre Caslon Text
    fontSize: 32px
    fontWeight: '400'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Libre Caslon Text
    fontSize: 28px
    fontWeight: '400'
    lineHeight: 36px
  spiritual-text:
    fontFamily: Libre Caslon Text
    fontSize: 20px
    fontWeight: '400'
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
  label-md:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-margin: 24px
  gutter: 16px
  section-gap: 48px
---

## Brand & Style

The design system is centered on a "Modern Spiritualism" aesthetic. It evokes a sense of tranquility, reverence, and clarity, specifically tailored for a contemporary Islamic audience. The UI should feel like a digital sanctuary—a quiet space for reflection amidst the noise of the modern world.

The style is **Minimalist with Tactile accents**. It leverages heavy whitespace to allow the spiritual content to breathe, while utilizing subtle gold linework and high-quality serif typography to convey a premium, artisanal quality. The emotional goal is to move the user from a state of distraction to a state of *Sakina* (peaceful stillness).

## Colors

The palette is rooted in the natural and the noble. 
- **Emerald Green (Primary):** A deep, saturated green used for primary actions, focus states, and key navigational headers. It represents life and the tradition of Islamic art.
- **Sand (Tertiary):** A warm, soft neutral used for background surfaces. This replaces pure white to reduce eye strain and provide a "paper-like" warmth.
- **Gold (Secondary):** Used sparingly for accents, icons of significance, and active states. It provides a premium touch without being gaudy.
- **Charcoal (Neutral):** Used for primary text to ensure high contrast against the sand background while remaining softer than pure black.

## Typography

This design system employs a sophisticated typographic pairing to distinguish between functional UI and spiritual content.

- **Spiritual Content:** Use **Libre Caslon Text** for Quranic translations, Hadith, and reflective quotes. Its historical weight and elegant serifs command respect and slow down the reading pace for better comprehension.
- **Interface & Utilities:** Use **Manrope** for all functional elements like labels, buttons, and settings. Its modern, geometric construction provides the clarity and efficiency required for a seamless user experience.

## Layout & Spacing

The layout philosophy is **Fluid and Airy**. It avoids dense clusters of information, opting instead for a single-column focus where possible.

- **Grid:** A 12-column grid on desktop and a 4-column grid on mobile. 
- **Margins:** Generous 24px side margins on mobile to prevent content from feeling "trapped."
- **Rhythm:** Use an 8px base unit. Section spacing should be aggressive (48px+) to visually separate different themes of reflection or utility.
- **Alignment:** Center-alignment is preferred for spiritual quotes and "moment of the day" features to create a focal point of meditation.

## Elevation & Depth

Hierarchy is established through **Tonal Layering** and **Ambient Shadows**. 

1.  **Base Layer:** The Sand (`#F5F2ED`) background.
2.  **Surface Layer:** White (`#FFFFFF`) cards with very soft, diffused shadows (0px 4px 20px rgba(0,0,0,0.04)). This creates a "lifted" paper effect.
3.  **Active Elements:** Elements that require immediate attention use the Emerald Green with no shadow, relying on color contrast rather than depth.
4.  **Glassmorphism:** Use subtle backdrop blurs (10px) for bottom navigation bars and sticky headers to maintain a sense of context and vertical continuity.

## Shapes

The shape language is **Rounded and Organic**. 
- Standard UI components (buttons, input fields) use a 0.5rem (8px) radius.
- Large cards and feature containers use 1.5rem (24px) to feel soft and approachable.
- Icons should follow a "Line" style with rounded caps and joins, avoiding sharp 90-degree angles.

## Components

- **Buttons:** Primary buttons are solid Emerald Green with white Manrope text. Secondary buttons are outlined in Gold with a slight 1px stroke.
- **Cards:** White backgrounds with 24px padding. They should feature a "Gold accent line" (2px) at the very top or left edge to denote "Featured" or "Current" content.
- **Input Fields:** Minimalist design—only a bottom border in a light grey-green, which turns to solid Emerald when focused.
- **Chips:** Soft Sand backgrounds with Emerald text, used for categories like "Dua," "Gratitude," or "Prayer Times."
- **Lists:** High-density lists are avoided. Each list item should have a minimum height of 64px with ample horizontal padding.
- **Prayer Time Tracker:** A specialized component using a circular progress ring in Gold to indicate time remaining until the next prayer.
- **Progress Indicators:** Soft, thin horizontal lines in Gold to track reading progress through a Surah or a daily goal.