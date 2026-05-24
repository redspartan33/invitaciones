import type { ReactNode } from 'react'
import { motion, type Variants } from 'framer-motion'
import type { EntryAnimation } from '../../types/invitation.types'

const VARIANTS: Record<Exclude<EntryAnimation, 'none'>, Variants> = {
  fade: {
    hidden: { opacity: 0 },
    show: { opacity: 1 },
  },
  'fade-up': {
    hidden: { opacity: 0, y: 40 },
    show: { opacity: 1, y: 0 },
  },
  'fade-down': {
    hidden: { opacity: 0, y: -40 },
    show: { opacity: 1, y: 0 },
  },
  'fade-left': {
    hidden: { opacity: 0, x: -60 },
    show: { opacity: 1, x: 0 },
  },
  'fade-right': {
    hidden: { opacity: 0, x: 60 },
    show: { opacity: 1, x: 0 },
  },
  'zoom-in': {
    hidden: { opacity: 0, scale: 0.85 },
    show: { opacity: 1, scale: 1 },
  },
  'zoom-out': {
    hidden: { opacity: 0, scale: 1.15 },
    show: { opacity: 1, scale: 1 },
  },
  'blur-in': {
    hidden: { opacity: 0, filter: 'blur(18px)', scale: 1.03 },
    show: { opacity: 1, filter: 'blur(0px)', scale: 1 },
  },
  'flip-up': {
    hidden: { opacity: 0, rotateX: -75, transformPerspective: 800 },
    show: { opacity: 1, rotateX: 0, transformPerspective: 800 },
  },
  'rotate-in': {
    hidden: { opacity: 0, rotate: -8, scale: 0.92 },
    show: { opacity: 1, rotate: 0, scale: 1 },
  },
  'reveal-up': {
    hidden: { opacity: 0, y: 80, clipPath: 'inset(100% 0 0 0)' },
    show: { opacity: 1, y: 0, clipPath: 'inset(0% 0 0 0)' },
  },
}

export const ENTRY_ANIMATIONS: { value: EntryAnimation; label: string }[] = [
  { value: 'none', label: 'Ninguna' },
  { value: 'fade', label: 'Fundido' },
  { value: 'fade-up', label: 'Fundido ↑' },
  { value: 'fade-down', label: 'Fundido ↓' },
  { value: 'fade-left', label: 'Fundido ←' },
  { value: 'fade-right', label: 'Fundido →' },
  { value: 'zoom-in', label: 'Zoom in' },
  { value: 'zoom-out', label: 'Zoom out' },
  { value: 'blur-in', label: 'Blur in' },
  { value: 'flip-up', label: 'Flip' },
  { value: 'rotate-in', label: 'Rotación' },
  { value: 'reveal-up', label: 'Cortina' },
]

export function AnimatedBlock({
  animation,
  children,
}: {
  animation?: EntryAnimation
  children: ReactNode
}) {
  if (!animation || animation === 'none') return <>{children}</>
  const variants = VARIANTS[animation]
  return (
    <motion.div
      // key on the animation name so swapping it in the editor replays instantly
      key={animation}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: false, amount: 0.2, margin: '0px 0px -10% 0px' }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      style={{ willChange: 'transform, opacity, filter' }}
    >
      {children}
    </motion.div>
  )
}
