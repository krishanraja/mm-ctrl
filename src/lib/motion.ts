// src/lib/motion.ts
import { Variants, Transition } from 'framer-motion'

// Transitions
export const transitions = {
  fast: { duration: 0.15, ease: [0.4, 0, 0.2, 1] } as Transition,
  normal: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } as Transition,
  slow: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } as Transition,
  spring: { type: 'spring', stiffness: 400, damping: 30, mass: 0.8 } as Transition,
  springGentle: { type: 'spring', stiffness: 300, damping: 25, mass: 1 } as Transition,
}

// Variants
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

export const slideUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
}

export const slideDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 10 },
}

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
}

export const cardEntrance: Variants = {
  initial: { opacity: 0, y: 30, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -15, scale: 0.97 },
}

// Stagger containers
export const staggerContainer: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

export const staggerContainerFast: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
}

// Helper props for components
export const fadeInProps = {
  variants: fadeIn,
  initial: "initial",
  animate: "animate",
  exit: "exit",
  transition: transitions.normal,
}

export const slideUpProps = {
  variants: slideUp,
  initial: "initial",
  animate: "animate",
  exit: "exit",
  transition: transitions.normal,
}

export const cardEntranceProps = {
  variants: cardEntrance,
  initial: "initial",
  animate: "animate",
  exit: "exit",
  transition: transitions.spring,
}
