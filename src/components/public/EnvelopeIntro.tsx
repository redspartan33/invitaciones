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

// How the whole overlay clears once the envelope has opened — the "fancy"
// handoff to the real invitation. The flap-open + card choreography is shared;
// only this exit transition (plus optional particle layers) changes.
const OVERLAY_EXIT: Record<OpenAnimation, { exit: TargetAndTransition; transition: Transition }> = {
  classic: { exit: { opacity: 0, scale: 1.04, filter: 'blur(4px)' }, transition: { duration: 0.55, ease: EASE_SMOOTH } },
  'zoom-burst': { exit: { opacity: 0, scale: 1.8, rotate: 1.5 }, transition: { duration: 0.7, ease: EASE_SMOOTH } },
  curtain: { exit: { opacity: 0, clipPath: 'inset(0 50% 0 50%)' }, transition: { duration: 0.65, ease: EASE_FLAP } },
  dissolve: { exit: { opacity: 0, filter: 'blur(26px) brightness(1.4)', scale: 1.08 }, transition: { duration: 0.8, ease: EASE_SMOOTH } },
  sparkle: { exit: { opacity: 0, scale: 1.06 }, transition: { duration: 0.6, ease: EASE_SMOOTH } },
  petals: { exit: { opacity: 0 }, transition: { duration: 0.7 } },
  confetti: { exit: { opacity: 0, scale: 1.05 }, transition: { duration: 0.6, ease: EASE_SMOOTH } },
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

/** A single particle body — a user image/SVG when provided, else the built-in
 *  `fallback` shape. */
function Particle({ image, fallback }: { image?: string; fallback: React.ReactNode }) {
  if (image) return <img src={image} alt="" className="h-full w-full object-contain" draggable={false} />
  return <>{fallback}</>
}

function SparkleLayer({ image, color }: { image?: string; color?: string }) {
  const tint = color || '#ffe5a3'
  return (
    <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
      {SPARKLES.map((s, i) => (
        <motion.span
          key={i}
          className="absolute"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            filter: image ? undefined : `drop-shadow(0 0 ${s.size / 2}px ${tint})`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1, 0], rotate: [0, s.spin] }}
          transition={{ duration: 1.5, delay: s.delay, repeat: Infinity, repeatDelay: 0.5, ease: 'easeInOut' }}
        >
          <Particle
            image={image}
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

function PetalsLayer({ image, color }: { image?: string; color?: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
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
            image={image}
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

function ConfettiLayer({ image, color }: { image?: string; color?: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
      {CONFETTI.map((c, i) => (
        <motion.span
          key={i}
          className="absolute -top-10 block"
          style={{ left: `${c.left}%`, width: image ? c.h : c.w, height: c.h }}
          initial={{ y: -30, x: 0, opacity: 0, rotate: 0 }}
          animate={{ y: '114vh', x: [0, c.drift, -c.drift / 2], opacity: [0, 1, 1, 0.85], rotate: c.spin }}
          transition={{ duration: c.duration, delay: c.delay, repeat: Infinity, ease: 'easeIn' }}
        >
          <Particle
            image={image}
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
  const openAnimation: OpenAnimation = config.openAnimation || 'classic'
  const bgImage = (config.backgroundImage || '').trim()
  const particleImage = (config.particleImage || '').trim() || undefined
  const particleColor = (config.particleColor || '').trim() || undefined
  const exitSpec = OVERLAY_EXIT[openAnimation]
  const showSparkles = openAnimation === 'sparkle' && (stage === 'opening' || stage === 'leaving')
  const showPetals = openAnimation === 'petals' && stage !== 'gone'
  const showConfetti = openAnimation === 'confetti' && stage !== 'gone'

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
    const t = window.setTimeout(() => setStage('leaving'), 3200)
    return () => window.clearTimeout(t)
  }, [stage])

  useEffect(() => {
    if (stage !== 'leaving') return
    const t = window.setTimeout(() => {
      console.log('[envelope] transitioning to gone, calling onDone')
      setStage('gone')
      onDone()
    }, demo ? 250 : 850)
    return () => window.clearTimeout(t)
  }, [stage, onDone, demo])

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
          exit={exitSpec.exit}
          transition={exitSpec.transition}
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
          {showPetals && <PetalsLayer image={particleImage} color={particleColor} />}
          {showSparkles && <SparkleLayer image={particleImage} color={particleColor} />}
          {showConfetti && <ConfettiLayer image={particleImage} color={particleColor} />}
          <EnvelopeStage
            stage={stage}
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

  // Card slides up out of the envelope, then scales toward viewport center.
  // In the leaving stage, it flies upward and zooms in (scale 2.2) while fading out,
  // making it look like the invitation is expanding to become the full page.
  const cardAnim = stage === 'leaving'
    ? {
        y: '-120%',
        scale: 2.2,
        opacity: 0,
        transition: { duration: 0.8, ease: EASE_SMOOTH },
      }
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
    ? { y: '120%', opacity: 0, transition: { duration: 0.8, ease: EASE_SMOOTH } }
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
          ? { y: '120%', opacity: 0, transition: { duration: 0.8, ease: EASE_SMOOTH } }
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
          ? { y: '120%', opacity: 0, transition: { duration: 0.8, ease: EASE_SMOOTH } }
          : open
          ? { rotateX: 180, y: '0%', opacity: 1 }
          : { rotateX: 0, y: '0%', opacity: 1 }
        }
        transition={stage === 'leaving'
          ? { duration: 0.8, ease: EASE_SMOOTH }
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
