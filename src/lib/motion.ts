/**
 * Mindmaker Control - Motion Standards
 * 
 * Motion has one job: Confirm orientation.
 * No bounce. No springy nonsense. Everything feels inevitable.
 */

import { Transition, Variants } from 'framer-motion';

// ==========================================
// TRANSITIONS - All under 200ms
// ==========================================

export const transitions = {
  /** Default transition for most elements */
  default: {
    duration: 0.2,
    ease: [0.4, 0, 0.2, 1], // Material-like easing
  } as Transition,

  /** Fast transition for micro-interactions */
  fast: {
    duration: 0.15,
    ease: 'easeOut',
  } as Transition,

  /** Mic button state changes */
  mic: {
    duration: 0.15,
    ease: 'easeOut',
  } as Transition,

  /** Card focus/hover */
  card: {
    duration: 0.2,
    ease: [0.4, 0, 0.2, 1],
  } as Transition,

  /** Content fade in */
  fadeIn: {
    duration: 0.2,
    ease: 'easeOut',
  } as Transition,
};

// ==========================================
// VARIANTS - Reusable animation states
// ==========================================

export const variants = {
  /** Card lift on focus/interaction */
  cardFocus: {
    initial: { y: 0 },
    hover: { y: -4 },
    tap: { y: -2 },
  } as Variants,

  /** Mic button active state - subtle expansion */
  micActive: {
    inactive: { scale: 1 },
    active: { scale: 1.05 },
    recording: { scale: 1.08 },
  } as Variants,

  /** Content appearing - subtle fade from 98% */
  insightFadeIn: {
    initial: { opacity: 0.9, scale: 0.98 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.98 },
  } as Variants,

  /** Response card appearing */
  responseCard: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -4 },
  } as Variants,

  /** Staggered list items */
  listItem: {
    initial: { opacity: 0, x: -8 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 8 },
  } as Variants,

  /** Page transitions */
  page: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  } as Variants,
};

// ==========================================
// STAGGER CHILDREN CONFIG
// ==========================================

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
} as Variants;

// ==========================================
// COMMON ANIMATION PROPS
// ==========================================

/** Standard fade-in animation props */
export const fadeInProps = {
  initial: 'initial',
  animate: 'animate',
  exit: 'exit',
  variants: variants.insightFadeIn,
  transition: transitions.fadeIn,
};

/** Card hover animation props */
export const cardHoverProps = {
  whileHover: 'hover',
  whileTap: 'tap',
  variants: variants.cardFocus,
  transition: transitions.card,
};

/** Mic button animation props */
export const micButtonProps = {
  variants: variants.micActive,
  transition: transitions.mic,
};

// ==========================================
// PREMIUM DESIGN SYSTEM VARIANTS
// ==========================================

export const premiumVariants = {
  /** Premium button with slide-in background */
  buttonSlide: {
    initial: { 
      backgroundPosition: '-100% 0',
    },
    hover: { 
      backgroundPosition: '0% 0',
    },
    tap: { 
      scale: 0.98,
    },
  } as Variants,

  /** Card with glowing border effect */
  cardGlow: {
    initial: { 
      boxShadow: '0 0 0 rgba(61, 139, 110, 0)',
      borderColor: 'rgba(61, 139, 110, 0.2)',
    },
    hover: { 
      boxShadow: '0 0 30px rgba(61, 139, 110, 0.15)',
      borderColor: 'rgba(61, 139, 110, 0.5)',
      y: -2,
    },
    tap: { 
      y: -1,
    },
  } as Variants,

  /** Mic orb with pulsing border */
  micOrbPulse: {
    idle: { 
      scale: 1,
      boxShadow: '0 0 0 0 rgba(61, 139, 110, 0.4)',
    },
    hover: { 
      scale: 1.02,
      boxShadow: '0 0 20px 4px rgba(61, 139, 110, 0.3)',
    },
    recording: { 
      scale: 1.05,
      boxShadow: [
        '0 0 0 0 rgba(61, 139, 110, 0.6)',
        '0 0 30px 10px rgba(61, 139, 110, 0.3)',
        '0 0 0 0 rgba(61, 139, 110, 0.6)',
      ],
      transition: {
        boxShadow: {
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      },
    },
  } as Variants,

  /** Border shimmer effect */
  borderShimmer: {
    initial: { 
      opacity: 0,
    },
    animate: { 
      opacity: [0, 0.5, 0],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  } as Variants,

  /** Subtle glow pulse for buttons */
  glowPulse: {
    initial: {
      boxShadow: '0 0 0 rgba(61, 139, 110, 0)',
    },
    animate: {
      boxShadow: [
        '0 0 10px rgba(61, 139, 110, 0.2)',
        '0 0 20px rgba(61, 139, 110, 0.4)',
        '0 0 10px rgba(61, 139, 110, 0.2)',
      ],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  } as Variants,
};

// ==========================================
// PREMIUM ANIMATION PROPS
// ==========================================

/** Premium button with slide effect */
export const premiumButtonProps = {
  variants: premiumVariants.buttonSlide,
  initial: 'initial',
  whileHover: 'hover',
  whileTap: 'tap',
  transition: {
    duration: 0.3,
    ease: [0.4, 0, 0.2, 1],
  },
};

/** Premium card with glow effect */
export const premiumCardProps = {
  variants: premiumVariants.cardGlow,
  initial: 'initial',
  whileHover: 'hover',
  whileTap: 'tap',
  transition: transitions.card,
};

/** Mic orb with pulse animation */
export const micOrbProps = {
  variants: premiumVariants.micOrbPulse,
  initial: 'idle',
  whileHover: 'hover',
  transition: transitions.mic,
};
