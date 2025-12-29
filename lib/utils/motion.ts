"use client"

/**
 * Motion utility functions for consistent, accessible animations
 * Respects user's prefers-reduced-motion setting
 */

export const shouldReduceMotion = (): boolean => {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export const motionConfig = {
  duration: shouldReduceMotion() ? 0 : 0.2,
  ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
}

// Standard animation variants for consistency across components
export const fadeInVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

export const scaleInVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
}

export const slideUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export const slideDownVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0 },
}

export const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: shouldReduceMotion() ? 0 : 0.05,
    },
  },
}

// Hover and tap interaction variants
export const hoverLiftVariants = {
  rest: { y: 0 },
  hover: { y: shouldReduceMotion() ? 0 : -2 },
}

export const tapScaleVariants = {
  tap: { scale: shouldReduceMotion() ? 1 : 0.97 },
}

export const buttonHoverVariants = {
  hover: { scale: shouldReduceMotion() ? 1 : 1.02 },
}

// Transition presets
export const fastTransition = {
  duration: shouldReduceMotion() ? 0 : 0.15,
  ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
}

export const mediumTransition = {
  duration: shouldReduceMotion() ? 0 : 0.2,
  ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
}

export const slowTransition = {
  duration: shouldReduceMotion() ? 0 : 0.3,
  ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
}
