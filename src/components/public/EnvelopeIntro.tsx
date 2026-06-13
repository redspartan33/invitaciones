import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion, type Easing, type TargetAndTransition, type Transition } from 'framer-motion'
import type {
  EnvelopeIntroConfig,
  HeroData,
  Invitation,
  InvitationBlock,
} from '../../types/invitation.types'
import { formatDate } from '../../utils/blockValidation'

const EASE_SMOOTH: Easing = [0.22, 1, 0.36, 1]
const EASE_FLAP: Easing = [0.7, 0, 0.84, 0]

type OpenAnimation = NonNullable<EnvelopeIntroConfig['openAnimation']>
type ParticleEffect = NonNullable<EnvelopeIntroConfig['particleEffect']>
type TransitionStyle = NonNullable<EnvelopeIntroConfig['transition']>

// How the whole overlay clears once the envelope has opened — the "fancy"
// handoff to the real invitation. The flap-open + card choreography is shared;
// the chosen `transition` decides how the overlay clears to reveal the page
// underneath. `dur()` lets the user override the per-style default duration.
const overlayExit = (style: TransitionStyle, dur?: number): { exit: TargetAndTransition; transition: Transition } => {
  const d = dur && dur > 0 ? dur : undefined
  switch (style) {
    case 'zoom':
      return { exit: { opacity: 0, scale: 1.8, rotate: 1.5 }, transition: { duration: d ?? 0.7, ease: EASE_SMOOTH } }
    case 'iris':
      // Circular reveal: the overlay clips down to a shrinking circle so the
      // invitation appears through an expanding "iris" hole.
      return { exit: { opacity: 0, clipPath: 'circle(0% at 50% 50%)' }, transition: { duration: d ?? 0.75, ease: EASE_SMOOTH } }
    case 'curtain':
      return { exit: { opacity: 0, clipPath: 'inset(0 50% 0 50%)' }, transition: { duration: d ?? 0.65, ease: EASE_FLAP } }
    case 'slide-up':
      return { exit: { opacity: 0, y: '-100%' }, transition: { duration: d ?? 0.7, ease: EASE_SMOOTH } }
    case 'dissolve':
      return { exit: { opacity: 0, filter: 'blur(26px) brightness(1.4)', scale: 1.08 }, transition: { duration: d ?? 0.8, ease: EASE_SMOOTH } }
    case 'fade':
    default:
      return { exit: { opacity: 0, scale: 1.03 }, transition: { duration: d ?? 0.6, ease: EASE_SMOOTH } }
  }
}

// Legacy `openAnimation` mixed the particle effect and the exit transition into
// one selector. Derive the new decoupled pair from it when the new fields are
// absent, so existing invitations keep working unchanged.
function resolveLegacy(openAnimation?: OpenAnimation): { effect: ParticleEffect; transition: TransitionStyle } {
  switch (openAnimation) {
    case 'zoom-burst':
      return { effect: 'none', transition: 'zoom' }
    case 'curtain':
      return { effect: 'none', transition: 'curtain' }
    case 'dissolve':
      return { effect: 'none', transition: 'dissolve' }
    case 'sparkle':
      return { effect: 'sparkle', transition: 'fade' }
    case 'petals':
      return { effect: 'petals', transition: 'fade' }
    case 'confetti':
      return { effect: 'confetti', transition: 'fade' }
    case 'classic':
    default:
      return { effect: 'none', transition: 'fade' }
  }
}

// Deterministic particle seeds so the layers don't reshuffle each render.
const SPARKLES = Array.from({ length: 26 }, (_, i) => ({
  left: (i * 61) % 100,
  top: (i * 37 + 8) % 100,
  delay: (i % 9) * 0.18,
  size: 5 + (i % 5) * 5,
  spin: i % 2 === 0 ? 180 : -180,
}))
const PETALS = Array.from({ length: 20 }, (_, i) => ({
  left: (i * 53 + 5) % 100,
  delay: (i % 8) * 0.45,
  duration: 4 + (i % 6),
  drift: ((i % 7) - 3) * 26,
  size: 12 + (i % 5) * 6,
  sway: ((i % 3) + 1) * 18,
  hue: [340, 350, 20, 45, 300][i % 5],
}))
const CONFETTI = Array.from({ length: 40 }, (_, i) => ({
  left: (i * 37 + 3) % 100,
  delay: (i % 10) * 0.18,
  duration: 3 + (i % 5) * 0.6,
  drift: ((i % 9) - 4) * 24,
  w: 6 + (i % 3) * 3,
  h: 9 + (i % 4) * 4,
  spin: (i % 2 === 0 ? 1 : -1) * (360 + (i % 3) * 180),
  hue: [350, 45, 140, 200, 280, 20][i % 6],
}))
const RAIN = Array.from({ length: 60 }, (_, i) => ({
  left: (i * 17 + 2) % 100,
  delay: (i % 12) * 0.12,
  duration: 0.7 + (i % 5) * 0.18,
  len: 16 + (i % 4) * 8,
  drift: 6 + (i % 3) * 4,
}))
const LEAVES = Array.from({ length: 22 }, (_, i) => ({
  top: (i * 41) % 100,
  delay: (i % 9) * 0.5,
  duration: 5 + (i % 6),
  size: 16 + (i % 5) * 7,
  sway: ((i % 3) + 1) * 30,
  spin: (i % 2 === 0 ? 1 : -1) * (180 + (i % 4) * 120),
  hue: [28, 38, 14, 95, 48][i % 5],
}))
const BOKEH = Array.from({ length: 18 }, (_, i) => ({
  left: (i * 53 + 7) % 100,
  delay: (i % 7) * 0.8,
  duration: 7 + (i % 6) * 1.2,
  size: 36 + (i % 6) * 26,
  drift: ((i % 5) - 2) * 30,
  maxOpacity: 0.18 + (i % 4) * 0.12,
  hue: [45, 35, 320, 200, 280][i % 5],
}))
const FIREFLIES = Array.from({ length: 24 }, (_, i) => ({
  left: (i * 43 + 5) % 100,
  top: (i * 29 + 11) % 100,
  delay: (i % 10) * 0.4,
  duration: 3 + (i % 5) * 0.9,
  size: 5 + (i % 4) * 3,
  wanderX: ((i % 5) - 2) * 26,
  wanderY: ((i % 4) - 2) * 24,
}))
const BUBBLES = Array.from({ length: 26 }, (_, i) => ({
  left: (i * 31 + 4) % 100,
  delay: (i % 9) * 0.45,
  duration: 5 + (i % 6) * 0.9,
  size: 12 + (i % 6) * 9,
  sway: ((i % 3) + 1) * 16,
}))
const HEARTS = Array.from({ length: 22 }, (_, i) => ({
  left: (i * 47 + 6) % 100,
  delay: (i % 9) * 0.5,
  duration: 5 + (i % 5),
  size: 16 + (i % 5) * 8,
  sway: ((i % 3) + 1) * 22,
  hue: [340, 350, 0, 320, 12][i % 5],
}))
const SNOW = Array.from({ length: 50 }, (_, i) => ({
  left: (i * 23 + 3) % 100,
  delay: (i % 12) * 0.5,
  duration: 6 + (i % 7),
  size: 4 + (i % 5) * 4,
  sway: ((i % 4) + 1) * 14,
  blur: i % 3 === 0 ? 1.5 : 0,
}))
const SHOOTERS = Array.from({ length: 14 }, (_, i) => ({
  left: (i * 67 + 5) % 90,
  top: (i * 19) % 60,
  delay: (i % 7) * 0.9 + (i % 3) * 0.3,
  duration: 0.9 + (i % 4) * 0.25,
  len: 90 + (i % 5) * 40,
  travel: 120 + (i % 4) * 60,
}))
const EMBERS = Array.from({ length: 36 }, (_, i) => ({
  left: (i * 37 + 4) % 100,
  delay: (i % 10) * 0.3,
  duration: 3 + (i % 6) * 0.7,
  size: 4 + (i % 5) * 4,
  drift: ((i % 7) - 3) * 22,
  hue: [18, 28, 38, 8][i % 4],
}))

/** A single particle body — a user image/SVG when provided, else the built-in
 *  `fallback` shape. When several images are supplied, `seed` picks one
 *  deterministically so the layer doesn't reshuffle on every render. */
function Particle({
  images,
  seed = 0,
  fallback,
}: {
  images?: string[]
  seed?: number
  fallback: React.ReactNode
}) {
  if (images && images.length > 0) {
    const src = images[(seed * 7 + 3) % images.length]
    return <img src={src} alt="" className="h-full w-full object-contain" draggable={false} />
  }
  return <>{fallback}</>
}

/** Shared props for every particle layer. `images` (when non-empty) overrides
 *  the built-in shapes; each particle picks one at random via its index seed. */
interface LayerProps {
  images?: string[]
  color?: string
}

const layerWrap = 'pointer-events-none absolute inset-0 z-[5] overflow-hidden'

function SparkleLayer({ images, color }: LayerProps) {
  const tint = color || '#ffe5a3'
  const hasImg = !!images?.length
  return (
    <div className={layerWrap}>
      {SPARKLES.map((s, i) => (
        <motion.span
          key={i}
          className="absolute"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            filter: hasImg ? undefined : `drop-shadow(0 0 ${s.size / 2}px ${tint})`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1, 0], rotate: [0, s.spin] }}
          transition={{ duration: 1.5, delay: s.delay, repeat: Infinity, repeatDelay: 0.5, ease: 'easeInOut' }}
        >
          <Particle
            images={images}
            seed={i}
            fallback={
              <svg viewBox="0 0 24 24" width="100%" height="100%" fill={tint} aria-hidden>
                <path d="M12 0l2.5 9.5L24 12l-9.5 2.5L12 24l-2.5-9.5L0 12l9.5-2.5z" />
              </svg>
            }
          />
        </motion.span>
      ))}
    </div>
  )
}

function PetalsLayer({ images, color }: LayerProps) {
  return (
    <div className={layerWrap}>
      {PETALS.map((p, i) => (
        <motion.span
          key={i}
          className="absolute -top-12 block"
          style={{ left: `${p.left}%`, width: p.size, height: p.size }}
          initial={{ y: -40, x: 0, opacity: 0, rotate: 0 }}
          animate={{
            y: '112vh',
            x: [0, p.sway, -p.sway, p.drift],
            opacity: [0, 1, 1, 0.7],
            rotate: [0, 220, 360],
          }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeIn' }}
        >
          <Particle
            images={images}
            seed={i}
            fallback={
              <span
                className="block h-full w-full rounded-[100%_0_100%_0]"
                style={{ background: color || `hsl(${p.hue} 72% 78%)` }}
              />
            }
          />
        </motion.span>
      ))}
    </div>
  )
}

function ConfettiLayer({ images, color }: LayerProps) {
  const hasImg = !!images?.length
  return (
    <div className={layerWrap}>
      {CONFETTI.map((c, i) => (
        <motion.span
          key={i}
          className="absolute -top-10 block"
          style={{ left: `${c.left}%`, width: hasImg ? c.h : c.w, height: c.h }}
          initial={{ y: -30, x: 0, opacity: 0, rotate: 0 }}
          animate={{ y: '114vh', x: [0, c.drift, -c.drift / 2], opacity: [0, 1, 1, 0.85], rotate: c.spin }}
          transition={{ duration: c.duration, delay: c.delay, repeat: Infinity, ease: 'easeIn' }}
        >
          <Particle
            images={images}
            seed={i}
            fallback={
              <span
                className="block h-full w-full rounded-[2px]"
                style={{ background: color || `hsl(${c.hue} 85% 60%)` }}
              />
            }
          />
        </motion.span>
      ))}
    </div>
  )
}

/** Rain — thin near-vertical streaks falling fast with a slight slant. */
function RainLayer({ images, color }: LayerProps) {
  const tint = color || 'rgba(174,198,230,0.7)'
  return (
    <div className={layerWrap}>
      {RAIN.map((r, i) => (
        <motion.span
          key={i}
          className="absolute -top-10 block"
          style={{ left: `${r.left}%`, width: 2, height: r.len }}
          initial={{ y: -40, x: 0, opacity: 0 }}
          animate={{ y: '114vh', x: r.drift, opacity: [0, 0.8, 0.8, 0] }}
          transition={{ duration: r.duration, delay: r.delay, repeat: Infinity, ease: 'easeIn' }}
        >
          <Particle
            images={images}
            seed={i}
            fallback={
              <span
                className="block h-full w-full rounded-full"
                style={{ background: `linear-gradient(${tint}, transparent)` }}
              />
            }
          />
        </motion.span>
      ))}
    </div>
  )
}

/** Leaves drifting on the wind — diagonal crossing with sway + 3D tumble. */
function LeavesLayer({ images, color }: LayerProps) {
  return (
    <div className={layerWrap}>
      {LEAVES.map((l, i) => (
        <motion.span
          key={i}
          className="absolute -left-12 block"
          style={{ top: `${l.top}%`, width: l.size, height: l.size }}
          initial={{ x: -60, y: 0, opacity: 0, rotate: 0 }}
          animate={{
            x: '108vw',
            y: [0, l.sway, -l.sway, l.sway / 2],
            opacity: [0, 1, 1, 0.7],
            rotate: [0, l.spin],
            rotateX: [0, 180, 360],
          }}
          transition={{ duration: l.duration, delay: l.delay, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Particle
            images={images}
            seed={i}
            fallback={
              <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden fill={color || `hsl(${l.hue} 65% 45%)`}>
                <path d="M21 3C10 3 3 10 3 21c11 0 18-7 18-18zM7 17C9 11 13 7 19 5 13 7 9 11 7 17z" />
              </svg>
            }
          />
        </motion.span>
      ))}
    </div>
  )
}

/** Bokeh — soft, blurred glowing orbs rising slowly. */
function BokehLayer({ images, color }: LayerProps) {
  const hasImg = !!images?.length
  return (
    <div className={layerWrap}>
      {BOKEH.map((b, i) => (
        <motion.span
          key={i}
          className="absolute -bottom-24 block"
          style={{
            left: `${b.left}%`,
            width: b.size,
            height: b.size,
            filter: hasImg ? undefined : 'blur(6px)',
          }}
          initial={{ y: 0, x: 0, opacity: 0, scale: 0.8 }}
          animate={{ y: '-118vh', x: [0, b.drift, -b.drift], opacity: [0, b.maxOpacity, b.maxOpacity, 0], scale: [0.8, 1.1, 0.9] }}
          transition={{ duration: b.duration, delay: b.delay, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Particle
            images={images}
            seed={i}
            fallback={
              <span
                className="block h-full w-full rounded-full"
                style={{ background: color || `radial-gradient(circle at 35% 35%, hsl(${b.hue} 90% 80%), transparent 70%)` }}
              />
            }
          />
        </motion.span>
      ))}
    </div>
  )
}

/** Fireflies — small glowing dots wandering organically and blinking. */
function FirefliesLayer({ images, color }: LayerProps) {
  const tint = color || '#c6ff7a'
  const hasImg = !!images?.length
  return (
    <div className={layerWrap}>
      {FIREFLIES.map((f, i) => (
        <motion.span
          key={i}
          className="absolute block"
          style={{
            left: `${f.left}%`,
            top: `${f.top}%`,
            width: f.size,
            height: f.size,
            filter: hasImg ? undefined : `drop-shadow(0 0 ${f.size}px ${tint})`,
          }}
          initial={{ opacity: 0, x: 0, y: 0 }}
          animate={{
            opacity: [0, 1, 0.3, 1, 0],
            x: [0, f.wanderX, -f.wanderX, f.wanderX / 2, 0],
            y: [0, f.wanderY, -f.wanderY / 2, f.wanderY, 0],
          }}
          transition={{ duration: f.duration, delay: f.delay, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Particle
            images={images}
            seed={i}
            fallback={<span className="block h-full w-full rounded-full" style={{ background: tint }} />}
          />
        </motion.span>
      ))}
    </div>
  )
}

/** Bubbles — translucent bubbles rising with a wobble and a glossy highlight. */
function BubblesLayer({ images, color }: LayerProps) {
  return (
    <div className={layerWrap}>
      {BUBBLES.map((b, i) => (
        <motion.span
          key={i}
          className="absolute -bottom-16 block"
          style={{ left: `${b.left}%`, width: b.size, height: b.size }}
          initial={{ y: 0, x: 0, opacity: 0 }}
          animate={{ y: '-116vh', x: [0, b.sway, -b.sway, b.sway / 2], opacity: [0, 0.9, 0.9, 0] }}
          transition={{ duration: b.duration, delay: b.delay, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Particle
            images={images}
            seed={i}
            fallback={
              <span
                className="relative block h-full w-full rounded-full"
                style={{
                  border: `1px solid ${color || 'rgba(255,255,255,0.8)'}`,
                  background: 'radial-gradient(circle at 30% 28%, rgba(255,255,255,0.9), rgba(255,255,255,0.08) 45%, transparent 70%)',
                }}
              />
            }
          />
        </motion.span>
      ))}
    </div>
  )
}

/** Hearts — floating hearts rising with a gentle sway. */
function HeartsLayer({ images, color }: LayerProps) {
  return (
    <div className={layerWrap}>
      {HEARTS.map((h, i) => (
        <motion.span
          key={i}
          className="absolute -bottom-16 block"
          style={{ left: `${h.left}%`, width: h.size, height: h.size }}
          initial={{ y: 0, x: 0, opacity: 0, rotate: -8 }}
          animate={{ y: '-116vh', x: [0, h.sway, -h.sway, 0], opacity: [0, 1, 1, 0], rotate: [-8, 8, -8] }}
          transition={{ duration: h.duration, delay: h.delay, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Particle
            images={images}
            seed={i}
            fallback={
              <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden fill={color || `hsl(${h.hue} 80% 65%)`}>
                <path d="M12 21s-7.5-4.6-10-9.3C.6 8.3 2 5 5.3 5c2 0 3.5 1.2 4.7 3 1.2-1.8 2.7-3 4.7-3C18 5 19.4 8.3 18 11.7 15.5 16.4 12 21 12 21z" />
              </svg>
            }
          />
        </motion.span>
      ))}
    </div>
  )
}

/** Snow — slow falling flakes with a soft drift. */
function SnowLayer({ images, color }: LayerProps) {
  return (
    <div className={layerWrap}>
      {SNOW.map((s, i) => (
        <motion.span
          key={i}
          className="absolute -top-8 block"
          style={{ left: `${s.left}%`, width: s.size, height: s.size, filter: s.blur ? `blur(${s.blur}px)` : undefined }}
          initial={{ y: -20, x: 0, opacity: 0 }}
          animate={{ y: '112vh', x: [0, s.sway, -s.sway, s.sway / 2], opacity: [0, 1, 1, 0.8] }}
          transition={{ duration: s.duration, delay: s.delay, repeat: Infinity, ease: 'linear' }}
        >
          <Particle
            images={images}
            seed={i}
            fallback={<span className="block h-full w-full rounded-full" style={{ background: color || '#ffffff' }} />}
          />
        </motion.span>
      ))}
    </div>
  )
}

/** Shooting stars — diagonal streaks with a tail that flash across the sky. */
function ShootingStarsLayer({ images, color }: LayerProps) {
  const tint = color || '#ffffff'
  return (
    <div className={layerWrap}>
      {SHOOTERS.map((s, i) => (
        <motion.span
          key={i}
          className="absolute block"
          style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.len, height: 2, transformOrigin: 'left center', rotate: '35deg' }}
          initial={{ x: 0, y: 0, opacity: 0 }}
          animate={{ x: [0, s.travel], y: [0, s.travel * 0.7], opacity: [0, 1, 0] }}
          transition={{ duration: s.duration, delay: s.delay, repeat: Infinity, repeatDelay: 2.4, ease: 'easeIn' }}
        >
          <Particle
            images={images}
            seed={i}
            fallback={
              <span
                className="block h-full w-full rounded-full"
                style={{ background: `linear-gradient(90deg, transparent, ${tint})`, boxShadow: `0 0 6px ${tint}` }}
              />
            }
          />
        </motion.span>
      ))}
    </div>
  )
}

/** Embers — warm glowing sparks rising and fading out. */
function EmbersLayer({ images, color }: LayerProps) {
  const hasImg = !!images?.length
  return (
    <div className={layerWrap}>
      {EMBERS.map((e, i) => (
        <motion.span
          key={i}
          className="absolute -bottom-8 block"
          style={{
            left: `${e.left}%`,
            width: e.size,
            height: e.size,
            filter: hasImg ? undefined : `drop-shadow(0 0 ${e.size}px hsl(${e.hue} 100% 60%))`,
          }}
          initial={{ y: 0, x: 0, opacity: 0, scale: 1 }}
          animate={{ y: '-110vh', x: [0, e.drift, -e.drift / 2], opacity: [0, 1, 1, 0], scale: [1, 0.4] }}
          transition={{ duration: e.duration, delay: e.delay, repeat: Infinity, ease: 'easeOut' }}
        >
          <Particle
            images={images}
            seed={i}
            fallback={<span className="block h-full w-full rounded-full" style={{ background: color || `hsl(${e.hue} 100% 62%)` }} />}
          />
        </motion.span>
      ))}
    </div>
  )
}

/** Maps a particle effect to its layer. `none` renders nothing. */
function ParticleLayer({ effect, images, color }: { effect: ParticleEffect } & LayerProps) {
  switch (effect) {
    case 'sparkle':
      return <SparkleLayer images={images} color={color} />
    case 'petals':
      return <PetalsLayer images={images} color={color} />
    case 'confetti':
      return <ConfettiLayer images={images} color={color} />
    case 'rain':
      return <RainLayer images={images} color={color} />
    case 'leaves':
      return <LeavesLayer images={images} color={color} />
    case 'bokeh':
      return <BokehLayer images={images} color={color} />
    case 'fireflies':
      return <FirefliesLayer images={images} color={color} />
    case 'bubbles':
      return <BubblesLayer images={images} color={color} />
    case 'hearts':
      return <HeartsLayer images={images} color={color} />
    case 'snow':
      return <SnowLayer images={images} color={color} />
    case 'shooting-stars':
      return <ShootingStarsLayer images={images} color={color} />
    case 'embers':
      return <EmbersLayer images={images} color={color} />
    case 'none':
    default:
      return null
  }
}

interface EnvelopeIntroProps {
  config: EnvelopeIntroConfig
  /** Called after the full open animation finishes and the overlay fades away. */
  onDone: () => void
  /** When true, the intro behaves as a one-shot demo: it re-opens on every mount
   *  (used by the editor preview). Default: false (production behavior). */
  demo?: boolean
  /** Full invitation. When provided, the card that emerges from the envelope
   *  shows a live preview of the Hero block — same title, subtitle and date
   *  the visitor is about to see, so the transition from envelope → page feels
   *  continuous. Falls back to a generic preview when omitted. */
  invitation?: Invitation
}

type Stage = 'closed' | 'opening' | 'leaving' | 'gone'

/**
 * Greenvelope-style intro: a closed envelope sits centered on screen. The user
 * taps to open (or auto-open kicks in), the flap rotates back to reveal the
 * lining, the invitation card slides up out of the envelope and grows to fill
 * the viewport, and the overlay fades away to hand off to the real invitation.
 */
export function EnvelopeIntro({ config, onDone, demo, invitation }: EnvelopeIntroProps) {
  const [stage, setStage] = useState<Stage>('closed')

  // Resolve the hero block that drives the card preview, if any.
  const heroBlock = useMemo(() => {
    if (!invitation) return null
    return (
      (invitation.blocks ?? []).find((b) => b.type === 'hero' && b.visible) as
        | InvitationBlock<'hero'>
        | undefined
    ) ?? null
  }, [invitation])

  const envelopeColor = config.envelopeColor || '#a3b88c'
  const liningColor = config.liningColor || '#f4ead7'
  const backgroundColor = config.backgroundColor || '#eef2e5'
  const recipientName = (config.recipientName || '').trim()
  const monogram = (config.monogram || '').trim()
  const hintLabel = (config.hintLabel || '').trim() || 'Toca para abrir'
  const waxColor = config.waxColor || '#9c3a3a'
  const showWax = !!config.wax
  const bgImage = (config.backgroundImage || '').trim()
  const particleColor = (config.particleColor || '').trim() || undefined

  // Resolve the decoupled (effect, transition) pair, falling back to the legacy
  // `openAnimation` selector for invitations created before the split.
  const legacy = resolveLegacy(config.openAnimation)
  const particleEffect: ParticleEffect = config.particleEffect ?? legacy.effect
  const transitionStyle: TransitionStyle = config.transition ?? legacy.transition

  // Resolve particle images: the new list wins, else the legacy single image.
  const particleImages = useMemo(() => {
    const list = (config.particleImages ?? []).map((s) => s.trim()).filter(Boolean)
    if (list.length > 0) return list
    const single = (config.particleImage || '').trim()
    return single ? [single] : []
  }, [config.particleImages, config.particleImage])

  const exitSpec = overlayExit(transitionStyle, config.transitionDuration)
  const exitDurationMs = ((exitSpec.transition as { duration?: number }).duration ?? 0.7) * 1000
  const showParticles = particleEffect !== 'none' && stage !== 'gone'

  // Tone variants used for shading the front/flap so the envelope feels 3D.
  const shaded = useMemo(() => shadeColor(envelopeColor, -8), [envelopeColor])
  const highlight = useMemo(() => shadeColor(envelopeColor, 10), [envelopeColor])

  const open = () => {
    if (stage !== 'closed') return
    setStage('opening')
  }

  // Auto-open after a short pause if configured.
  useEffect(() => {
    if (!config.autoOpen || stage !== 'closed') return
    const t = window.setTimeout(open, 1200)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.autoOpen, stage])

  // Once the flap + card animations have settled, hold the emerged card on
  // screen for ~1.4 s so the guest can read the title/date, then fade the
  // overlay out and let the real invitation underneath take over.
  useEffect(() => {
    if (stage !== 'opening') return
    const hold = config.holdDuration && config.holdDuration > 0 ? config.holdDuration * 1000 : 3200
    const t = window.setTimeout(() => setStage('leaving'), hold)
    return () => window.clearTimeout(t)
  }, [stage, config.holdDuration])

  // While 'leaving', the overlay itself animates out (revealing the page
  // underneath) using the chosen transition. We only flip to 'gone' / unmount
  // once that reveal has finished, so the hand-off reads as one continuous
  // motion instead of a hard cut.
  useEffect(() => {
    if (stage !== 'leaving') return
    const t = window.setTimeout(() => {
      setStage('gone')
      onDone()
    }, demo ? 250 : exitDurationMs)
    return () => window.clearTimeout(t)
  }, [stage, onDone, demo, exitDurationMs])

  // Lock body scroll while the intro is in front of the page.
  useEffect(() => {
    if (stage === 'gone') return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [stage])

  if (stage === 'gone' && !demo) return null

  return (
    <AnimatePresence>
      {stage !== 'gone' && (
        <motion.div
          key="envelope-intro"
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden select-none"
          style={{ background: backgroundColor }}
          initial={{ opacity: 1 }}
          animate={stage === 'leaving' ? exitSpec.exit : { opacity: 1 }}
          transition={stage === 'leaving' ? exitSpec.transition : undefined}
          exit={exitSpec.exit}
          onClick={open}
          role="dialog"
          aria-label="Sobre de invitación"
        >
          {bgImage && (
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage: `url(${bgImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                zIndex: -1,
              }}
            />
          )}
          {showParticles && (
            <ParticleLayer effect={particleEffect} images={particleImages} color={particleColor} />
          )}
          <EnvelopeStage
            stage={stage}
            transitionStyle={transitionStyle}
            leaveDur={exitDurationMs / 1000}
            envelopeColor={envelopeColor}
            shaded={shaded}
            highlight={highlight}
            liningColor={liningColor}
            recipientName={recipientName}
            monogram={monogram}
            showWax={showWax}
            waxColor={waxColor}
            preview={config.cardPreviewImage}
            hero={heroBlock}
            globalAccent={invitation?.globalSettings.colorAccent}
            globalPrimary={invitation?.globalSettings.colorPrimary}
          />

          {/* Hint pill — only while closed */}
          <AnimatePresence>
            {stage === 'closed' && (
              <motion.div
                key="hint"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="pointer-events-none absolute bottom-10 left-1/2 -translate-x-1/2 text-center"
              >
                <motion.span
                  animate={{ opacity: [0.45, 1, 0.45] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                  className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1.5 text-[11px] uppercase tracking-[0.18em] text-ink-700 backdrop-blur"
                >
                  <span aria-hidden>✦</span>
                  {hintLabel}
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Skip button (small, top-right). Lets users bail past the animation. */}
          {stage !== 'leaving' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setStage('leaving')
              }}
              className="absolute right-4 top-4 rounded-full bg-white/70 px-3 py-1 text-[11px] uppercase tracking-widest text-ink-700 hover:bg-white"
            >
              Saltar
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

interface StageProps {
  stage: Stage
  /** Exit transition style — shapes how the card leaves so it matches the overlay. */
  transitionStyle: TransitionStyle
  /** Duration (seconds) of the leaving choreography, kept in sync with the overlay. */
  leaveDur: number
  envelopeColor: string
  shaded: string
  highlight: string
  liningColor: string
  recipientName: string
  monogram: string
  showWax: boolean
  waxColor: string
  preview?: string
  hero: InvitationBlock<'hero'> | null
  globalAccent?: string
  globalPrimary?: string
}

function EnvelopeStage({
  stage,
  transitionStyle,
  leaveDur,
  envelopeColor,
  shaded,
  highlight,
  liningColor,
  recipientName,
  monogram,
  showWax,
  waxColor,
  preview,
  hero,
  globalAccent,
  globalPrimary,
}: StageProps) {
  // Width is responsive; height scales proportionally to keep the envelope ratio.
  const open = stage === 'opening' || stage === 'leaving'

  // How the emerged card leaves, matched to the overlay transition so the two
  // read as one motion. zoom/iris expand the card into the page; slide-up
  // carries it upward with the overlay; fade/dissolve/curtain let it fade in
  // place. The duration is kept in sync with the overlay via `leaveDur`.
  const leavingCard: TargetAndTransition =
    transitionStyle === 'zoom' || transitionStyle === 'iris'
      ? { y: '-30%', scale: 2.4, opacity: 0 }
      : transitionStyle === 'slide-up'
      ? { y: '-160%', scale: 1.2, opacity: 0 }
      : { y: '-58%', scale: 1.3, opacity: 0 }

  const cardAnim = stage === 'leaving'
    ? { ...leavingCard, transition: { duration: leaveDur, ease: EASE_SMOOTH } }
    : open
    ? {
        y: '-58%',
        scale: 1.18,
        opacity: 1,
        transition: { delay: 0.55, duration: 1.05, ease: EASE_SMOOTH },
      }
    : { y: '0%', scale: 1, opacity: 1 }

  // Envelope parts (back, lining, pocket, flap) slide down and fade out during transition.
  const envelopePartsAnim = stage === 'leaving'
    ? { y: '120%', opacity: 0, transition: { duration: leaveDur, ease: EASE_SMOOTH } }
    : { y: '0%', opacity: 1 }

  const stageAnim = stage === 'leaving'
    ? { scale: 1 }
    : open
    ? { scale: 0.96, transition: { delay: 0.25, duration: 1.5, ease: 'easeOut' as Easing } }
    : { scale: 1 }

  // Layer geometry: the flap is a downward-pointing triangle from the top
  // corners to a center apex at FLAP_APEX_PCT down the envelope. The front
  // pocket is the complementary pentagon — corner wedges + bottom half —
  // meeting the flap apex at the same point. Together they cover the entire
  // envelope when closed (no gaps), and they reveal a triangular V-opening
  // when the flap rotates away.
  const FLAP_APEX_PCT = 55

  return (
    <motion.div
      className="relative"
      style={{
        width: 'min(86vw, 460px)',
        aspectRatio: '1.55 / 1',
        perspective: 1400,
      }}
      animate={stageAnim}
    >
      {/* Back of envelope — full rectangle, always behind everything. */}
      <motion.div
        className="absolute inset-0 rounded-[6px]"
        style={{
          background: `linear-gradient(180deg, ${shadeColor(envelopeColor, -4)} 0%, ${shaded} 100%)`,
          boxShadow:
            '0 24px 60px -20px rgba(0,0,0,0.35), 0 8px 18px -8px rgba(0,0,0,0.2)',
        }}
        animate={envelopePartsAnim}
      />

      {/* Lining — the "inside" surface revealed once the flap lifts. Lives at
          z:1, hidden by the flap + front pocket when closed. We fade it in
          slightly so the color transition feels natural. */}
      <motion.div
        className="absolute inset-0 rounded-[6px]"
        style={{ zIndex: 1, background: liningColor }}
        initial={{ opacity: 0, y: '0%' }}
        animate={stage === 'leaving'
          ? { y: '120%', opacity: 0, transition: { duration: leaveDur, ease: EASE_SMOOTH } }
          : {
              opacity: open ? 1 : 0,
              y: '0%',
              transition: { delay: open ? 0.3 : 0, duration: 0.3 },
            }
        }
        aria-hidden
      />

      {/* The card resting inside the envelope. At rest its visible area is
          entirely behind the flap (upper-center triangle), so it's invisible
          until the flap rotates away. */}
      <motion.div
        className="absolute"
        style={{
          left: '10%',
          right: '10%',
          top: '12%',
          height: '76%',
          zIndex: 2,
          transformOrigin: '50% 100%',
        }}
        initial={{ y: '0%', scale: 1, opacity: 1 }}
        animate={cardAnim}
      >
        <CardPreview
          recipientName={recipientName}
          monogram={monogram}
          preview={preview}
          hero={hero}
          accentColor={globalAccent}
          primaryColor={globalPrimary}
        />
      </motion.div>

      {/* Front pocket — pentagon covering the corner wedges + the entire
          bottom half. Its top edge slopes from each upper corner down to a
          shared apex at (50%, FLAP_APEX_PCT). Combined with the flap, it
          tiles the envelope perfectly when closed. */}
      <motion.div
        className="absolute inset-0 rounded-[6px]"
        style={{
          zIndex: 3,
          background: `linear-gradient(180deg, ${envelopeColor} 0%, ${shaded} 100%)`,
          clipPath: `polygon(0 0, 50% ${FLAP_APEX_PCT}%, 100% 0, 100% 100%, 0 100%)`,
          boxShadow: 'inset 0 4px 12px -8px rgba(0,0,0,0.18)',
        }}
        animate={envelopePartsAnim}
      >
        {recipientName && (
          <div
            className="pointer-events-none absolute inset-x-0"
            style={{ top: '72%', textAlign: 'center', color: shadeColor(envelopeColor, -55) }}
          >
            {monogram && (
              <p className="text-[10px] uppercase tracking-[0.4em] opacity-70">{monogram}</p>
            )}
            <p
              className="mt-1 font-serif italic"
              style={{ fontSize: 'clamp(14px, 2.4vw, 20px)' }}
            >
              {recipientName}
            </p>
          </div>
        )}
      </motion.div>

      {/* Flap — downward triangle from the upper corners to the shared apex.
          Hinged at the top edge; rotates 180° on X to open. backface-visibility
          hides the flap once it passes the perpendicular so the lining + card
          can read through. */}
      <motion.div
        className="absolute inset-0 rounded-t-[6px]"
        style={{
          zIndex: 4,
          transformOrigin: '50% 0%',
          willChange: 'transform',
          backfaceVisibility: 'hidden',
          clipPath: `polygon(0 0, 100% 0, 50% ${FLAP_APEX_PCT}%)`,
          background: `linear-gradient(180deg, ${highlight} 0%, ${envelopeColor} 100%)`,
          boxShadow: open ? 'none' : '0 4px 6px -3px rgba(0,0,0,0.18)',
        }}
        initial={{ rotateX: 0, y: '0%', opacity: 1 }}
        animate={stage === 'leaving'
          ? { y: '120%', opacity: 0, transition: { duration: leaveDur, ease: EASE_SMOOTH } }
          : open
          ? { rotateX: 180, y: '0%', opacity: 1 }
          : { rotateX: 0, y: '0%', opacity: 1 }
        }
        transition={stage === 'leaving'
          ? { duration: leaveDur, ease: EASE_SMOOTH }
          : { duration: 0.85, ease: EASE_FLAP, delay: 0.05 }
        }
      >
        {showWax && (
          <div
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              top: `${FLAP_APEX_PCT - 18}%`,
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: `radial-gradient(circle at 35% 30%, ${shadeColor(waxColor, 25)} 0%, ${waxColor} 60%, ${shadeColor(waxColor, -25)} 100%)`,
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            }}
          >
            <div
              className="absolute inset-0 flex items-center justify-center font-serif text-white/80"
              style={{ fontSize: 14 }}
            >
              {monogram ? monogram.slice(0, 1) : '✦'}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

function CardPreview({
  recipientName,
  monogram,
  preview,
  hero,
  accentColor,
  primaryColor,
}: {
  recipientName: string
  monogram: string
  preview?: string
  hero: InvitationBlock<'hero'> | null
  accentColor?: string
  primaryColor?: string
}) {
  // 1) Custom artwork wins if the user provided one explicitly.
  if (preview) {
    return (
      <div
        className="h-full w-full overflow-hidden rounded-[4px] bg-white"
        style={{
          backgroundImage: `url(${preview})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          boxShadow: '0 10px 28px -10px rgba(0,0,0,0.35)',
        }}
      />
    )
  }

  // 2) Real Hero preview — same title, subtitle and date the guest is about
  //    to see on the page, so the card → invitation hand-off feels continuous.
  if (hero) {
    return <HeroCardPreview hero={hero} accentColor={accentColor} primaryColor={primaryColor} />
  }

  // 3) Fallback — no hero block configured yet.
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center rounded-[4px] bg-[#fdf7e8] px-6 text-center"
      style={{ boxShadow: '0 10px 28px -10px rgba(0,0,0,0.35)' }}
    >
      {monogram && (
        <p className="text-[10px] uppercase tracking-[0.4em] text-ink-500">{monogram}</p>
      )}
      <p
        className="mt-2 font-serif italic text-ink-800"
        style={{ fontSize: 'clamp(20px, 4.2vw, 36px)' }}
      >
        {recipientName || 'Tu invitación'}
      </p>
      <span
        className="mt-3 inline-block h-px w-12"
        style={{ background: 'rgba(0,0,0,0.25)' }}
      />
      <p className="mt-3 text-[10px] uppercase tracking-[0.4em] text-ink-500">
        Te esperamos
      </p>
    </div>
  )
}

/**
 * Compact rendering of the Hero block that fits inside the envelope card.
 * Reads the same data the page Hero uses (title, subtitle, eventDate) so
 * when the overlay fades the visitor sees the same content beneath — a
 * seamless transition from envelope to invitation.
 */
function HeroCardPreview({
  hero,
  accentColor,
  primaryColor,
}: {
  hero: InvitationBlock<'hero'>
  accentColor?: string
  primaryColor?: string
}) {
  const data = hero.data as HeroData
  const usingImage = !!data.backgroundImage
  const bg: React.CSSProperties = usingImage
    ? {
        backgroundImage: `url(${data.backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : data.backgroundColor
    ? { backgroundColor: data.backgroundColor }
    : { background: '#fdf7e8' }

  const showSubtitle = data.showSubtitle && !!data.subtitle
  const showTitle = data.showTitle && !!data.title
  const showDate = data.showDate && !!data.eventDate
  const dateLabel = showDate ? formatDate(data.eventDate, data.dateFormat) : ''

  return (
    <div
      className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-[4px] px-4 text-center"
      style={{ ...bg, boxShadow: '0 10px 28px -10px rgba(0,0,0,0.35)' }}
    >
      {/* Subtle wash so text stays legible on photo backgrounds. */}
      {usingImage && (
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: 'rgba(255,255,255,0.55)' }}
        />
      )}
      <div className="relative flex flex-col items-center gap-2">
        {showSubtitle && (
          <p
            className="text-[10px] uppercase tracking-[0.32em]"
            style={{ color: accentColor || '#7a6a4f' }}
          >
            {data.subtitle}
          </p>
        )}
        {showTitle && (
          <h1
            className="font-serif leading-tight"
            style={{
              fontSize: 'clamp(22px, 5.4vw, 44px)',
              color: primaryColor || '#1f2937',
            }}
          >
            {data.title}
          </h1>
        )}
        {showDate && (
          <p
            className="mt-1 text-[10px] uppercase tracking-[0.32em]"
            style={{ color: 'rgba(0,0,0,0.55)' }}
          >
            {dateLabel}
          </p>
        )}
      </div>
    </div>
  )
}

/** Lighten (+) or darken (-) a hex color by `percent` (-100..100). */
function shadeColor(hex: string, percent: number): string {
  const clean = hex.replace('#', '').trim()
  const expanded =
    clean.length === 3
      ? clean.split('').map((c) => c + c).join('')
      : clean.padEnd(6, '0').slice(0, 6)
  const num = parseInt(expanded, 16)
  if (Number.isNaN(num)) return hex
  const r = (num >> 16) & 0xff
  const g = (num >> 8) & 0xff
  const b = num & 0xff
  const adjust = (c: number) => {
    const v = Math.round(c + (percent / 100) * (percent >= 0 ? 255 - c : c))
    return Math.max(0, Math.min(255, v))
  }
  return `#${[adjust(r), adjust(g), adjust(b)]
    .map((c) => c.toString(16).padStart(2, '0'))
    .join('')}`
}
