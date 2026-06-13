import type { ReactNode } from 'react'
import { motion, type Transition, type TargetAndTransition } from 'framer-motion'
import type { BlockStyle, LoopAnimation } from '../../types/invitation.types'

// Continuous "idle" loop animations — distinct from the one-shot entry
// animations in AnimatedBlock. These never stop; they give a block a gentle
// (or playful) sense of life. Powered by framer-motion's keyframe `animate`
// with `repeat: Infinity`.

type Intensity = 'subtle' | 'normal' | 'strong'
type Speed = 'slow' | 'normal' | 'fast'

// Amplitude multiplier per intensity. Each preset multiplies its base values
// by this factor.
const INTENSITY_FACTOR: Record<Intensity, number> = {
  subtle: 0.55,
  normal: 1,
  strong: 1.7,
}

// Base cycle duration (seconds) per speed. Presets scale this.
const SPEED_DURATION: Record<Speed, number> = {
  slow: 1.55,
  normal: 1,
  fast: 0.62,
}

interface LoopSpec {
  animate: TargetAndTransition
  transition: Transition
}

function buildLoop(loop: Exclude<LoopAnimation, 'none'>, intensity: Intensity, speed: Speed): LoopSpec {
  const k = INTENSITY_FACTOR[intensity]
  const s = SPEED_DURATION[speed]
  const ease = 'easeInOut'

  switch (loop) {
    case 'float':
      return {
        animate: { y: [0, -10 * k, 0] },
        transition: { duration: 3 * s, repeat: Infinity, ease },
      }
    case 'float-x':
      return {
        animate: { x: [0, 10 * k, 0, -10 * k, 0] },
        transition: { duration: 4 * s, repeat: Infinity, ease },
      }
    case 'sway':
      return {
        animate: { rotate: [0, 3 * k, 0, -3 * k, 0] },
        transition: { duration: 4 * s, repeat: Infinity, ease },
      }
    case 'pulse':
      return {
        animate: { scale: [1, 1 + 0.06 * k, 1] },
        transition: { duration: 2.2 * s, repeat: Infinity, ease },
      }
    case 'heartbeat':
      return {
        animate: { scale: [1, 1 + 0.14 * k, 1, 1 + 0.1 * k, 1] },
        transition: { duration: 1.4 * s, repeat: Infinity, ease, times: [0, 0.14, 0.28, 0.42, 1] },
      }
    case 'spin':
      return {
        animate: { rotate: 360 },
        transition: { duration: 7 * s, repeat: Infinity, ease: 'linear' },
      }
    case 'wiggle':
      return {
        animate: { rotate: [0, 6 * k, -6 * k, 4 * k, -4 * k, 0] },
        transition: { duration: 1.6 * s, repeat: Infinity, ease },
      }
    case 'bounce':
      return {
        animate: { y: [0, -16 * k, 0] },
        transition: { duration: 1.3 * s, repeat: Infinity, ease: [0.5, 0.05, 0.5, 0.95] },
      }
    case 'tada':
      return {
        animate: { scale: [1, 0.95, 1.08 * Math.max(k, 0.8), 1], rotate: [0, -3 * k, 3 * k, 0] },
        transition: { duration: 2 * s, repeat: Infinity, repeatDelay: 1.2 * s, ease },
      }
    case 'breathe':
      return {
        animate: { scale: [1, 1 + 0.04 * k, 1], opacity: [1, 0.82, 1] },
        transition: { duration: 3.4 * s, repeat: Infinity, ease },
      }
    case 'shimmer':
      return {
        animate: { opacity: [1, 0.55, 1], filter: [`brightness(1)`, `brightness(${1 + 0.25 * k})`, `brightness(1)`] },
        transition: { duration: 2.6 * s, repeat: Infinity, ease },
      }
  }
}

// ── Catalog (UI metadata, grouped) ──────────────────────────────────────────
export interface LoopGroup {
  label: string
  options: { value: LoopAnimation; label: string }[]
}

export const LOOP_ANIMATION_GROUPS: LoopGroup[] = [
  {
    label: 'Sin movimiento',
    options: [{ value: 'none', label: 'Ninguno' }],
  },
  {
    label: 'Suave',
    options: [
      { value: 'float', label: 'Flotar ↕' },
      { value: 'float-x', label: 'Flotar ↔' },
      { value: 'sway', label: 'Balanceo' },
      { value: 'breathe', label: 'Respirar' },
      { value: 'pulse', label: 'Latido suave' },
    ],
  },
  {
    label: 'Llamativo',
    options: [
      { value: 'heartbeat', label: 'Corazón' },
      { value: 'bounce', label: 'Rebote' },
      { value: 'wiggle', label: 'Meneo' },
      { value: 'tada', label: 'Tada' },
      { value: 'spin', label: 'Girar' },
      { value: 'shimmer', label: 'Brillo' },
    ],
  },
]

export function MotionLoop({
  style,
  children,
}: {
  style?: BlockStyle
  children: ReactNode
}) {
  const loop = style?.loopAnimation
  if (!loop || loop === 'none') return <>{children}</>
  const spec = buildLoop(loop, style?.loopIntensity ?? 'normal', style?.loopSpeed ?? 'normal')
  return (
    <motion.div
      animate={spec.animate}
      transition={spec.transition}
      style={{ willChange: 'transform, opacity, filter', display: 'block', height: '100%' }}
    >
      {children}
    </motion.div>
  )
}
