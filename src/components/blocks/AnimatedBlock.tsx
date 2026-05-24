import type { ReactNode } from 'react'
import { motion, type Transition, type Variants } from 'framer-motion'
import type { EntryAnimation } from '../../types/invitation.types'

// Single source of truth for entry animations.
// Each entry holds:
//   - variants: framer-motion `hidden` and `show` states
//   - transition (optional override): tween/spring config; default is a smooth easeOutQuint
const DEFAULT_TRANSITION: Transition = { duration: 0.9, ease: [0.22, 1, 0.36, 1] }

const SPRING_BOUNCE: Transition = { type: 'spring', stiffness: 280, damping: 14, mass: 0.9 }
const SPRING_ELASTIC: Transition = { type: 'spring', stiffness: 200, damping: 9, mass: 1 }
const SPRING_GENTLE: Transition = { type: 'spring', stiffness: 110, damping: 18 }
const SLOW_REVEAL: Transition = { duration: 1.25, ease: [0.65, 0, 0.35, 1] }

type Anim = { variants: Variants; transition?: Transition }

const ANIM_MAP: Record<Exclude<EntryAnimation, 'none'>, Anim> = {
  // ── Fade ────────────────────────────────────────────────────────────────
  fade: { variants: { hidden: { opacity: 0 }, show: { opacity: 1 } } },
  'fade-up': { variants: { hidden: { opacity: 0, y: 40 }, show: { opacity: 1, y: 0 } } },
  'fade-down': { variants: { hidden: { opacity: 0, y: -40 }, show: { opacity: 1, y: 0 } } },
  'fade-left': { variants: { hidden: { opacity: 0, x: -60 }, show: { opacity: 1, x: 0 } } },
  'fade-right': { variants: { hidden: { opacity: 0, x: 60 }, show: { opacity: 1, x: 0 } } },
  'fade-up-big': { variants: { hidden: { opacity: 0, y: 140 }, show: { opacity: 1, y: 0 } } },
  'fade-down-big': { variants: { hidden: { opacity: 0, y: -140 }, show: { opacity: 1, y: 0 } } },

  // ── Slide (no fade — full opacity) ──────────────────────────────────────
  'slide-up': { variants: { hidden: { y: 120 }, show: { y: 0 } } },
  'slide-down': { variants: { hidden: { y: -120 }, show: { y: 0 } } },
  'slide-left': { variants: { hidden: { x: -200 }, show: { x: 0 } } },
  'slide-right': { variants: { hidden: { x: 200 }, show: { x: 0 } } },

  // ── Zoom / Scale ────────────────────────────────────────────────────────
  'zoom-in': { variants: { hidden: { opacity: 0, scale: 0.85 }, show: { opacity: 1, scale: 1 } } },
  'zoom-out': { variants: { hidden: { opacity: 0, scale: 1.15 }, show: { opacity: 1, scale: 1 } } },
  'zoom-in-up': {
    variants: { hidden: { opacity: 0, scale: 0.5, y: 80 }, show: { opacity: 1, scale: 1, y: 0 } },
  },
  'zoom-in-down': {
    variants: { hidden: { opacity: 0, scale: 0.5, y: -80 }, show: { opacity: 1, scale: 1, y: 0 } },
  },
  'zoom-in-left': {
    variants: { hidden: { opacity: 0, scale: 0.5, x: -120 }, show: { opacity: 1, scale: 1, x: 0 } },
  },
  'zoom-in-right': {
    variants: { hidden: { opacity: 0, scale: 0.5, x: 120 }, show: { opacity: 1, scale: 1, x: 0 } },
  },

  // ── Blur ────────────────────────────────────────────────────────────────
  'blur-in': {
    variants: {
      hidden: { opacity: 0, filter: 'blur(18px)', scale: 1.03 },
      show: { opacity: 1, filter: 'blur(0px)', scale: 1 },
    },
  },
  'blur-up': {
    variants: {
      hidden: { opacity: 0, filter: 'blur(14px)', y: 40 },
      show: { opacity: 1, filter: 'blur(0px)', y: 0 },
    },
  },
  'blur-zoom': {
    variants: {
      hidden: { opacity: 0, filter: 'blur(22px)', scale: 1.3 },
      show: { opacity: 1, filter: 'blur(0px)', scale: 1 },
    },
    transition: SLOW_REVEAL,
  },

  // ── Flip / 3D ───────────────────────────────────────────────────────────
  'flip-up': {
    variants: {
      hidden: { opacity: 0, rotateX: -75, transformPerspective: 800 },
      show: { opacity: 1, rotateX: 0, transformPerspective: 800 },
    },
  },
  'flip-down': {
    variants: {
      hidden: { opacity: 0, rotateX: 75, transformPerspective: 800 },
      show: { opacity: 1, rotateX: 0, transformPerspective: 800 },
    },
  },
  'flip-left': {
    variants: {
      hidden: { opacity: 0, rotateY: -75, transformPerspective: 800 },
      show: { opacity: 1, rotateY: 0, transformPerspective: 800 },
    },
  },
  'flip-right': {
    variants: {
      hidden: { opacity: 0, rotateY: 75, transformPerspective: 800 },
      show: { opacity: 1, rotateY: 0, transformPerspective: 800 },
    },
  },

  // ── Rotate ──────────────────────────────────────────────────────────────
  'rotate-in': {
    variants: {
      hidden: { opacity: 0, rotate: -8, scale: 0.92 },
      show: { opacity: 1, rotate: 0, scale: 1 },
    },
  },
  'rotate-in-up-left': {
    variants: {
      hidden: { opacity: 0, rotate: -45, x: -80, y: 60, transformOrigin: 'left bottom' },
      show: { opacity: 1, rotate: 0, x: 0, y: 0, transformOrigin: 'left bottom' },
    },
  },
  'rotate-in-up-right': {
    variants: {
      hidden: { opacity: 0, rotate: 45, x: 80, y: 60, transformOrigin: 'right bottom' },
      show: { opacity: 1, rotate: 0, x: 0, y: 0, transformOrigin: 'right bottom' },
    },
  },
  'rotate-in-down-left': {
    variants: {
      hidden: { opacity: 0, rotate: 45, x: -80, y: -60, transformOrigin: 'left top' },
      show: { opacity: 1, rotate: 0, x: 0, y: 0, transformOrigin: 'left top' },
    },
  },
  'rotate-in-down-right': {
    variants: {
      hidden: { opacity: 0, rotate: -45, x: 80, y: -60, transformOrigin: 'right top' },
      show: { opacity: 1, rotate: 0, x: 0, y: 0, transformOrigin: 'right top' },
    },
  },
  swing: {
    variants: {
      hidden: { opacity: 0, rotate: -25, transformOrigin: 'top center' },
      show: { opacity: 1, rotate: 0, transformOrigin: 'top center' },
    },
    transition: SPRING_BOUNCE,
  },

  // ── Bounce / Spring ─────────────────────────────────────────────────────
  'bounce-in': {
    variants: { hidden: { opacity: 0, scale: 0.3 }, show: { opacity: 1, scale: 1 } },
    transition: SPRING_BOUNCE,
  },
  'bounce-in-up': {
    variants: { hidden: { opacity: 0, y: 120 }, show: { opacity: 1, y: 0 } },
    transition: SPRING_BOUNCE,
  },
  'bounce-in-down': {
    variants: { hidden: { opacity: 0, y: -120 }, show: { opacity: 1, y: 0 } },
    transition: SPRING_BOUNCE,
  },
  'elastic-in': {
    variants: { hidden: { opacity: 0, scale: 0 }, show: { opacity: 1, scale: 1 } },
    transition: SPRING_ELASTIC,
  },
  jelly: {
    variants: {
      hidden: { opacity: 0, scaleX: 1.4, scaleY: 0.6 },
      show: { opacity: 1, scaleX: 1, scaleY: 1 },
    },
    transition: SPRING_ELASTIC,
  },

  // ── Special / Cinematic ─────────────────────────────────────────────────
  'reveal-up': {
    variants: {
      hidden: { opacity: 0, y: 80, clipPath: 'inset(100% 0 0 0)' },
      show: { opacity: 1, y: 0, clipPath: 'inset(0% 0 0 0)' },
    },
    transition: SLOW_REVEAL,
  },
  'reveal-down': {
    variants: {
      hidden: { opacity: 0, clipPath: 'inset(0 0 100% 0)' },
      show: { opacity: 1, clipPath: 'inset(0 0 0% 0)' },
    },
    transition: SLOW_REVEAL,
  },
  'reveal-left': {
    variants: {
      hidden: { opacity: 0, clipPath: 'inset(0 100% 0 0)' },
      show: { opacity: 1, clipPath: 'inset(0 0% 0 0)' },
    },
    transition: SLOW_REVEAL,
  },
  'reveal-right': {
    variants: {
      hidden: { opacity: 0, clipPath: 'inset(0 0 0 100%)' },
      show: { opacity: 1, clipPath: 'inset(0 0 0 0%)' },
    },
    transition: SLOW_REVEAL,
  },
  'skew-in': {
    variants: {
      hidden: { opacity: 0, skewX: 12, x: -60 },
      show: { opacity: 1, skewX: 0, x: 0 },
    },
  },
  'depth-in': {
    variants: {
      hidden: { opacity: 0, scale: 0.4, transformPerspective: 1200, z: -300 },
      show: { opacity: 1, scale: 1, transformPerspective: 1200, z: 0 },
    },
    transition: SPRING_GENTLE,
  },
  'roll-in': {
    variants: {
      hidden: { opacity: 0, rotate: -180, x: -120 },
      show: { opacity: 1, rotate: 0, x: 0 },
    },
  },
}

// ── Catalog (UI metadata, grouped) ──────────────────────────────────────────
export interface AnimGroup {
  label: string
  options: { value: EntryAnimation; label: string }[]
}

export const ENTRY_ANIMATION_GROUPS: AnimGroup[] = [
  {
    label: 'Sin animación',
    options: [{ value: 'none', label: 'Ninguna' }],
  },
  {
    label: 'Fundido',
    options: [
      { value: 'fade', label: 'Fundido' },
      { value: 'fade-up', label: 'Fundido desde abajo' },
      { value: 'fade-down', label: 'Fundido desde arriba' },
      { value: 'fade-left', label: 'Fundido desde izquierda' },
      { value: 'fade-right', label: 'Fundido desde derecha' },
      { value: 'fade-up-big', label: 'Fundido grande ↑' },
      { value: 'fade-down-big', label: 'Fundido grande ↓' },
    ],
  },
  {
    label: 'Deslizar',
    options: [
      { value: 'slide-up', label: 'Deslizar desde abajo' },
      { value: 'slide-down', label: 'Deslizar desde arriba' },
      { value: 'slide-left', label: 'Deslizar desde izquierda' },
      { value: 'slide-right', label: 'Deslizar desde derecha' },
    ],
  },
  {
    label: 'Zoom',
    options: [
      { value: 'zoom-in', label: 'Zoom in' },
      { value: 'zoom-out', label: 'Zoom out' },
      { value: 'zoom-in-up', label: 'Zoom in desde abajo' },
      { value: 'zoom-in-down', label: 'Zoom in desde arriba' },
      { value: 'zoom-in-left', label: 'Zoom in desde izquierda' },
      { value: 'zoom-in-right', label: 'Zoom in desde derecha' },
    ],
  },
  {
    label: 'Blur (desenfoque)',
    options: [
      { value: 'blur-in', label: 'Blur in' },
      { value: 'blur-up', label: 'Blur + sube' },
      { value: 'blur-zoom', label: 'Blur + zoom (cinemático)' },
    ],
  },
  {
    label: 'Flip 3D',
    options: [
      { value: 'flip-up', label: 'Flip arriba' },
      { value: 'flip-down', label: 'Flip abajo' },
      { value: 'flip-left', label: 'Flip izquierda' },
      { value: 'flip-right', label: 'Flip derecha' },
    ],
  },
  {
    label: 'Rotación',
    options: [
      { value: 'rotate-in', label: 'Rotación sutil' },
      { value: 'rotate-in-up-left', label: 'Rotar desde ↙' },
      { value: 'rotate-in-up-right', label: 'Rotar desde ↘' },
      { value: 'rotate-in-down-left', label: 'Rotar desde ↖' },
      { value: 'rotate-in-down-right', label: 'Rotar desde ↗' },
      { value: 'swing', label: 'Swing colgante' },
      { value: 'roll-in', label: 'Roll in (rueda)' },
    ],
  },
  {
    label: 'Spring / Rebote',
    options: [
      { value: 'bounce-in', label: 'Bounce in' },
      { value: 'bounce-in-up', label: 'Bounce desde abajo' },
      { value: 'bounce-in-down', label: 'Bounce desde arriba' },
      { value: 'elastic-in', label: 'Elástica' },
      { value: 'jelly', label: 'Jelly (gelatina)' },
    ],
  },
  {
    label: 'Cinemático / Especial',
    options: [
      { value: 'reveal-up', label: 'Cortina ↑' },
      { value: 'reveal-down', label: 'Cortina ↓' },
      { value: 'reveal-left', label: 'Cortina ←' },
      { value: 'reveal-right', label: 'Cortina →' },
      { value: 'skew-in', label: 'Skew (diagonal)' },
      { value: 'depth-in', label: 'Profundidad 3D' },
    ],
  },
]

export function AnimatedBlock({
  animation,
  children,
}: {
  animation?: EntryAnimation
  children: ReactNode
}) {
  if (!animation || animation === 'none') return <>{children}</>
  const entry = ANIM_MAP[animation]
  if (!entry) return <>{children}</>
  return (
    <motion.div
      key={animation}
      variants={entry.variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: false, amount: 0.2, margin: '0px 0px -10% 0px' }}
      transition={entry.transition ?? DEFAULT_TRANSITION}
      style={{ willChange: 'transform, opacity, filter' }}
    >
      {children}
    </motion.div>
  )
}
